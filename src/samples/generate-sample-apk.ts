import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';

/**
 * Script to create a realistic, valid sample APK: QuickPay-Sample.apk
 * Contains:
 * - AndroidManifest.xml (with real components, permissions, exported receivers)
 * - classes.dex (with real URLs, endpoints, RootBeer, OkHttp CertificatePinner, AES-256, HMAC strings)
 * - lib/arm64-v8a/libvault-core.so (Native C++ security library)
 * - assets/app_config.json (Embedded metadata & API keys)
 */

function createDexBuffer(): Buffer {
  // Rich strings to inject into the DEX file
  const stringsToInject = [
    // Framework & System
    'Lcom/quickpay/wallet/ui/SplashActivity;',
    'Lcom/quickpay/wallet/ui/auth/LoginActivity;',
    'Lcom/quickpay/wallet/ui/transfer/TransferActivity;',
    'Lcom/quickpay/wallet/ui/cards/VirtualCardActivity;',
    'Lcom/quickpay/wallet/service/PushNotificationService;',
    'Lcom/quickpay/wallet/receiver/SmsOtpReceiver;',
    'Lcom/quickpay/wallet/crypto/NativeSigner;',
    
    // APIs & Endpoints
    'https://api.quickpay.io/v2/auth/login',
    'https://api.quickpay.io/v2/auth/refresh',
    'https://api.quickpay.io/v2/wallet/balance',
    'https://api.quickpay.io/v2/transfer/instant',
    'https://api.quickpay.io/v2/cards/virtual/generate',
    'https://api.quickpay.io/v2/kyc/status',
    
    // Security & Defenses
    'com.scottyab.rootbeer.RootBeer',
    'isRooted',
    'isRootedWithoutBusyBoxCheck',
    '/system/bin/su',
    '/system/xbin/su',
    '/sbin/su',
    'test-keys',
    'Superuser.apk',
    'com.topjohnwu.magisk',
    
    // SSL Pinning
    'okhttp3.CertificatePinner',
    'CertificatePinner',
    'sha256/WoiWRyIOVNa9ihaBciRSC7XHjliYS9VwUGOIud4PB18=',
    'sha256/JSMzqOOrFdOTRIspY9OiWUs6KGEd2AZihlUMU1++5TU=',
    'javax.net.ssl.X509TrustManager',
    'checkServerTrusted',
    
    // Crypto Primitives
    'AES/CBC/PKCS5Padding',
    'AES/GCM/NoPadding',
    'HmacSHA256',
    'RSA/ECB/PKCS1Padding',
    'AndroidKeyStore',
    'PBKDF2WithHmacSHA256',
    
    // Request Headers & Secrets
    'X-App-Version',
    'X-Signature',
    'X-Timestamp',
    'X-Device-Fingerprint',
    'AIzaSyB8uK92LqMN71ePvXzT4wRa5kO0p21Q9sA', // Google API Key
    'https://quickpay-live-default-rtdb.firebaseio.com', // Firebase URL
    'AKIAIOSFODNN7EXAMPLE', // AWS key
  ];

  // Encode strings
  const stringPool: Buffer[] = [];
  for (const s of stringsToInject) {
    const sBuf = Buffer.from(s, 'utf8');
    // ULEB128 length (for len < 128 it's 1 byte)
    const lenByte = Buffer.from([sBuf.length]);
    const zeroByte = Buffer.from([0]);
    stringPool.push(Buffer.concat([lenByte, sBuf, zeroByte]));
  }

  const stringIdsSize = stringsToInject.length;
  const headerSize = 112; // 0x70
  const stringIdsOff = headerSize;
  const stringDataOffStart = stringIdsOff + stringIdsSize * 4;

  const stringIdBuffers: Buffer[] = [];
  let currentStringDataOffset = stringDataOffStart;

  for (const sBuf of stringPool) {
    const offBuf = Buffer.alloc(4);
    offBuf.writeUInt32LE(currentStringDataOffset, 0);
    stringIdBuffers.push(offBuf);
    currentStringDataOffset += sBuf.length;
  }

  const totalFileSize = currentStringDataOffset;
  const headerBuf = Buffer.alloc(headerSize);

  // Magic: 'dex\n035\0'
  headerBuf.write('dex\n035\0', 0, 8, 'latin1');
  headerBuf.writeUInt32LE(0x12345678, 40); // endian_tag
  headerBuf.writeUInt32LE(totalFileSize, 32); // file_size
  headerBuf.writeUInt32LE(headerSize, 36); // header_size
  headerBuf.writeUInt32LE(stringIdsSize, 56); // string_ids_size
  headerBuf.writeUInt32LE(stringIdsOff, 60); // string_ids_off

  const fullDex = Buffer.concat([
    headerBuf,
    Buffer.concat(stringIdBuffers),
    Buffer.concat(stringPool),
  ]);

  return fullDex;
}

function createAxmlBuffer(): Buffer {
  // A minimal valid binary XML or text fallback with Manifest declarations
  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.quickpay.wallet"
    android:versionCode="2400"
    android:versionName="2.4.0">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.RECEIVE_SMS" />
    <application
        android:name="com.quickpay.wallet.App"
        android:label="QuickPay Wallet">
        <activity
            android:name="com.quickpay.wallet.ui.SplashActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity android:name="com.quickpay.wallet.ui.auth.LoginActivity" />
        <activity android:name="com.quickpay.wallet.ui.transfer.TransferActivity" />
        <activity android:name="com.quickpay.wallet.ui.cards.VirtualCardActivity" />
        <service android:name="com.quickpay.wallet.service.PushNotificationService" />
        <receiver
            android:name="com.quickpay.wallet.receiver.SmsOtpReceiver"
            android:exported="true" />
    </application>
</manifest>`;

  return Buffer.from(manifestXml, 'utf8');
}

export function generateSampleApk(outputPath: string): void {
  const zip = new AdmZip();

  // 1. AndroidManifest.xml
  zip.addFile('AndroidManifest.xml', createAxmlBuffer());

  // 2. classes.dex
  zip.addFile('classes.dex', createDexBuffer());

  // 3. Native library lib/arm64-v8a/libvault-core.so
  const mockSoBytes = Buffer.from(
    '\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00' +
    'Java_com_quickpay_wallet_crypto_NativeSigner_calculateSignature\x00' +
    'Java_com_quickpay_wallet_crypto_NativeSigner_verifyEnvironment\x00' +
    'HMAC_CTX_new\x00HMAC_Init_ex\x00HMAC_Update\x00HMAC_Final\x00'
  );
  zip.addFile('lib/arm64-v8a/libvault-core.so', mockSoBytes);

  // 4. Config in assets
  const appConfig = JSON.stringify({
    appName: 'QuickPay Wallet',
    apiGateway: 'https://api.quickpay.io',
    environment: 'production',
    publicKeyPin: 'sha256/WoiWRyIOVNa9ihaBciRSC7XHjliYS9VwUGOIud4PB18=',
  }, null, 2);
  zip.addFile('assets/app_config.json', Buffer.from(appConfig, 'utf8'));

  zip.writeZip(outputPath);
  console.log(`✅ Generated Sample APK: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
}

// Run if called directly
const outApk = path.resolve(process.cwd(), 'QuickPay-Sample.apk');
generateSampleApk(outApk);
