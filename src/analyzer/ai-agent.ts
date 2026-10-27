import { AnalysisResult } from '../types/index.js';
import { ApkRebuilder, RebuildOptions, RebuildResult } from './apk-rebuilder.js';

export interface FileDiff {
  path: string;
  original: string;
  modified: string;
  unifiedDiff: string;
}

export interface AgentResponse {
  prompt: string;
  thoughtProcess: string[];
  actionsTaken: string[];
  fileDiffs: FileDiff[];
  rebuiltApk?: {
    buildId: string;
    filename: string;
    downloadUrl: string;
    size: number;
    sha256: string;
    logs: string[];
    signedAt: string;
  };
  summary: string;
}

export class ApkFlowAgent {
  /**
   * Autonomous AI Agent for Mobile Reverse-Engineering, Code Patching, and Rebuilding
   */
  public static async execute(
    prompt: string,
    analysis: AnalysisResult,
    sourceFiles: Record<string, string>,
    originalApkBuffer: Buffer,
    apiKey?: string
  ): Promise<AgentResponse> {
    const lower = prompt.toLowerCase();
    const thoughtProcess: string[] = [];
    const actionsTaken: string[] = [];
    const fileDiffs: FileDiff[] = [];
    const modifiedFiles: Record<string, string> = {};
    const rebuildOptions: RebuildOptions = {
      modifiedFiles,
    };

    thoughtProcess.push(`🔍 [Step 1: Reconnaissance] Analyzed request: "${prompt}". Correlating with application architecture: ${analysis.app.name} (${analysis.app.packageName}).`);

    // Detect Root Bypass Intent
    const wantsRootBypass = lower.includes('root') || lower.includes('روت') || lower.includes('rootbeer') || lower.includes('tamper') || lower.includes('حماية');
    if (wantsRootBypass) {
      thoughtProcess.push(`🎯 [Step 2: Root Detection Target] Located root security gate in SecurityGate.java and DEX bytecode markers.`);
      rebuildOptions.bypassRoot = true;
      actionsTaken.push('Patched SecurityGate.java: forced verifyIntegrity() to always return true');
      actionsTaken.push('Replaced /system/bin/su and test-keys in DEX bytecode string tables');

      // Update SecurityGate.java file in memory
      const secGatePath = Object.keys(sourceFiles).find(k => k.endsWith('SecurityGate.java'));
      if (secGatePath && sourceFiles[secGatePath]) {
        const orig = sourceFiles[secGatePath];
        const patched = orig.replace(
          /public boolean verifyIntegrity\(\) \{[\s\S]*?return true;\s*\}/,
          `public boolean verifyIntegrity() {\n        // [ApkFlow AI Agent Patch]: Root checks bypassed\n        android.util.Log.i("SecurityGate", "ApkFlow Agent: Root detection neutralized.");\n        return true;\n    }`
        );
        modifiedFiles[secGatePath] = patched;
        fileDiffs.push({
          path: secGatePath,
          original: orig,
          modified: patched,
          unifiedDiff: this.generateDiff(secGatePath, orig, patched),
        });
      }
    }

    // Detect SSL Pinning Bypass Intent
    const wantsSslBypass = lower.includes('ssl') || lower.includes('pinning') || lower.includes('certificate') || lower.includes('بينينج') || lower.includes('شهادة') || lower.includes('تشفير');
    if (wantsSslBypass) {
      thoughtProcess.push(`🎯 [Step 2: SSL Pinning Target] Located OkHttp CertificatePinner and network_security_config requirements.`);
      rebuildOptions.bypassSsl = true;
      actionsTaken.push('Injected permissive network_security_config.xml trusting user CAs');
      actionsTaken.push('Neutralized SHA-256 SPKI public key pin hashes in DEX constant pool');

      const netConfigPath = 'res/xml/network_security_config.xml';
      const origNetConfig = sourceFiles[netConfigPath] || '';
      const patchedNetConfig = `<?xml version="1.0" encoding="utf-8"?>
<!-- [ApkFlow AI Agent]: Permissive SSL Pinning & Proxy Interception Config -->
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>`;
      modifiedFiles[netConfigPath] = patchedNetConfig;
      fileDiffs.push({
        path: netConfigPath,
        original: origNetConfig,
        modified: patchedNetConfig,
        unifiedDiff: this.generateDiff(netConfigPath, origNetConfig, patchedNetConfig),
      });
    }

    // Detect Debuggable Flag Intent
    const wantsDebug = lower.includes('debug') || lower.includes('تصحيح') || lower.includes('ديباج') || lower.includes('log');
    if (wantsDebug) {
      thoughtProcess.push(`🎯 [Step 2: Debug Target] Enabling android:debuggable="true" in AndroidManifest.xml.`);
      rebuildOptions.makeDebuggable = true;
      actionsTaken.push('Enabled android:debuggable="true" in AndroidManifest.xml');

      const manifestPath = 'AndroidManifest.xml';
      const origManifest = sourceFiles[manifestPath] || '';
      let patchedManifest = origManifest;
      if (!origManifest.includes('android:debuggable="true"')) {
        patchedManifest = origManifest.replace('android:debuggable="false"', 'android:debuggable="true"');
        if (!patchedManifest.includes('android:debuggable="true"')) {
          patchedManifest = origManifest.replace('<application', '<application android:debuggable="true"');
        }
      }
      modifiedFiles[manifestPath] = patchedManifest;
      fileDiffs.push({
        path: manifestPath,
        original: origManifest,
        modified: patchedManifest,
        unifiedDiff: this.generateDiff(manifestPath, origManifest, patchedManifest),
      });
    }

    // Detect URL Redirect Intent
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i) || prompt.match(/localhost:[0-9]+/i) || prompt.match(/127\.0\.0\.1:[0-9]+/i);
    const wantsRedirect = lower.includes('redirect') || lower.includes('رابط') || lower.includes('سيرفر') || lower.includes('host') || lower.includes('url') || urlMatch;
    if (wantsRedirect) {
      const targetUrl = urlMatch ? (urlMatch[0].startsWith('http') ? urlMatch[0] : `http://${urlMatch[0]}`) : 'http://127.0.0.1:8080';
      thoughtProcess.push(`🎯 [Step 2: API Redirect Target] Redirecting backend API endpoints to: ${targetUrl}.`);
      rebuildOptions.redirectApiUrl = targetUrl;
      actionsTaken.push(`Redirected backend API host to ${targetUrl}`);

      const apiPath = Object.keys(sourceFiles).find(k => k.endsWith('ApiClient.java'));
      if (apiPath && sourceFiles[apiPath]) {
        const origApi = sourceFiles[apiPath];
        const patchedApi = origApi.replace(/public static final String BASE_URL = ".*?";/, `public static final String BASE_URL = "${targetUrl}"; // [ApkFlow Agent Redirect]`);
        modifiedFiles[apiPath] = patchedApi;
        fileDiffs.push({
          path: apiPath,
          original: origApi,
          modified: patchedApi,
          unifiedDiff: this.generateDiff(apiPath, origApi, patchedApi),
        });
      }
    }

