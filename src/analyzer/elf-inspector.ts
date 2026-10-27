/**
 * ApkFlow Native ELF Binary & JNI Symbol Inspector
 * Parses Android native shared objects (.so) in lib/arm64-v8a, lib/armeabi-v7a, etc.
 * Extracts ELF headers, exported JNI functions, shared library dependencies, and embedded strings.
 */

export interface ElfHeaderInfo {
  isElf: boolean;
  bitness: '32-bit' | '64-bit' | 'unknown';
  endianness: 'little-endian' | 'big-endian' | 'unknown';
  machine: string;
  architecture: 'arm64-v8a' | 'armeabi-v7a' | 'x86_64' | 'x86' | 'unknown';
  type: string;
}

export interface JniExportedMethod {
  rawSymbol: string;
  javaPackage: string;
  javaClass: string;
  javaMethod: string;
  isSpecialHook?: boolean;
}

export interface NativeLibraryAnalysis {
  filename: string;
  architecture: string;
  size: number;
  elfHeader: ElfHeaderInfo;
  exportedJniMethods: JniExportedMethod[];
  importedLibraries: string[];
  securityMitigations: {
    hasStackCanary: boolean;
    hasFortifiedFunctions: boolean;
    hasJniOnLoad: boolean;
  };
  discoveredStrings: string[];
  findings: {
    level: 'HIGH' | 'MEDIUM' | 'INFO';
    title: string;
    description: string;
  }[];
}

