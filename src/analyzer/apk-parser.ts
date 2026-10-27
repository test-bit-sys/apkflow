import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { AnalysisResult, AppMetadata } from '../types/index.js';
import { AxmlDecoder } from './axml-decoder.js';
import { DexScanner } from './dex-scanner.js';
import { FrameworkDetector } from './framework-detector.js';
import { FlowBuilder } from './flow-builder.js';
import { CodeGenerator } from './code-generator.js';
import { ApkBundleResolver } from './apk-bundle-resolver.js';

export class ApkParser {
  public static async analyze(buffer: Buffer, originalFilename: string = 'app.apk'): Promise<AnalysisResult> {
    // 0. Auto-resolve Split APK bundles (.apks, .xapk, .apkm) to base APK
    const bundleInfo = ApkBundleResolver.resolve(buffer, originalFilename);
    const activeBuffer = bundleInfo.buffer;

    const sha256 = crypto.createHash('sha256').update(activeBuffer).digest('hex');
    const zip = new AdmZip(activeBuffer);
    const zipEntries = zip.getEntries();
    const entryNames = zipEntries.map(e => e.entryName);

    // 1. Detect Framework & Native Libraries
    const { framework, nativeLibraries } = FrameworkDetector.detect(entryNames);

    // 2. Decode AndroidManifest.xml
    const manifestEntry = zipEntries.find(e => e.entryName === 'AndroidManifest.xml');
    let manifestData = {
      packageName: 'com.example.app',
      versionName: '1.0.0',
      versionCode: '1',
      minSdkVersion: '21',
      targetSdkVersion: '34',
      mainActivity: 'MainActivity',
      activities: [] as string[],
      services: [] as string[],
      receivers: [] as string[],
      permissions: [] as string[],
      exportedComponents: [] as any[],
    };

    if (manifestEntry) {
      try {
        const manifestDecoder = new AxmlDecoder(manifestEntry.getData());
        manifestData = manifestDecoder.parse();
      } catch (err) {
        console.error('Failed to parse manifest:', err);
      }
    }

    // 3. Scan DEX Files
    const dexEntries = zipEntries.filter(e => e.entryName.endsWith('.dex'));
    const dexBuffers = dexEntries.map(e => e.getData());
    const dexScanner = new DexScanner(dexBuffers);
    const dexResult = dexScanner.scan();

    // 4. Merge Security Dossier with Exported Components from Manifest
    const security = {
      ...dexResult.security,
      exportedComponents: manifestData.exportedComponents,
    };

    // Human-friendly app name from package name or filename
    const appBaseName = originalFilename.replace(/\.apk$/i, '').replace(/[^a-zA-Z0-9_\-]/g, ' ');
    const displayAppName = appBaseName.length > 2 ? appBaseName : manifestData.packageName.split('.').pop() || 'MobileApp';

    const app: AppMetadata = {
      name: displayAppName.charAt(0).toUpperCase() + displayAppName.slice(1),
      packageName: manifestData.packageName,
      versionName: manifestData.versionName,
      versionCode: manifestData.versionCode,
      minSdkVersion: manifestData.minSdkVersion,
      targetSdkVersion: manifestData.targetSdkVersion,
      mainActivity: manifestData.mainActivity || 'MainActivity',
      activities: manifestData.activities,
      services: manifestData.services,
      receivers: manifestData.receivers,
      permissions: manifestData.permissions,
      nativeLibraries,
      framework,
      fileSize: buffer.length,
      sha256,
      totalClasses: dexResult.detectedClasses.length,
      totalStrings: dexResult.totalStrings,
    };

    // 5. Build Flow Graph (Nodes & Edges)
    const flow = FlowBuilder.buildFlow(app, security, dexResult.endpoints);

    // 6. Generate Reconstruction Code Recipes
    const recipe = CodeGenerator.generateRecipe(app, security, dexResult.endpoints);

    return {
      id: `analysis_${Date.now()}_${sha256.substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      app,
      security,
      endpoints: dexResult.endpoints,
      flow,
      recipe,
    };
  }
}
