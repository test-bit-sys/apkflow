import AdmZip from 'adm-zip';

export interface ResolvedApkBundle {
  buffer: Buffer;
  isBundle: boolean;
  bundleType?: 'apks' | 'xapk' | 'apkm' | 'zip';
  baseApkName: string;
  splitApksCount: number;
}

export class ApkBundleResolver {
  /**
   * Automatically detects and extracts primary APK from:
   * - Standard standalone Android APK (.apk)
   * - Split APKs archive (.apks) produced by bundletool / SAI / APKCube
   * - APKPure XAPK bundle (.xapk)
   * - APKMirror bundle (.apkm)
   * - Generic ZIP containing base.apk or .apk files
   */
  public static resolve(inputBuffer: Buffer, filename: string): ResolvedApkBundle {
    try {
      const zip = new AdmZip(inputBuffer);
      const entries = zip.getEntries();

      // 1. Check if this is already a standalone APK (contains AndroidManifest.xml at root)
      const hasRootManifest = entries.some(e => e.entryName === 'AndroidManifest.xml');
      if (hasRootManifest) {
        return {
          buffer: inputBuffer,
          isBundle: false,
          baseApkName: filename,
          splitApksCount: 0,
        };
      }

      // 2. Check for .apk entries inside the archive (Split APKs / Bundle)
      const apkEntries = entries.filter(e => e.entryName.toLowerCase().endsWith('.apk'));
      if (apkEntries.length > 0) {
        // Priority: base.apk, base-master.apk, master.apk, or largest .apk by size
        const sorted = [...apkEntries].sort((a, b) => b.header.size - a.header.size);
        const preferredBase = apkEntries.find(e => {
          const lower = e.entryName.toLowerCase();
          return (
            lower === 'base.apk' ||
            lower.endsWith('/base.apk') ||
            lower.includes('base-master') ||
            lower.includes('master')
          );
        }) || sorted[0];

        const baseApkBuffer = preferredBase.getData();
        const isXapk = entries.some(e => e.entryName === 'manifest.json');
        const lowerName = filename.toLowerCase();
        const bundleType = isXapk 
          ? 'xapk' 
          : lowerName.endsWith('.apkm') 
            ? 'apkm' 
            : lowerName.endsWith('.apks') 
              ? 'apks' 
              : 'zip';

        console.log(`[ApkFlow] Detected ${bundleType.toUpperCase()} bundle (${apkEntries.length} APK splits). Extracted primary base APK: ${preferredBase.entryName} (${(baseApkBuffer.length / 1024 / 1024).toFixed(1)} MB).`);

        return {
          buffer: baseApkBuffer,
          isBundle: true,
          bundleType,
          baseApkName: preferredBase.entryName,
          splitApksCount: apkEntries.length - 1,
        };
      }
    } catch (err) {
      console.warn('[ApkFlow] Warning resolving bundle archive, using raw buffer:', err);
    }

    return {
      buffer: inputBuffer,
      isBundle: false,
      baseApkName: filename,
      splitApksCount: 0,
    };
  }
}
