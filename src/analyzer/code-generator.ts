import { AppMetadata, DiscoveredEndpoint, ReconstructionRecipe, SecurityDossier } from '../types/index.js';

export class CodeGenerator {
  public static generateRecipe(
    app: AppMetadata,
    security: SecurityDossier,
    endpoints: DiscoveredEndpoint[]
  ): ReconstructionRecipe {
    const authEp = endpoints.find(e => e.category === 'auth') || {
      method: 'POST',
      path: '/api/v1/auth/login',
      url: `https://${endpoints[0]?.domain || 'api.example.com'}/api/v1/auth/login`,
      domain: endpoints[0]?.domain || 'api.example.com',
      headers: { 'Content-Type': 'application/json' },
      authType: 'none',
      requiresSignature: true,
    };

    const dataEp = endpoints.find(e => e.category === 'payment' || e.category === 'user' || e.category === 'core') || {
      method: 'GET',
      path: '/api/v1/user/profile',
      url: `https://${endpoints[0]?.domain || 'api.example.com'}/api/v1/user/profile`,
      domain: endpoints[0]?.domain || 'api.example.com',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <TOKEN>' },
      authType: 'bearer',
      requiresSignature: false,
    };

    const domain = endpoints[0]?.domain || 'api.example.com';
    const baseUrl = `https://${domain}`;

    // 1. TypeScript Client Generation
    const tsClient = `import crypto from 'node:crypto';

/**
 * ApkFlow Auto-Generated Client for ${app.name} (${app.packageName})
 * Framework: ${app.framework.displayName}
 * Generated: ${new Date().toISOString()}
 */
export class ${this.cleanClassName(app.name)}Client {
  private baseUrl: string;
  private token: string | null = null;
  private secretKey: string;

  constructor(config?: { baseUrl?: string; secretKey?: string }) {
    this.baseUrl = config?.baseUrl || '${baseUrl}';
    this.secretKey = config?.secretKey || 'YOUR_APP_SIGNING_SECRET';
  }

  /**
   * Generates HMAC-SHA256 request signature required by ${app.name}
   */
  private generateSignature(payload: string, timestamp: string): string {
    const message = \`\${timestamp}:\${payload}\`;
    return crypto.createHmac('sha256', this.secretKey).update(message).digest('hex');
  }

  /**
   * 1. Authentication Handshake
   * Discovered from ${authEp.method} ${authEp.path}
   */
  async login(credentials: { username: string; password?: string; pin?: string }): Promise<{ token: string; user: any }> {
    const timestamp = Date.now().toString();
    const body = JSON.stringify(credentials);
    const signature = this.generateSignature(body, timestamp);

    const response = await fetch(\`\${this.baseUrl}${authEp.path}\`, {
      method: '${authEp.method}',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-App-Version': '${app.versionName}',
        'X-Platform': 'Android',
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(\`Authentication failed: \${response.status} \${await response.text()}\`);
    }

    const data = await response.json();
    this.token = data.accessToken || data.token || 'mock_bearer_token';
    return data;
  }

  /**
   * 2. Core Business Endpoint
   * Discovered from ${dataEp.method} ${dataEp.path}
   */
  async fetchData(params?: Record<string, string>): Promise<any> {
    if (!this.token) {
      throw new Error('Must call login() first before accessing protected endpoints.');
    }

    const url = new URL(\`\${this.baseUrl}${dataEp.path}\`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    }

    const response = await fetch(url.toString(), {
      method: '${dataEp.method}',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': \`Bearer \${this.token}\`,
        'X-App-Version': '${app.versionName}',
      },
    });

    if (!response.ok) {
      throw new Error(\`Request failed: \${response.status} \${await response.text()}\`);
    }

    return await response.json();
  }
}

// Quick Test Execution:
async function main() {
  const client = new ${this.cleanClassName(app.name)}Client();
  console.log('🚀 Initialized client for ${app.name}...');
  // await client.login({ username: 'test_user', pin: '1234' });
  // const data = await client.fetchData();
  // console.log('Result:', data);
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main().catch(console.error);
}
`;

    // 2. Python Client Generation
    const pyClient = `import time
import hmac
import hashlib
import json
import requests

"""
ApkFlow Auto-Generated Python Client for ${app.name} (${app.packageName})
Framework: ${app.framework.displayName}
Generated: ${new Date().toISOString()}
"""

class ${this.cleanClassName(app.name)}Client:
    def __init__(self, base_url="${baseUrl}", secret_key="YOUR_APP_SIGNING_SECRET"):
        self.base_url = base_url.rstrip('/')
        self.secret_key = secret_key.encode('utf-8')
        self.token = None
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36",
            "X-App-Version": "${app.versionName}",
            "X-Platform": "Android",
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

    def _sign_payload(self, body_str: str, timestamp: str) -> str:
        """Calculates HMAC-SHA256 signature for payload verification"""
        message = f"{timestamp}:{body_str}".encode('utf-8')
        return hmac.new(self.secret_key, message, hashlib.sha256).hexdigest()

    def login(self, username: str, pin: str = "1234") -> dict:
        """Authenticates with ${authEp.path}"""
        timestamp = str(int(time.time() * 1000))
        payload = {"username": username, "pin": pin}
        payload_str = json.dumps(payload, separators=(',', ':'))

        headers = {
            "X-Timestamp": timestamp,
            "X-Signature": self._sign_payload(payload_str, timestamp)
        }

        url = f"{self.base_url}${authEp.path}"
        response = self.session.post(url, data=payload_str, headers=headers)
        response.raise_for_status()

        data = response.json()
        self.token = data.get("accessToken") or data.get("token")
        if self.token:
            self.session.headers["Authorization"] = f"Bearer {self.token}"
        return data

    def fetch_data(self) -> dict:
        """Calls core endpoint ${dataEp.path}"""
        if not self.token:
            raise ValueError("You must call login() before fetching authenticated data.")

        url = f"{self.base_url}${dataEp.path}"
        response = self.session.${dataEp.method.toLowerCase()}(url)
        response.raise_for_status()
        return response.json()

if __name__ == "__main__":
    client = ${this.cleanClassName(app.name)}Client()
    print("🚀 Initialized Python client for ${app.name}")
    # client.login("test_user", "1234")
    # print(client.fetch_data())
`;

    // 3. cURL command
    const curlSnippet = `curl -X ${authEp.method} "${authEp.url}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -H "User-Agent: ApkFlow-Agent/1.0" \\
  -H "X-App-Version: ${app.versionName}" \\
  -H "X-Timestamp: $(date +%s)" \\
  -H "X-Signature: YOUR_COMPUTED_HMAC_SIGNATURE" \\
  -d '{"username":"demo_user","pin":"1234"}'`;

    // 4. Step-by-Step Reconstruction Guide
    return {
      overview: `Detailed architecture and protocol breakdown of ${app.name} (${app.packageName}).`,
      architectureSummary: `The app is powered by ${app.framework.displayName}. Network communication is channeled through domain ${domain} utilizing TLS encrypted REST endpoints with ${security.cryptoPrimitives[0]?.algorithm || 'HMAC-SHA256'} request validation.`,
      howItWorksInPlainEnglish: `When ${app.name} launches, it first loads its ${app.mainActivity} component. It runs runtime security checks (${security.rootDetection.found ? 'detects root/jailbreak' : 'verifies OS integrity'}, ${security.sslPinning.found ? 'pins SSL certificates' : 'uses standard certificate authorities'}). Next, it initializes a session via '${authEp.path}', acquiring an authenticated token, which is then passed in the Authorization header to call services like '${dataEp.path}'.`,
      stepByStepGuide: [
        {
          step: 1,
          phase: 'Architecture & Environment',
          title: `Understand the Tech Stack (${app.framework.displayName})`,
          explanation: `The application is packaged as ${app.framework.displayName}. ${app.framework.details}`,
          howToBuild: `If building a modern replacement or unofficial API client, use TypeScript or Python with Axios/Requests. You do not need to reproduce the entire UI—only the network protocol and security contract.`,
          gotchas: [
            app.framework.kind === 'flutter' ? 'Flutter bypasses standard system proxies—use Tun2Socks or Frida for MITM.' : 'Standard HTTP proxies (Burp Suite, Charles, mitmproxy) will work.',
          ],
        },
        {
          step: 2,
          phase: 'Security & Integrity Handling',
          title: 'Bypass Root Detection & SSL Pinning for Research',
          explanation: `The app contains ${security.rootDetection.found ? 'Active Root Detection' : 'No Root Detection'} and ${security.sslPinning.found ? 'SSL Pinning' : 'No SSL Pinning'}.`,
          howToBuild: security.sslPinning.found 
            ? `Use Frida to hook the SSL Pinning verification: hook OkHttp3 CertificatePinner.check() or use Magisk TrustUserCerts module.`
            : `SSL Pinning is not strictly enforced in bytecode, meaning standard User CA installation is sufficient for MITM inspection.`,
          gotchas: [
            'Always inspect network traffic on a clean rooted test device or Corellium VM.',
          ],
        },
        {
          step: 3,
          phase: 'Authentication Protocol',
          title: `Implement Handshake (${authEp.path})`,
          explanation: `Authentication occurs via ${authEp.method} ${authEp.path}. It requires transmitting user identification and receives back an ephemeral bearer token.`,
          howToBuild: `Construct a POST request matching the JSON schema. Store the returned token securely in memory for subsequent API queries.`,
        },
        {
          step: 4,
          phase: 'Payload Signing & Integrity',
          title: `Calculate Request Signature (${security.cryptoPrimitives[0]?.algorithm || 'HMAC-SHA256'})`,
          explanation: `To prevent tampering, requests include custom headers (e.g. X-Signature, X-Timestamp). The server checks whether the HMAC of the payload matches the shared secret or native library calculation.`,
          howToBuild: `Implement the signature function shown in the code generator tab. If the key is inside a native .so library, use Frida memory dump (Memory.readByteArray) to extract the static secret key.`,
        },
        {
          step: 5,
          phase: 'Consuming Business APIs',
          title: `Connect to Endpoints (${endpoints.length} discovered)`,
          explanation: `Once authenticated, you can query services like ${dataEp.path} to fetch balances, transfer funds, or synchronize resources.`,
          howToBuild: `Pass the Bearer token in the 'Authorization' header alongside client version headers (${app.versionName}).`,
        },
      ],
      codeSnippets: {
        typescript: tsClient,
        python: pyClient,
        curl: curlSnippet,
      },
    };
  }

  private static cleanClassName(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleaned) return 'App';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
}
