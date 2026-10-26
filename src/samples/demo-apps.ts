import { AnalysisResult } from '../types/index.js';

export const DEMO_BANKING_APP: AnalysisResult = {
  id: 'demo_fintech_baridi',
  timestamp: new Date().toISOString(),
  app: {
    name: 'SecureBank Mobile (Fintech)',
    packageName: 'dz.poste.baridimob',
    versionName: '3.4.1',
    versionCode: '3410',
    minSdkVersion: '24',
    targetSdkVersion: '34',
    mainActivity: 'dz.poste.baridimob.ui.splash.SplashActivity',
    activities: [
      'dz.poste.baridimob.ui.splash.SplashActivity',
      'dz.poste.baridimob.ui.auth.LoginActivity',
      'dz.poste.baridimob.ui.otp.OtpVerificationActivity',
      'dz.poste.baridimob.ui.dashboard.DashboardActivity',
      'dz.poste.baridimob.ui.transfer.TransferActivity',
      'dz.poste.baridimob.ui.cards.CardManagementActivity',
    ],
    services: [
      'dz.poste.baridimob.service.PushNotificationService',
      'dz.poste.baridimob.service.SessionKeepAliveService',
    ],
    receivers: [
      'dz.poste.baridimob.receiver.SmsReceiver',
      'dz.poste.baridimob.receiver.BootReceiver',
    ],
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.USE_BIOMETRIC',
      'android.permission.RECEIVE_SMS',
      'android.permission.READ_PHONE_STATE',
    ],
    nativeLibraries: [
      { name: 'libsec-core.so', architecture: 'arm64-v8a', path: 'lib/arm64-v8a/libsec-core.so', isCustomCryptoOrSecurity: true },
      { name: 'libcrypto-jni.so', architecture: 'arm64-v8a', path: 'lib/arm64-v8a/libcrypto-jni.so', isCustomCryptoOrSecurity: true },
    ],
    framework: {
      kind: 'native-kotlin-java',
      displayName: 'Android Native (Kotlin with C++ Security Layer)',
      confidence: 'observed',
      details: 'Built with Kotlin and Jetpack. Cryptographic signatures and root integrity checks are delegated to native C++ JNI libraries (libsec-core.so).',
      hints: [
        'Payload signatures (X-Signature) are calculated inside libsec-core.so to resist Java bytecode patching.',
        'Uses OkHttp3 with CertificatePinner against backend server certificates.',
        'Network requests are encrypted before transmission using AES-256-CBC.',
      ],
    },
    fileSize: 28450120,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    totalClasses: 3410,
    totalStrings: 24890,
  },
  security: {
    rootDetection: {
      found: true,
      confidence: 'observed',
      indicators: [
        'RootBeer detection library in class com.scottyab.rootbeer.RootBeer',
        'Direct check for /system/xbin/su and /system/bin/su',
        'Verification of Build.TAGS test-keys',
        'Magisk manager package detection',
      ],
      bypassTip: 'Bypass with Frida: Hook RootBeer.isRooted() and RootBeer.isRootedWithoutBusyBoxCheck() to return boolean false.',
    },
    sslPinning: {
      found: true,
      confidence: 'observed',
      indicators: [
        'OkHttp3 CertificatePinner configured with SHA-256 SPKI pins',
        'Custom X509TrustManager implementing strict certificate chain check',
      ],
      bypassTip: 'Hook okhttp3.CertificatePinner.check(String, List) to do a no-op return.',
    },
    cryptoPrimitives: [
      {
        algorithm: 'AES-256-CBC / PKCS7Padding',
        description: 'Used to encrypt sensitive HTTP payload fields (e.g. Card PIN, Transfer Amount).',
        locations: ['com.sec.crypto.CipherUtil', 'libcrypto-jni.so'],
      },
      {
        algorithm: 'HMAC-SHA256',
        description: 'Computes X-Signature header: HMAC(secret, Timestamp + ":" + Body).',
        locations: ['com.sec.crypto.HmacSigner', 'libsec-core.so'],
      },
      {
        algorithm: 'RSA-2048',
        description: 'Exchanges session AES key during initial handshake.',
        locations: ['com.sec.crypto.KeyExchange'],
      },
    ],
    hardcodedSecrets: [
      {
        type: 'api_key',
        key: 'Google Maps & Places Key',
        maskedValue: 'AIzaSyD7...K3m8',
        location: 'res/values/strings.xml',
      },
      {
        type: 'firebase_url',
        key: 'Firebase Configuration URL',
        maskedValue: 'https://baridi-app-prod.firebaseio.com',
        location: 'google-services.json in assets',
      },
    ],
    exportedComponents: [
      {
        name: 'dz.poste.baridimob.receiver.SmsReceiver',
        type: 'receiver',
        riskLevel: 'high',
        details: 'Exported SMS receiver can be triggered by external applications if not guarded by signature permissions.',
      },
    ],
  },
  endpoints: [
    {
      id: 'ep_1',
      method: 'POST',
      url: 'https://api.baridimob.dz/api/v1/auth/login',
      path: '/api/v1/auth/login',
      domain: 'api.baridimob.dz',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BaridiMob/3.4.1 (Android; Linux)',
        'X-App-Version': '3.4.1',
        'X-Device-Id': '3a8f9c12-e87a-4290-b1c4',
        'X-Timestamp': '1714152000',
        'X-Signature': 'a8f4c1e09bc4389f41b80c5418b76...',
      },
      samplePayload: {
        username: '0550123456',
        passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        deviceFingerprint: 'SM-G998B_ANDROID_14',
      },
      sampleResponse: {
        status: 'SUCCESS',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNTUwMTIzNDU2IiwiaWF0IjoxNTE2MjM5MDIyfQ...',
        refreshToken: 'rf_90a8f7c162b...',
        expiresIn: 3600,
        user: { name: 'Amine K.', rip: '00799999000123456789' },
      },
      authType: 'none',
      requiresSignature: true,
      signatureAlgorithm: 'HMAC-SHA256',
      sourceContext: 'Discovered in LoginRepository.kt (Retrofit @POST)',
      category: 'auth',
    },
    {
      id: 'ep_2',
      method: 'GET',
      url: 'https://api.baridimob.dz/api/v1/accounts/balance',
      path: '/api/v1/accounts/balance',
      domain: 'api.baridimob.dz',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1Ni...',
        'X-App-Version': '3.4.1',
      },
      sampleResponse: {
        accountNumber: '00799999000123456789',
        currency: 'DZD',
        balance: 145200.50,
        availableBalance: 145200.50,
      },
      authType: 'bearer',
      requiresSignature: false,
      sourceContext: 'Discovered in AccountService.kt (Retrofit @GET)',
      category: 'payment',
    },
    {
      id: 'ep_3',
      method: 'POST',
      url: 'https://api.baridimob.dz/api/v1/transfers/execute',
      path: '/api/v1/transfers/execute',
      domain: 'api.baridimob.dz',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1Ni...',
        'X-Signature': '7c8a9f01bc43...',
        'X-Timestamp': '1714152060',
      },
      samplePayload: {
        sourceAccount: '00799999000123456789',
        destinationRip: '00799999000987654321',
        amount: 5000.00,
        reason: 'Payment for services',
      },
      authType: 'bearer',
      requiresSignature: true,
      signatureAlgorithm: 'HMAC-SHA256',
      sourceContext: 'Discovered in TransferService.kt (Retrofit @POST)',
      category: 'payment',
    },
    {
      id: 'ep_4',
      method: 'GET',
      url: 'https://api.baridimob.dz/api/v1/cards/list',
      path: '/api/v1/cards/list',
      domain: 'api.baridimob.dz',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1Ni...',
      },
      authType: 'bearer',
      requiresSignature: false,
      sourceContext: 'Discovered in CardService.kt',
      category: 'user',
    },
  ],
  flow: {
    nodes: [
      {
        id: 'node_launch',
        type: 'appLaunch',
        title: 'App Splash & Entry',
        subtitle: 'SplashActivity',
        description: 'Launches application, checks network availability, reads device serial and cached config.',
        badge: 'ENTRYPOINT',
        badgeColor: '#3b82f6',
        icon: 'Rocket',
        data: { activity: 'SplashActivity', package: 'dz.poste.baridimob' },
      },
      {
        id: 'node_security',
        type: 'securityGate',
        title: 'Security & Root Gate',
        subtitle: 'RootBeer + Magisk + SSL Pinning',
        description: 'Runs JNI native root checks from libsec-core.so and enforces OkHttp3 CertificatePinner.',
        badge: 'DEFENSE',
        badgeColor: '#ef4444',
        icon: 'ShieldAlert',
        data: { rootCheck: true, sslPinning: true },
      },
      {
        id: 'node_transport',
        type: 'dataLayer',
        title: 'Pinned TLS v1.3 Transport',
        subtitle: 'api.baridimob.dz',
        description: 'Establishes verified encrypted TLS tunnel to backend servers.',
        badge: 'TRANSPORT',
        badgeColor: '#10b981',
        icon: 'Globe',
        data: { domain: 'api.baridimob.dz' },
      },
      {
        id: 'node_auth',
        type: 'authStep',
        title: 'Login & Device Attestation',
        subtitle: 'POST /api/v1/auth/login',
        description: 'Transmits credentials + Device Fingerprint with dynamic HMAC signature; receives JWT Bearer token.',
        badge: 'AUTH',
        badgeColor: '#f59e0b',
        icon: 'Key',
        data: { endpoint: '/api/v1/auth/login' },
      },
      {
        id: 'node_crypto',
        type: 'cryptoStep',
        title: 'JNI Cryptographic Pipeline',
        subtitle: 'HMAC-SHA256 (libsec-core.so)',
        description: 'Generates dynamic X-Signature = HMAC(secretKey, timestamp + ":" + body) before dispatching any monetary requests.',
        badge: 'SIGNING',
        badgeColor: '#8b5cf6',
        icon: 'Lock',
        data: { algorithm: 'HMAC-SHA256', lib: 'libsec-core.so' },
      },
      {
        id: 'node_core_ops',
        type: 'apiEndpoint',
        title: 'Banking & Transfer Operations',
        subtitle: 'POST /api/v1/transfers/execute',
        description: 'Executes card-to-card and account transfers, balance queries, and transaction history downloads.',
        badge: 'API SERVICE',
        badgeColor: '#06b6d4',
        icon: 'CreditCard',
        data: { endpoints: ['/api/v1/accounts/balance', '/api/v1/transfers/execute'] },
      },
      {
        id: 'node_cache',
        type: 'dataLayer',
        title: 'Encrypted Persistence',
        subtitle: 'Android Keystore + Room DB',
        description: 'Caches user preferences and session refresh tokens encrypted via Android Keystore MasterKey.',
        badge: 'LOCAL DB',
        badgeColor: '#64748b',
        icon: 'Database',
        data: { storage: 'EncryptedSharedPreferences' },
      },
    ],
    edges: [
      { id: 'e1', source: 'node_launch', target: 'node_security', label: 'Check Environment', animated: true },
      { id: 'e2', source: 'node_security', target: 'node_transport', label: 'Open Pinned Socket', animated: true },
      { id: 'e3', source: 'node_transport', target: 'node_auth', label: 'Submit Credentials', animated: true },
      { id: 'e4', source: 'node_auth', target: 'node_crypto', label: 'Acquire Token & Keys', animated: true },
      { id: 'e5', source: 'node_crypto', target: 'node_core_ops', label: 'Sign Requests', animated: true },
      { id: 'e6', source: 'node_core_ops', target: 'node_cache', label: 'Store State', animated: false },
    ],
  },
  recipe: {
    overview: 'Complete reverse-engineering breakdown of BaridiMob Banking App protocol.',
    architectureSummary: 'The app relies on Native Kotlin code wrapped with a C++ JNI security module (libsec-core.so). Network communications use Retrofit with OkHttp CertificatePinner and HMAC-SHA256 payload validation.',
    howItWorksInPlainEnglish: 'Upon startup, BaridiMob runs environment checks to ensure the device is not rooted or running in an emulator. It establishes a pinned TLS connection to api.baridimob.dz. During authentication, credentials and device information are signed with an HMAC calculated inside libsec-core.so. Upon successful login, an access token is returned and stored in EncryptedSharedPreferences for balance and transfer queries.',
    stepByStepGuide: [
      {
        step: 1,
        phase: 'Network Interception Setup',
        title: 'Bypass SSL Pinning & Root Detection with Frida',
        explanation: 'The app checks for root indicators and uses OkHttp CertificatePinner. Without bypassing these, network requests will fail with handshake errors.',
        howToBuild: 'Inject Frida script to hook `okhttp3.CertificatePinner.check` and `com.scottyab.rootbeer.RootBeer.isRooted` to return false.',
        gotchas: ['If the app crashes immediately on launch, check if it detects Frida via `/proc/net/tcp` port 27042 scanning.'],
      },
      {
        step: 2,
        phase: 'Extract Request Signing Key',
        title: 'Hook or Reverse JNI Native Library (libsec-core.so)',
        explanation: 'Requests require `X-Signature: HMAC-SHA256(secretKey, timestamp + ":" + body)`. The secretKey is hardcoded or computed inside `libsec-core.so`.',
        howToBuild: 'Use Ghidra to open `libsec-core.so` and inspect the function `Java_dz_poste_baridimob_crypto_Signer_calculateSignature`. Or hook `HMAC_Init_ex` / `MessageDigest.update` with Frida to read the key dynamically from memory.',
      },
      {
        step: 3,
        phase: 'Build the Unofficial TypeScript / Python Client',
        title: 'Implement the Authentication and Transfer Protocol',
        explanation: 'Once you have the signing key, you can send valid requests from Node.js or Python without running the Android app.',
        howToBuild: 'Use the auto-generated code in the Code Generator tab. Provide your phone number and pin to receive the JWT token.',
      },
    ],
    codeSnippets: {
      typescript: `import crypto from 'node:crypto';

export class BaridiMobClient {
  private baseUrl = 'https://api.baridimob.dz';
  private signingKey = 'BARIDI_SECRET_EXTRACTED_FROM_JNI';
  private token: string | null = null;

  private sign(payload: string, timestamp: string): string {
    return crypto.createHmac('sha256', this.signingKey)
      .update(\`\${timestamp}:\${payload}\`)
      .digest('hex');
  }

  async login(phone: string, pin: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({
      username: phone,
      passwordHash: crypto.createHash('sha256').update(pin).digest('hex'),
      deviceFingerprint: 'SM-G998B_ANDROID_14'
    });

    const res = await fetch(\`\${this.baseUrl}/api/v1/auth/login\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BaridiMob/3.4.1 (Android)',
        'X-Timestamp': timestamp,
        'X-Signature': this.sign(body, timestamp)
      },
      body
    });

    const data = await res.json();
    this.token = data.accessToken;
    return data;
  }

  async getBalance() {
    if (!this.token) throw new Error('Login first');
    const res = await fetch(\`\${this.baseUrl}/api/v1/accounts/balance\`, {
      headers: {
        'Authorization': \`Bearer \${this.token}\`,
        'User-Agent': 'BaridiMob/3.4.1 (Android)'
      }
    });
    return await res.json();
  }
}

// Quick run
const client = new BaridiMobClient();
console.log('BaridiMob Client ready to use!');`,
      python: `import time
import hmac
import hashlib
import json
import requests

class BaridiMobClient:
    def __init__(self, signing_key="BARIDI_SECRET_EXTRACTED_FROM_JNI"):
        self.base_url = "https://api.baridimob.dz"
        self.signing_key = signing_key.encode('utf-8')
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "BaridiMob/3.4.1 (Android)"})

    def _sign(self, body: str, timestamp: str) -> str:
        msg = f"{timestamp}:{body}".encode('utf-8')
        return hmac.new(self.signing_key, msg, hashlib.sha256).hexdigest()

    def login(self, phone: str, pin: str):
        timestamp = str(int(time.time()))
        pin_hash = hashlib.sha256(pin.encode('utf-8')).hexdigest()
        body = json.dumps({
            "username": phone,
            "passwordHash": pin_hash,
            "deviceFingerprint": "SM-G998B_ANDROID_14"
        }, separators=(',', ':'))

        headers = {
            "Content-Type": "application/json",
            "X-Timestamp": timestamp,
            "X-Signature": self._sign(body, timestamp)
        }

        res = self.session.post(f"{self.base_url}/api/v1/auth/login", data=body, headers=headers)
        data = res.json()
        token = data.get("accessToken")
        self.session.headers["Authorization"] = f"Bearer {token}"
        return data

    def get_balance(self):
        res = self.session.get(f"{self.base_url}/api/v1/accounts/balance")
        return res.json()

if __name__ == "__main__":
    client = BaridiMobClient()
    print("BaridiMob Python client initialized!")`,
      curl: `curl -X POST "https://api.baridimob.dz/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -H "User-Agent: BaridiMob/3.4.1 (Android)" \\
  -H "X-Timestamp: 1714152000" \\
  -H "X-Signature: YOUR_COMPUTED_HMAC_SIGNATURE" \\
  -d '{"username":"0550123456","passwordHash":"8d969eef...","deviceFingerprint":"SM-G998B_ANDROID_14"}'`,
    },
  },
};
