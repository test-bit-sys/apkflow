import { FrameworkInfo, NativeLibInfo } from '../types/index.js';

export class FrameworkDetector {
  public static detect(fileEntries: string[]): { framework: FrameworkInfo; nativeLibraries: NativeLibInfo[] } {
    const nativeLibraries: NativeLibInfo[] = [];

    // Parse all .so libraries
    for (const entry of fileEntries) {
      if (entry.startsWith('lib/') && entry.endsWith('.so')) {
        const parts = entry.split('/');
        const arch = parts.length > 2 ? parts[1] : 'unknown';
        const name = parts[parts.length - 1];
        
        const isCustomCrypto = 
          name.includes('crypto') || 
          name.includes('sec') || 
          name.includes('sign') || 
          name.includes('guard') || 
          name.includes('protect') ||
          name.includes('native');

        nativeLibraries.push({
          name,
          architecture: arch,
          path: entry,
          isCustomCryptoOrSecurity: isCustomCrypto,
        });
      }
    }

    // 1. Flutter Detection
    const hasFlutterSo = fileEntries.some(f => f.includes('libflutter.so') || f.includes('libapp.so'));
    const hasFlutterAssets = fileEntries.some(f => f.startsWith('assets/flutter_assets'));
    if (hasFlutterSo || hasFlutterAssets) {
      return {
        framework: {
          kind: 'flutter',
          displayName: 'Flutter (Dart AOT)',
          confidence: 'observed',
          details: 'Application logic is compiled into Dart Ahead-Of-Time (AOT) binary (libapp.so) using Flutter engine.',
          hints: [
            'HTTP traffic bypasses standard Android proxy settings by default.',
            'Look into libapp.so snapshot for custom protocol structures.',
            'Frida dynamic hook against Dart functions requires offset symbol analysis.',
          ],
        },
        nativeLibraries,
      };
    }

    // 2. React Native Detection
    const hasHermes = fileEntries.some(f => f.includes('libhermes.so'));
    const hasJsBundle = fileEntries.some(f => f.includes('index.android.bundle'));
    const hasReactNativeSo = fileEntries.some(f => f.includes('libreactnativejni.so') || f.includes('libfb.so'));
    if (hasHermes || hasJsBundle || hasReactNativeSo) {
      return {
        framework: {
          kind: 'react-native',
          displayName: hasHermes ? 'React Native (Hermes Bytecode Engine)' : 'React Native (JavaScript Engine)',
          confidence: 'observed',
          details: hasHermes 
            ? 'Application uses Facebook Hermes optimized bytecode. JavaScript logic is pre-compiled into bytecode.'
            : 'Application bundles plain JavaScript code running on standard JSC engine.',
          hints: [
            'API calls and business logic can be inspected in the JS bundle.',
            hasHermes ? 'Use hbctool or hermes-dec to disassemble bytecode back to readable JS.' : 'Bundle is directly readable text.',
            'Network traffic typically uses standard Fetch or Axios wrappers.',
          ],
        },
        nativeLibraries,
      };
    }

    // 3. Unity Detection
    const hasUnity = fileEntries.some(f => f.includes('libunity.so') || f.includes('libil2cpp.so') || f.startsWith('assets/bin/Data'));
    if (hasUnity) {
      const isIl2cpp = fileEntries.some(f => f.includes('libil2cpp.so'));
      return {
        framework: {
          kind: 'unity',
          displayName: isIl2cpp ? 'Unity (IL2CPP / C++)' : 'Unity (Mono / C#)',
          confidence: 'observed',
          details: isIl2cpp 
            ? 'C# scripts are converted to C++ and compiled to native binary (libil2cpp.so) with global-metadata.dat.'
            : 'C# assemblies are loaded via Mono runtime.',
          hints: [
            isIl2cpp ? 'Use Il2CppDumper with global-metadata.dat to restore class structures and method names.' : 'Use dnSpy to decompile assemblies.',
          ],
        },
        nativeLibraries,
      };
    }

    // 4. Cordova / Capacitor Detection
    const hasWebAssets = fileEntries.some(f => f.startsWith('assets/www/') || f.startsWith('assets/public/'));
    if (hasWebAssets) {
      return {
        framework: {
          kind: 'cordova-capacitor',
          displayName: 'Capacitor / Apache Cordova (Hybrid Web)',
          confidence: 'observed',
          details: 'Application uses a WebView wrapper running standard HTML/CSS/JavaScript web assets.',
          hints: [
            'All web assets are plain HTML/JS/CSS stored in assets/www.',
            'API calls and secrets can be viewed directly in source files.',
            'Enable android:debuggable to use Chrome DevTools Remote Inspect.',
          ],
        },
        nativeLibraries,
      };
    }

    // 5. Native C++ Heavy Application
    const customLibs = nativeLibraries.filter(l => l.isCustomCryptoOrSecurity);
    if (customLibs.length > 0) {
      return {
        framework: {
          kind: 'native-kotlin-java',
          displayName: 'Android Native (Kotlin/Java with C++ Security Layer)',
          confidence: 'observed',
          details: `Application is written in Kotlin/Java but relies on native C++ libraries (${customLibs.map(l => l.name).join(', ')}) for security, hashing, or crypto operations.`,
          hints: [
            'Check JNI native method declarations in Java/Kotlin classes.',
            'Use Ghidra or IDA Pro to inspect the exported JNI functions (Java_com_...).',
            'Frida hooks on interceptors can dynamically dump input arguments and keys.',
          ],
        },
        nativeLibraries,
      };
    }

    // 6. Standard Kotlin / Java
    return {
      framework: {
        kind: 'native-kotlin-java',
        displayName: 'Android Pure Native (Kotlin / Java)',
        confidence: 'derived',
        details: 'Standard native Android application using JVM/ART runtime (Dalvik Executable bytecode).',
        hints: [
          'Decompiles smoothly with Jadx into high-quality Java/Kotlin source code.',
          'Network stack usually employs OkHttp3, Retrofit, or Ktor.',
          'Standard Android reverse engineering tools apply out of the box.',
        ],
      },
      nativeLibraries,
    };
  }
}