export class ElfInspector {
  /**
   * Analyzes an Android .so native shared object binary buffer
   */
  public static inspect(buffer: Buffer, filename: string = 'libnative.so', arch: string = 'arm64-v8a'): NativeLibraryAnalysis {
    const isElf = buffer.length >= 4 &&
      buffer[0] === 0x7F &&
      buffer[1] === 0x45 && // 'E'
      buffer[2] === 0x4C && // 'L'
      buffer[3] === 0x46;   // 'F'

    if (!isElf) {
      return {
        filename,
        architecture: arch,
        size: buffer.length,
        elfHeader: {
          isElf: false,
          bitness: 'unknown',
          endianness: 'unknown',
          machine: 'Not a valid ELF binary',
          architecture: 'unknown',
          type: 'unknown',
        },
        exportedJniMethods: [],
        importedLibraries: [],
        securityMitigations: {
          hasStackCanary: false,
          hasFortifiedFunctions: false,
          hasJniOnLoad: false,
        },
        discoveredStrings: [],
        findings: [{ level: 'INFO', title: 'Non-ELF binary', description: 'The file does not start with standard ELF magic header.' }],
      };
    }

    const bitness = buffer[4] === 2 ? '64-bit' : buffer[4] === 1 ? '32-bit' : 'unknown';
    const endianness = buffer[5] === 1 ? 'little-endian' : buffer[5] === 2 ? 'big-endian' : 'unknown';
    const isLe = endianness === 'little-endian';

    // Machine architecture code at offset 18
    const machineCode = isLe ? buffer.readUInt16LE(18) : buffer.readUInt16BE(18);
    let machine = 'Unknown';
    let detectedArch: NativeLibraryAnalysis['elfHeader']['architecture'] = 'unknown';

    switch (machineCode) {
      case 0x03:
        machine = 'Intel 80386 (x86)';
        detectedArch = 'x86';
        break;
      case 0x28:
        machine = 'ARM (32-bit)';
        detectedArch = 'armeabi-v7a';
        break;
      case 0x3E:
        machine = 'AMD x86-64';
        detectedArch = 'x86_64';
        break;
      case 0xB7:
        machine = 'AArch64 (ARM 64-bit)';
        detectedArch = 'arm64-v8a';
        break;
      default:
        machine = `Unknown Machine (0x${machineCode.toString(16)})`;
    }

    // Extract ASCII / UTF-8 printable strings (length >= 4)
    const strings: string[] = [];
    let curStr = '';
    for (let i = 0; i < buffer.length; i++) {
      const b = buffer[i];
      if (b >= 32 && b <= 126) {
        curStr += String.fromCharCode(b);
      } else {
        if (curStr.length >= 4) {
          strings.push(curStr);
        }
        curStr = '';
      }
    }
    if (curStr.length >= 4) strings.push(curStr);

    // Identify exported JNI methods
    const exportedJniMethods: JniExportedMethod[] = [];
    const seenSymbols = new Set<string>();

    for (const str of strings) {
      if (str.startsWith('Java_') && !seenSymbols.has(str)) {
        seenSymbols.add(str);
        // Symbol format: Java_com_example_app_ClassName_methodName
        const parts = str.split('_');
        if (parts.length >= 3) {
          const methodName = parts[parts.length - 1];
          const className = parts[parts.length - 2];
          const pkgParts = parts.slice(1, parts.length - 2);
          const pkg = pkgParts.join('.');

          exportedJniMethods.push({
            rawSymbol: str,
            javaPackage: pkg || 'com.app',
            javaClass: className,
            javaMethod: methodName,
          });
        }
      } else if (str === 'JNI_OnLoad' || str === 'JNI_OnUnload') {
        if (!seenSymbols.has(str)) {
          seenSymbols.add(str);
          exportedJniMethods.push({
            rawSymbol: str,
            javaPackage: 'NativeRuntime',
            javaClass: 'JNIEnv',
            javaMethod: str,
            isSpecialHook: true,
          });
        }
      }
    }

    // Identify imported shared libraries (.so)
    const importedLibraries: string[] = [];
    const knownLibraries = [
      'libc.so', 'libm.so', 'libdl.so', 'liblog.so', 'libz.so',
      'libcrypto.so', 'libssl.so', 'libart.so', 'libsqlite.so',
      'libandroid.so', 'libGLESv2.so', 'libEGL.so', 'libOpenSLES.so',
    ];
    for (const lib of knownLibraries) {
      if (strings.includes(lib) && !importedLibraries.includes(lib)) {
        importedLibraries.push(lib);
      }
    }
    // Also catch any other string ending with .so
    for (const str of strings) {
      if (str.endsWith('.so') && str.length < 32 && !str.includes('/') && !importedLibraries.includes(str)) {
        importedLibraries.push(str);
      }
    }

    // Security mitigations
    const hasStackCanary = strings.some(s => s.includes('__stack_chk_fail') || s.includes('__stack_chk_guard'));
    const hasFortifiedFunctions = strings.some(s => s.includes('_chk'));
    const hasJniOnLoad = strings.includes('JNI_OnLoad');

    // Security & Architectural Findings
    const findings: NativeLibraryAnalysis['findings'] = [];

    if (!hasStackCanary) {
      findings.push({
        level: 'HIGH',
        title: 'Missing Stack Canary Protection',
        description: `Binary ${filename} lacks __stack_chk_fail symbols. Buffer overflows can directly overwrite the return instruction pointer. Compile with -fstack-protector-all.`,
      });
    }

    if (exportedJniMethods.length > 0) {
      findings.push({
        level: 'INFO',
        title: `Exported JNI Functions (${exportedJniMethods.length})`,
        description: `Discovered direct JNI bridge functions interfacing with Java/Kotlin layer, including: ${exportedJniMethods.slice(0, 3).map(m => m.javaClass + '.' + m.javaMethod).join(', ')}.`,
      });
    }

    if (strings.some(s => s.toLowerCase().includes('root') || s.toLowerCase().includes('/system/bin/su'))) {
      findings.push({
        level: 'MEDIUM',
        title: 'Native Anti-Root / Jailbreak Detection',
        description: `Binary ${filename} references root binary paths (/system/bin/su or Magisk) directly inside compiled C/C++ machine code to resist dynamic tampering.`,
      });
    }

    if (importedLibraries.includes('libcrypto.so') || importedLibraries.includes('libssl.so') || strings.some(s => s.includes('EVP_Encrypt') || s.includes('AES_cbc_encrypt'))) {
      findings.push({
        level: 'MEDIUM',
        title: 'Native OpenSSL / Cryptographic Engine',
        description: `Binary uses native cryptographic primitives (libcrypto / OpenSSL), commonly utilized for custom payload encryption or proprietary HMAC hashing.`,
      });
    }

    // Filter interesting discovered strings (URLs, keys, paths, error msgs)
    const interestingStrings = strings.filter(s => 
      s.startsWith('http://') || 
      s.startsWith('https://') || 
      s.startsWith('/system/') || 
      s.startsWith('/data/') ||
      s.includes('AES') || 
      s.includes('RSA') || 
      s.includes('Key') || 
      s.includes('Secret') ||
      s.includes('Error')
    ).slice(0, 50);

    return {
      filename,
      architecture: detectedArch !== 'unknown' ? detectedArch : arch,
      size: buffer.length,
      elfHeader: {
        isElf: true,
        bitness,
        endianness,
        machine,
        architecture: detectedArch,
        type: 'ET_DYN (Shared Object / Dynamic Library)',
      },
      exportedJniMethods,
      importedLibraries,
      securityMitigations: {
        hasStackCanary,
        hasFortifiedFunctions,
        hasJniOnLoad,
      },
      discoveredStrings: interestingStrings,
      findings,
    };
  }
}