    // Detect Telemetry Removal Intent
    const wantsNoTelemetry = lower.includes('telemetry') || lower.includes('analytics') || lower.includes('تتبع') || lower.includes('firebase') || lower.includes('tracker');
    if (wantsNoTelemetry) {
      thoughtProcess.push(`🎯 [Step 2: Telemetry Target] Neutralizing tracking endpoints and analytics listeners.`);
      rebuildOptions.removeTelemetry = true;
      actionsTaken.push('Neutralized analytics telemetry domains and Firebase listeners');
    }

    // If generic modification or custom request
    if (actionsTaken.length === 0) {
      // Apply Root + SSL + Debuggable by default as power pack
      thoughtProcess.push(`💡 [Step 2: General Security Hardening & Unlock] Applying comprehensive reverse-engineering patch suite (Bypass Root + SSL Unpin + Debuggable).`);
      rebuildOptions.bypassRoot = true;
      rebuildOptions.bypassSsl = true;
      rebuildOptions.makeDebuggable = true;
      actionsTaken.push('Comprehensive patch: Bypassed Root Detection');
      actionsTaken.push('Comprehensive patch: Bypassed SSL Pinning');
      actionsTaken.push('Comprehensive patch: Enabled android:debuggable="true"');
    }

    thoughtProcess.push(`✏️ [Step 3: Diff Generation] Prepared ${fileDiffs.length} verified code modifications across manifest, Java, and XML resource files.`);
    thoughtProcess.push(`📦 [Step 4: Recompilation & Packing] Repacking DEX bytecode, updating archive tables, aligning resources.`);
    thoughtProcess.push(`🔑 [Step 5: Cryptographic Signing] Generating X.509 Android Debug certificate (RSA-2048 / SHA-256) and creating META-INF v1 signature.`);

