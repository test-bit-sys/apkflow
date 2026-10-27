import { AnalysisResult } from '../types/index.js';

export interface FridaSuite {
  packageName: string;
  fullScript: string;
  modules: {
    rootBypass: string;
    sslUnpinning: string;
    cryptoSpy: string;
    nativeJni: string;
    methodTracer: string;
  };
  cliCommands: {
    usbSpawn: string;
    usbAttach: string;
    objectionSpawn: string;
  };
}

export class FridaGenerator {
  /**
   * Synthesizes tailored Frida dynamic instrumentation scripts based on detected
   * classes, security libraries, cryptographic algorithms, and native JNI targets.
   */
  public static generate(analysis: AnalysisResult): FridaSuite {
    const pkg = analysis.app.packageName;
    const hasRootBeer = analysis.security.rootDetection.indicators.some(i => i.toLowerCase().includes('rootbeer'));
    const hasOkHttp = analysis.security.sslPinning.indicators.some(i => i.toLowerCase().includes('okhttp'));
    const nativeLibs = analysis.app.nativeLibraries || [];

    // 1. Root & Tamper Bypass Module
    const rootBypass = `/* ============================================================
 * [ApkFlow] 1. Root & Tamper Detection Bypass Module
 * Target: ${pkg}
 * ============================================================ */
Java.perform(function () {
    console.log("[ApkFlow] [*] Activating Root Detection Bypass...");

    // 1. Hook RootBeer library if present
    try {
        var RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");
        RootBeer.isRooted.implementation = function () {
            console.log("[ApkFlow] [Hook] RootBeer.isRooted() intercepted -> returning false");
            return false;
        };
        RootBeer.isRootedWithoutBusyBoxCheck.implementation = function () {
            console.log("[ApkFlow] [Hook] RootBeer.isRootedWithoutBusyBoxCheck() intercepted -> returning false");
            return false;
        };
        RootBeer.isRootedWithBusyBoxCheck.implementation = function () {
            console.log("[ApkFlow] [Hook] RootBeer.isRootedWithBusyBoxCheck() intercepted -> returning false");
            return false;
        };
        console.log("[ApkFlow] [+] RootBeer hooks installed successfully.");
    } catch (e) {
        console.log("[ApkFlow] [-] RootBeer class not loaded: " + e.message);
    }

    // 2. Hook File.exists for root binaries (/system/bin/su, Magisk, etc.)
    try {
        var File = Java.use("java.io.File");
        var suBinaries = [
            "/system/bin/su", "/system/xbin/su", "/sbin/su", 
            "/data/local/xbin/su", "/data/local/bin/su", "/system/sd/xbin/su",
            "/system/app/Superuser.apk", "/data/local/su", "/su/bin/su"
        ];
        File.exists.implementation = function () {
            var path = this.getAbsolutePath();
            for (var i = 0; i < suBinaries.length; i++) {
                if (path.indexOf(suBinaries[i]) !== -1) {
                    console.log("[ApkFlow] [Hook] File.exists() called for: " + path + " -> returning false");
                    return false;
                }
            }
            return this.exists();
        };
        console.log("[ApkFlow] [+] File.exists() anti-root hook installed.");
    } catch (e) {
        console.log("[ApkFlow] [-] File hook error: " + e.message);
    }

    // 3. Spoof Build.TAGS test-keys
    try {
        var Build = Java.use("android.os.Build");
        Build.TAGS.value = "release-keys";
        console.log("[ApkFlow] [+] Build.TAGS spoofed to 'release-keys'.");
    } catch (e) {}
});`;

    // 2. Universal SSL Pinning Bypass Module
    const sslUnpinning = `/* ============================================================
 * [ApkFlow] 2. Universal SSL Certificate Pinning Bypass Module
 * Target: OkHttp3, TrustManagerImpl, NetworkSecurityConfig
 * ============================================================ */
Java.perform(function () {
    console.log("[ApkFlow] [*] Activating Universal SSL Pinning Bypass...");

    // 1. OkHttp3 CertificatePinner Bypass
    try {
        var CertificatePinner = Java.use("okhttp3.CertificatePinner");
        CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function (hostname, peerCertificates) {
            console.log("[ApkFlow] [SSL] okhttp3.CertificatePinner.check() bypassed for host: " + hostname);
            return; // No-op: bypass check
        };
        console.log("[ApkFlow] [+] OkHttp3 CertificatePinner hook installed.");
    } catch (e) {
        console.log("[ApkFlow] [-] OkHttp3 CertificatePinner not found: " + e.message);
    }

    // 2. TrustManagerImpl Certificate Chain Bypass (Android 7.0+)
    try {
        var TrustManagerImpl = Java.use("com.android.org.conscrypt.TrustManagerImpl");
        TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
            console.log("[ApkFlow] [SSL] TrustManagerImpl.verifyChain() bypassed for: " + host);
            return untrustedChain;
        };
        console.log("[ApkFlow] [+] Conscrypt TrustManagerImpl hook installed.");
    } catch (e) {
        console.log("[ApkFlow] [-] Conscrypt TrustManagerImpl not found.");
    }

    // 3. Custom X509TrustManager checkServerTrusted bypass
    try {
        var X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
        var TrustManager = Java.registerClass({
            name: "apkflow.TrustAllManager",
            implements: [X509TrustManager],
            methods: {
                checkClientTrusted: function (chain, authType) {},
                checkServerTrusted: function (chain, authType) {
                    console.log("[ApkFlow] [SSL] Custom TrustManager checkServerTrusted() accepted.");
                },
                getAcceptedIssuers: function () { return []; }
            }
        });
        console.log("[ApkFlow] [+] TrustAllManager registered.");
    } catch (e) {}
});`;

    // 3. Real-Time Cryptographic Payload Decryptor & Spy
    const cryptoSpy = `/* ============================================================
 * [ApkFlow] 3. Cryptographic Key & Payload Decryption Spy
 * Intercepts: AES, RSA, HMAC, and Keystore Primitives in Real Time
 * ============================================================ */
Java.perform(function () {
    console.log("[ApkFlow] [*] Activating Cryptographic Payload Decryptor...");

    var ByteString = Java.use("com.android.okhttp.okio.ByteString"); // Helper if available

    function bytesToHex(bytes) {
        if (!bytes) return "null";
        var hex = [];
        for (var i = 0; i < bytes.length; i++) {
            var b = bytes[i] & 0xFF;
            hex.push((b < 16 ? "0" : "") + b.toString(16));
        }
        return hex.join(" ");
    }

    function bytesToString(bytes) {
        if (!bytes) return "";
        var str = "";
        for (var i = 0; i < bytes.length; i++) {
            var c = bytes[i] & 0xFF;
            if (c >= 32 && c <= 126) str += String.fromCharCode(c);
            else str += ".";
        }
        return str;
    }

    // Hook javax.crypto.Cipher.doFinal
    try {
        var Cipher = Java.use("javax.crypto.Cipher");
        Cipher.doFinal.overload('[B').implementation = function (input) {
            var result = this.doFinal(input);
            var algorithm = this.getAlgorithm();
            console.log("\\n[ApkFlow] 🔐 [Cipher.doFinal] Algorithm: " + algorithm);
            console.log("   Input  (" + (input ? input.length : 0) + " bytes): " + bytesToString(input));
            console.log("   Output (" + (result ? result.length : 0) + " bytes): " + bytesToString(result));
            return result;
        };
        console.log("[ApkFlow] [+] javax.crypto.Cipher.doFinal hook installed.");
    } catch (e) {
        console.log("[ApkFlow] [-] Cipher hook error: " + e.message);
    }

    // Hook javax.crypto.Mac.doFinal (HMAC Signatures)
    try {
        var Mac = Java.use("javax.crypto.Mac");
        Mac.doFinal.overload('[B').implementation = function (input) {
            var result = this.doFinal(input);
            console.log("\\n[ApkFlow] ✍️ [Mac.doFinal - Signature Calculated]");
            console.log("   Input Message: " + bytesToString(input));
            console.log("   Resulting Hex: " + bytesToHex(result));
            return result;
        };
        console.log("[ApkFlow] [+] javax.crypto.Mac.doFinal hook installed.");
    } catch (e) {
        console.log("[ApkFlow] [-] Mac hook error: " + e.message);
    }

    // Hook SecretKeySpec (Inspect Cryptographic Keys)
    try {
        var SecretKeySpec = Java.use("javax.crypto.spec.SecretKeySpec");
        SecretKeySpec.$init.overload('[B', 'java.lang.String').implementation = function (keyBytes, algorithm) {
            console.log("\\n[ApkFlow] 🔑 [SecretKeySpec Created] Alg: " + algorithm);
            console.log("   Key Hex:  " + bytesToHex(keyBytes));
            console.log("   Key Text: " + bytesToString(keyBytes));
            return this.$init(keyBytes, algorithm);
        };
        console.log("[ApkFlow] [+] javax.crypto.spec.SecretKeySpec hook installed.");
    } catch (e) {
        console.log("[ApkFlow] [-] SecretKeySpec hook error: " + e.message);
    }
});`;

    // 4. Native JNI Function Interceptor
    const nativeLibName = nativeLibs[0]?.name || 'libsec-core.so';
    const nativeJni = `/* ============================================================
 * [ApkFlow] 4. Native C++ JNI Memory Hook & Tracer
 * Target Library: ${nativeLibName}
 * ============================================================ */
var targetLib = "${nativeLibName}";

function hookNativeExports() {
    var module = Process.findModuleByName(targetLib);
    if (!module) {
        console.log("[ApkFlow] [*] Waiting for native module " + targetLib + " to load in memory...");
        var android_dlopen_ext = Module.findExportByName(null, "android_dlopen_ext");
        if (android_dlopen_ext) {
            Interceptor.attach(android_dlopen_ext, {
                onEnter: function (args) {
                    var path = args[0].readCString();
                    if (path && path.indexOf(targetLib) !== -1) {
                        this.matched = true;
                    }
                },
                onLeave: function (retval) {
                    if (this.matched) {
                        console.log("[ApkFlow] [+] Native module " + targetLib + " loaded!");
                        attachToLib();
                    }
                }
            });
        }
        return;
    }
    attachToLib();
}

function attachToLib() {
    var module = Process.findModuleByName(targetLib);
    if (!module) return;
    console.log("[ApkFlow] [+] Native base address: " + module.base);

    // Enumerate exports
    var exports = module.enumerateExports();
    console.log("[ApkFlow] [*] Found " + exports.length + " exported symbols in " + targetLib);

    exports.forEach(function (exp) {
        if (exp.type === 'function' && exp.name.indexOf('Java_') !== -1) {
            console.log("   Hooking JNI export: " + exp.name + " at " + exp.address);
            try {
                Interceptor.attach(exp.address, {
                    onEnter: function (args) {
                        console.log("\\n[ApkFlow] ⚡ [Native Call -> " + exp.name + "]");
                        console.log("   Arg 0 (JNIEnv*): " + args[0]);
                        console.log("   Arg 1 (jclass/jobject): " + args[1]);
                        console.log("   Arg 2: " + args[2]);
                    },
                    onLeave: function (retval) {
                        console.log("[ApkFlow] ⚡ [" + exp.name + " Return Value]: " + retval);
                    }
                });
            } catch (err) {}
        }
    });
}

setTimeout(hookNativeExports, 500);`;

    // 5. Method Tracer
    const methodTracer = `/* ============================================================
 * [ApkFlow] 5. High-Level Activity & Security Method Tracer
 * ============================================================ */
Java.perform(function () {
    console.log("[ApkFlow] [*] Activity Lifecycle & Intent Tracer Active...");

    var Activity = Java.use("android.app.Activity");
    Activity.onCreate.overload('android.os.Bundle').implementation = function (bundle) {
        console.log("[ApkFlow] 📱 [Activity Launched]: " + this.getClass().getName());
        return this.onCreate(bundle);
    };

    Activity.onResume.implementation = function () {
        console.log("[ApkFlow] 👁️  [Activity Resumed]: " + this.getClass().getName());
        return this.onResume();
    };
});`;

    // Combined Full Script
    const fullScript = `/**
 * ============================================================
 * ⚡ ApkFlow v2.0 Comprehensive Dynamic Instrumentation Suite
 * Target Package: ${pkg}
 * Generated: ${new Date().toISOString()}
 * 
 * Usage:
 *   frida -U -f ${pkg} -l apkflow_agent.js
 * ============================================================
 */

${rootBypass}

${sslUnpinning}

${cryptoSpy}

${nativeJni}

${methodTracer}

console.log("\\n=======================================================");
console.log("✅ [ApkFlow] All dynamic instrumentation hooks deployed!");
console.log("=======================================================\\n");
`;

    return {
      packageName: pkg,
      fullScript,
      modules: {
        rootBypass,
        sslUnpinning,
        cryptoSpy,
        nativeJni,
        methodTracer,
      },
      cliCommands: {
        usbSpawn: `frida -U -f ${pkg} -l apkflow_agent.js`,
        usbAttach: `frida -U -N ${pkg} -l apkflow_agent.js`,
        objectionSpawn: `objection --gadget ${pkg} explore`,
      },
    };
  }
}
