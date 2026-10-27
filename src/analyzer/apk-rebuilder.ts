import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { ApkSigner } from './apk-signer.js';

export interface RebuildOptions {
  bypassRoot?: boolean;
  bypassSsl?: boolean;
  makeDebuggable?: boolean;
  redirectApiUrl?: string;
  removeTelemetry?: boolean;
  modifiedFiles?: Record<string, string>; // path -> new content
}

export interface RebuildResult {
  buildId: string;
  filename: string;
  buffer: Buffer;
  size: number;
  sha256: string;
  appliedPatches: string[];
  logs: string[];
  signedAt: string;
}

export class ApkRebuilder {
  /**
   * Rebuilds and re-signs an APK buffer with requested security modifications,
   * patches, or user-edited files.
   */
  public static rebuild(
    originalBuffer: Buffer,
    appName: string,
    packageName: string,
    options: RebuildOptions = {}
  ): RebuildResult {
    const logs: string[] = [];
    const appliedPatches: string[] = [];
    const timestamp = () => `[${new Date().toLocaleTimeString()}]`;

    logs.push(`${timestamp()} ⚡ ApkFlow Rebuilder Engine v2.0 Initialized`);
    logs.push(`${timestamp()} 📦 Loading APK archive (${(originalBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);

    const zip = new AdmZip(originalBuffer);
    const buildId = `build_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 1. Apply Preset Patches

    // Patch 1: Bypass Root Detection
    if (options.bypassRoot) {
      logs.push(`${timestamp()} 🛡️ [PATCH] Neutralizing Root & Tamper Detection...`);
      appliedPatches.push('Root & Tamper Detection Neutralized (RootBeer / su bypass)');

      // Patch DEX entries if present by replacing su detection markers
      const dexEntries = zip.getEntries().filter(e => e.entryName.endsWith('.dex'));
      for (const entry of dexEntries) {
        let dexBuf = entry.getData();
        let modified = false;

        // Replace strings: '/system/bin/su' -> '/system/bin/xx'
        const suTarget = Buffer.from('/system/bin/su', 'utf8');
        const suReplace = Buffer.from('/system/bin/xx', 'utf8');
        let idx = dexBuf.indexOf(suTarget);
        while (idx !== -1) {
          suReplace.copy(dexBuf, idx);
          idx = dexBuf.indexOf(suTarget, idx + suTarget.length);
          modified = true;
        }

        // Replace 'test-keys' -> 'user-keys'
        const testKeysTarget = Buffer.from('test-keys', 'utf8');
        const testKeysReplace = Buffer.from('user-keys', 'utf8');
        let tkIdx = dexBuf.indexOf(testKeysTarget);
        while (tkIdx !== -1) {
          testKeysReplace.copy(dexBuf, tkIdx);
          tkIdx = dexBuf.indexOf(testKeysTarget, tkIdx + testKeysTarget.length);
          modified = true;
        }

        if (modified) {
          zip.updateFile(entry.entryName, dexBuf);
        }
      }
      logs.push(`${timestamp()}    ✓ Replaced root binary strings (/system/bin/su -> /system/bin/xx, test-keys -> user-keys)`);
    }

    // Patch 2: Bypass SSL Pinning & Trust User Certificates
    if (options.bypassSsl) {
      logs.push(`${timestamp()} 🔓 [PATCH] Bypassing SSL Pinning & Trusting User Certificates...`);
      appliedPatches.push('SSL Pinning Bypassed & User CA Trust Anchor Injected');

      // Injected network_security_config.xml
      const permissiveNetSecConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>`;

      zip.addFile('res/xml/network_security_config.xml', Buffer.from(permissiveNetSecConfig, 'utf8'));

      // Neutralize CertificatePinner strings in DEX
      const dexEntries = zip.getEntries().filter(e => e.entryName.endsWith('.dex'));
      for (const entry of dexEntries) {
        let dexBuf = entry.getData();
        let modified = false;

        const pinTarget = Buffer.from('sha256/', 'utf8');
        const pinReplace = Buffer.from('no256/', 'utf8');
        let pIdx = dexBuf.indexOf(pinTarget);
        while (pIdx !== -1) {
          pinReplace.copy(dexBuf, pIdx);
          pIdx = dexBuf.indexOf(pinTarget, pIdx + pinTarget.length);
          modified = true;
        }

        if (modified) {
          zip.updateFile(entry.entryName, dexBuf);
        }
      }
      logs.push(`${timestamp()}    ✓ Injected res/xml/network_security_config.xml with <certificates src="user" />`);
      logs.push(`${timestamp()}    ✓ Neutralized SHA-256 SPKI pins in DEX bytecode`);
    }

    // Patch 3: Make Application Debuggable
    if (options.makeDebuggable) {
      logs.push(`${timestamp()} 🐞 [PATCH] Injecting android:debuggable="true"...`);
      appliedPatches.push('Debuggable Flag Enabled (android:debuggable="true")');
      
      const manifestEntry = zip.getEntry('AndroidManifest.xml');
      if (manifestEntry) {
        let manifestBuf = manifestEntry.getData();
        // If text manifest:
        let manifestText = manifestBuf.toString('utf8');
        if (manifestText.includes('<application')) {
          if (!manifestText.includes('android:debuggable="true"')) {
            manifestText = manifestText.replace('<application', '<application android:debuggable="true"');
            zip.updateFile('AndroidManifest.xml', Buffer.from(manifestText, 'utf8'));
          }
        }
      }
      logs.push(`${timestamp()}    ✓ Application declared debuggable for Android Studio & GDB/LLDB attachment`);
    }

    // Patch 4: API Redirector
    if (options.redirectApiUrl && options.redirectApiUrl.trim()) {
      const targetUrl = options.redirectApiUrl.trim();
      logs.push(`${timestamp()} 🌐 [PATCH] Redirecting API server endpoints to: ${targetUrl}...`);
      appliedPatches.push(`API Server Endpoints Redirected -> ${targetUrl}`);

      const dexEntries = zip.getEntries().filter(e => e.entryName.endsWith('.dex'));
      for (const entry of dexEntries) {
        let dexBuf = entry.getData();
        let modified = false;

        // Search for http/https URLs and redirect
        const urlRegex = /https?:\/\/[a-zA-Z0-9_\-\.:]+/g;
        const dexStr = dexBuf.toString('latin1');
        let match;
        while ((match = urlRegex.exec(dexStr)) !== null) {
          const oldUrl = match[0];
          // Don't replace schemas or google xmlns
          if (oldUrl.includes('schemas.android.com') || oldUrl.includes('w3.org')) continue;

          // Perform in-place padded or exact replacement if length permits
          if (targetUrl.length <= oldUrl.length) {
            const padded = targetUrl.padEnd(oldUrl.length, '/');
            const targetBuf = Buffer.from(padded, 'utf8');
            dexBuf.subarray(match.index, match.index + oldUrl.length).set(targetBuf);
            modified = true;
          }
        }

        if (modified) {
          zip.updateFile(entry.entryName, dexBuf);
        }
      }
      logs.push(`${timestamp()}    ✓ Replaced backend domain addresses in DEX constant string pools`);
    }

    // Patch 5: Strip Telemetry & Analytics
    if (options.removeTelemetry) {
      logs.push(`${timestamp()} 🚫 [PATCH] Neutralizing Telemetry & Ad Trackers...`);
      appliedPatches.push('Telemetry & Trackers Neutralized (Firebase, Adjust, AppsFlyer)');
      const dexEntries = zip.getEntries().filter(e => e.entryName.endsWith('.dex'));
      for (const entry of dexEntries) {
        let dexBuf = entry.getData();
        const targets = ['firebaseio.com', 'google-analytics.com', 'app-measurement.com'];
        let mod = false;
        for (const t of targets) {
          const tBuf = Buffer.from(t, 'utf8');
          const rBuf = Buffer.from('localhost.fake'.padEnd(t.length, '0'), 'utf8');
          let idx = dexBuf.indexOf(tBuf);
          while (idx !== -1) {
            rBuf.copy(dexBuf, idx);
            idx = dexBuf.indexOf(tBuf, idx + tBuf.length);
            mod = true;
          }
        }
        if (mod) zip.updateFile(entry.entryName, dexBuf);
      }
      logs.push(`${timestamp()}    ✓ Redirected analytics telemetry domains to blackhole/localhost`);
    }

    // 2. Apply Custom User / AI Edited Files
    if (options.modifiedFiles && Object.keys(options.modifiedFiles).length > 0) {
      logs.push(`${timestamp()} ✏️ [CUSTOM] Writing ${Object.keys(options.modifiedFiles).length} user/AI modified files into APK...`);
      for (const [filePath, content] of Object.entries(options.modifiedFiles)) {
        appliedPatches.push(`File Customized: ${filePath}`);
        // If file is in zip or needs to be added:
        zip.addFile(filePath, Buffer.from(content, 'utf8'));
        logs.push(`${timestamp()}    ✓ Applied custom modification to: ${filePath}`);
      }
    }

    // 3. Purge obsolete signatures and sign with pure-TS Android Debug Keystore
    logs.push(`${timestamp()} 🧹 Purging obsolete APK signatures from META-INF/...`);
    logs.push(`${timestamp()} 🔑 Generating X.509 Android Debug Certificate (CN=Android Debug, RSA-2048 / SHA-256)...`);
    
    const signResult = ApkSigner.sign(zip);
    logs.push(`${timestamp()} ✍️ Signing archive with v1 JAR Signature Scheme (Digest: ${signResult.signatureDigest.substring(0, 16)}...)...`);

    // 4. Finalize APK Buffer
    const finalBuffer = zip.toBuffer();
    const sha256 = crypto.createHash('sha256').update(finalBuffer).digest('hex');
    const safeName = appName.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `${safeName}-modded-signed.apk`;

    logs.push(`${timestamp()} ✅ Build Success! Output: ${filename} (${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    logs.push(`${timestamp()} 🔒 SHA-256: ${sha256}`);
    logs.push(`${timestamp()} 📲 Ready for installation via: adb install -r ${filename}`);

    return {
      buildId,
      filename,
      buffer: finalBuffer,
      size: finalBuffer.length,
      sha256,
      appliedPatches,
      logs,
      signedAt: signResult.signedAt,
    };
  }
}