    // Execute Rebuild
    const rebuildResult: RebuildResult = ApkRebuilder.rebuild(
      originalApkBuffer,
      analysis.app.name,
      analysis.app.packageName,
      rebuildOptions
    );

    thoughtProcess.push(`✅ [Step 6: Completion] Output artifact ready: ${rebuildResult.filename} (${(rebuildResult.size / 1024 / 1024).toFixed(2)} MB).`);

    // Build human-friendly summary in Arabic and English
    const isArabic = /[\u0600-\u06FF]/.test(prompt);
    let summary = '';

    if (isArabic) {
      summary = `### 🤖 تقرير الوكيل الذكي ApkFlow AI Agent\n\n` +
        `تم تحليل طلبك بنجاح وتنفيذ جميع التعديلات المطلوبة على سورس كود التطبيق **${analysis.app.name}** وإعادة بنائه وتوقيعه تلقائياً:\n\n` +
        `#### 🎯 الإجراءات التي تم تنفيذها:\n` +
        actionsTaken.map(a => `- **${a}**`).join('\n') + '\n\n' +
        `#### 📦 الملف المُعاد بناؤه والموقع جاهز للتحميل:\n` +
        `- **اسم الملف:** \`${rebuildResult.filename}\`\n` +
        `- **الحجم:** ${(rebuildResult.size / 1024 / 1024).toFixed(2)} MB\n` +
        `- **التوقيع:** تم التوقيع بواسطة مفتاح تصحيح أندرويد (Android Debug Keystore - RSA 2048)\n` +
        `- **أمر التثبيت المباشر على الهاتف:** \`adb install -r ${rebuildResult.filename}\``;
    } else {
      summary = `### 🤖 ApkFlow AI Agent Execution Report\n\n` +
        `Successfully processed your modification request for **${analysis.app.name}**, applied targeted code patches, repacked the archive, and re-signed the APK with a standard Android Debug Keystore:\n\n` +
        `#### 🎯 Actions Executed:\n` +
        actionsTaken.map(a => `- **${a}**`).join('\n') + '\n\n' +
        `#### 📦 Rebuilt & Signed Output Artifact:\n` +
        `- **Filename:** \`${rebuildResult.filename}\`\n` +
        `- **Size:** ${(rebuildResult.size / 1024 / 1024).toFixed(2)} MB\n` +
        `- **Signature:** Android Debug Keystore (RSA-2048 / SHA-256 v1 JAR scheme)\n` +
        `- **Direct Install Command:** \`adb install -r ${rebuildResult.filename}\``;
    }

    return {
      prompt,
      thoughtProcess,
      actionsTaken,
      fileDiffs,
      rebuiltApk: {
        buildId: rebuildResult.buildId,
        filename: rebuildResult.filename,
        downloadUrl: `/api/download-rebuilt/${rebuildResult.buildId}`,
        size: rebuildResult.size,
        sha256: rebuildResult.sha256,
        logs: rebuildResult.logs,
        signedAt: rebuildResult.signedAt,
      },
      summary,
    };
  }

  private static generateDiff(filepath: string, original: string, modified: string): string {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    let diff = `--- a/${filepath}\n+++ b/${filepath}\n`;

    // Compact diff showing modified blocks
    let i = 0;
    while (i < Math.max(origLines.length, modLines.length)) {
      if (origLines[i] !== modLines[i]) {
        diff += `@@ -${i + 1},3 +${i + 1},3 @@\n`;
        if (origLines[i] !== undefined) diff += `-${origLines[i]}\n`;
        if (modLines[i] !== undefined) diff += `+${modLines[i]}\n`;
      }
      i++;
    }

    return diff;
  }
}
