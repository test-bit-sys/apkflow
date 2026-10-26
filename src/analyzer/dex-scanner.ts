import { DiscoveredEndpoint, SecurityDossier } from '../types/index.js';

export interface DexScanResult {
  totalStrings: number;
  endpoints: DiscoveredEndpoint[];
  security: SecurityDossier;
  detectedClasses: string[];
}

export class DexScanner {
  private buffers: Buffer[];

  constructor(buffers: Buffer[]) {
    this.buffers = buffers;
  }

  public scan(): DexScanResult {
    const allStrings: Set<string> = new Set();

    for (const buf of this.buffers) {
      const strings = this.extractDexStrings(buf);
      for (const s of strings) {
        allStrings.add(s);
      }
    }

    const stringList = Array.from(allStrings);
    const endpoints = this.extractEndpoints(stringList);
    const security = this.extractSecurityDossier(stringList);
    const detectedClasses = stringList.filter(s => s.startsWith('L') && s.endsWith(';') && s.includes('/')).slice(0, 50);

    return {
      totalStrings: allStrings.size,
      endpoints,
      security,
      detectedClasses,
    };
  }

  private extractDexStrings(buf: Buffer): string[] {
    const strings: string[] = [];
    if (buf.length < 112) return strings;

    // Check DEX magic: 'dex\n035\0'
    const magic = buf.subarray(0, 8).toString('latin1');
    if (!magic.startsWith('dex\n')) {
      return this.fallbackStringExtraction(buf);
    }

    try {
      const stringIdsSize = buf.readUInt32LE(56);
      const stringIdsOff = buf.readUInt32LE(60);

      if (stringIdsOff >= buf.length || stringIdsSize > 500000) {
        return this.fallbackStringExtraction(buf);
      }

      for (let i = 0; i < stringIdsSize; i++) {
        const offset = stringIdsOff + i * 4;
        if (offset + 4 > buf.length) break;

        const stringDataOff = buf.readUInt32LE(offset);
        if (stringDataOff >= buf.length) continue;

        // string_data_item: uleb128 utf16_size, then MUTF-8 data
        let pos = stringDataOff;
        // Skip uleb128 length
        while (pos < buf.length && (buf[pos] & 0x80) !== 0) {
          pos++;
        }
        pos++; // skip last byte of uleb128

        const start = pos;
        while (pos < buf.length && buf[pos] !== 0) {
          pos++;
        }

        if (pos > start && pos <= buf.length) {
          // Read ASCII / UTF8 string
          const str = buf.subarray(start, pos).toString('utf8');
          if (str.length > 2 && str.length < 500) {
            strings.push(str);
          }
        }
      }

      return strings;
    } catch {
      return this.fallbackStringExtraction(buf);
    }
  }

  private fallbackStringExtraction(buf: Buffer): string[] {
    const strings: string[] = [];
    const minLen = 4;
    let start = -1;

    for (let i = 0; i < buf.length; i++) {
      const b = buf[i];
      const isPrintable = (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13;
      if (isPrintable) {
        if (start === -1) start = i;
      } else {
        if (start !== -1 && i - start >= minLen && i - start <= 500) {
          strings.push(buf.subarray(start, i).toString('utf8'));
        }
        start = -1;
      }
    }
    return strings;
  }

  private extractEndpoints(strings: string[]): DiscoveredEndpoint[] {
    const endpoints: DiscoveredEndpoint[] = [];
    const urlPattern = /^https?:\/\/[a-zA-Z0-9\-\.]+(\.[a-zA-Z]{2,})(:[0-9]+)?(\/[a-zA-Z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;%=]*)?$/;
    const pathPattern = /^\/(api|v[0-9]+|auth|user|account|payment|order|wallet|cards|transfer|config|sync)\/[a-zA-Z0-9\-\._~:\/]+$/i;

    const discoveredUrls: Set<string> = new Set();
    const discoveredPaths: Set<string> = new Set();

    // Check for common domains
    let mainDomain = '';

    for (const str of strings) {
      if (str.startsWith('http://') || str.startsWith('https://')) {
        if (urlPattern.test(str)) {
          // Filter out standard schema / xmlns / common CDNs
          if (
            !str.includes('schemas.android.com') &&
            !str.includes('www.w3.org') &&
            !str.includes('apache.org') &&
            !str.includes('google.com/recaptcha') &&
            !str.includes('github.com')
          ) {
            discoveredUrls.add(str);
            if (!mainDomain && !str.includes('google') && !str.includes('facebook') && !str.includes('crashlytics')) {
              try {
                mainDomain = new URL(str).hostname;
              } catch {}
            }
          }
        }
      } else if (pathPattern.test(str)) {
        discoveredPaths.add(str);
      }
    }

    // Convert found URLs to endpoints
    let index = 1;
    for (const u of discoveredUrls) {
      try {
        const parsed = new URL(u);
        const method = this.inferMethodFromPath(parsed.pathname);
        const category = this.inferCategory(parsed.pathname);

        endpoints.push({
          id: `ep_${index++}`,
          method,
          url: u,
          path: parsed.pathname,
          domain: parsed.hostname,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'ApkFlow-Agent/1.0 (Android)',
          },
          authType: category === 'auth' ? 'none' : 'bearer',
          requiresSignature: category === 'payment' || category === 'auth',
          signatureAlgorithm: (category === 'payment' || category === 'auth') ? 'HMAC-SHA256' : undefined,
          sourceContext: `Discovered from DEX string pool: ${u}`,
          category,
        });
      } catch {}
    }

    // Pair relative paths with main domain
    if (mainDomain) {
      for (const p of discoveredPaths) {
        if (!endpoints.some(e => e.path === p)) {
          const method = this.inferMethodFromPath(p);
          const category = this.inferCategory(p);

          endpoints.push({
            id: `ep_${index++}`,
            method,
            url: `https://${mainDomain}${p}`,
            path: p,
            domain: mainDomain,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'ApkFlow-Agent/1.0 (Android)',
            },
            authType: category === 'auth' ? 'none' : 'bearer',
            requiresSignature: category === 'payment' || category === 'auth',
            signatureAlgorithm: (category === 'payment' || category === 'auth') ? 'HMAC-SHA256' : undefined,
            sourceContext: `Constructed from DEX REST path: ${p}`,
            category,
          });
        }
      }
    }

    return endpoints;
  }

  private inferMethodFromPath(path: string): 'GET' | 'POST' | 'PUT' | 'DELETE' {
    const p = path.toLowerCase();
    if (p.includes('login') || p.includes('register') || p.includes('auth') || p.includes('send') || p.includes('pay') || p.includes('transfer') || p.includes('create') || p.includes('upload') || p.includes('confirm')) {
      return 'POST';
    }
    if (p.includes('update') || p.includes('edit')) return 'PUT';
    if (p.includes('delete') || p.includes('remove')) return 'DELETE';
    return 'GET';
  }

  private inferCategory(path: string): 'auth' | 'user' | 'payment' | 'core' | 'sync' | 'analytics' | 'misc' {
    const p = path.toLowerCase();
    if (p.includes('auth') || p.includes('login') || p.includes('token') || p.includes('otp') || p.includes('oauth') || p.includes('session')) return 'auth';
    if (p.includes('pay') || p.includes('card') || p.includes('wallet') || p.includes('transfer') || p.includes('bill') || p.includes('balance') || p.includes('checkout')) return 'payment';
    if (p.includes('user') || p.includes('profile') || p.includes('account') || p.includes('kyc') || p.includes('member')) return 'user';
    if (p.includes('sync') || p.includes('cache') || p.includes('refresh')) return 'sync';
    if (p.includes('analytics') || p.includes('track') || p.includes('log') || p.includes('metric')) return 'analytics';
    return 'core';
  }

  private extractSecurityDossier(strings: string[]): SecurityDossier {
    const rootIndicators: string[] = [];
    const sslIndicators: string[] = [];
    const cryptoPrimitives: { algorithm: string; description: string; locations: string[] }[] = [];
    const hardcodedSecrets: SecurityDossier['hardcodedSecrets'] = [];

    // Root detection checks
    const rootMatches = [
      { pattern: 'rootbeer', desc: 'RootBeer detection library detected' },
      { pattern: '/system/bin/su', desc: 'Checks for /system/bin/su binary' },
      { pattern: '/system/xbin/su', desc: 'Checks for /system/xbin/su binary' },
      { pattern: 'test-keys', desc: 'Build.TAGS test-keys inspection' },
      { pattern: 'Superuser.apk', desc: 'Checks for Superuser package' },
      { pattern: 'magisk', desc: 'Checks for Magisk root indicators' },
      { pattern: 'which su', desc: 'Shell command execution for su binary' },
    ];

    for (const item of rootMatches) {
      if (strings.some(s => s.toLowerCase().includes(item.pattern.toLowerCase()))) {
        rootIndicators.push(item.desc);
      }
    }

    // SSL Pinning checks
    const sslMatches = [
      { pattern: 'CertificatePinner', desc: 'OkHttp CertificatePinner implementation' },
      { pattern: 'TrustManager', desc: 'Custom X509TrustManager implementation' },
      { pattern: 'network-security-config', desc: 'Network Security Config with pin-set' },
      { pattern: 'sha256/', desc: 'Hardcoded SPKI SHA-256 certificate pins' },
      { pattern: 'TrustKit', desc: 'TrustKit SSL Pinning framework' },
    ];

    for (const item of sslMatches) {
      if (strings.some(s => s.includes(item.pattern))) {
        sslIndicators.push(item.desc);
      }
    }

    // Crypto algorithms
    const cryptoMatches = [
      { name: 'AES-GCM / AES-CBC', pattern: 'AES', desc: 'Advanced Encryption Standard for payloads' },
      { name: 'RSA (Public Key Encryption)', pattern: 'RSA', desc: 'Asymmetric encryption for key exchange or credentials' },
      { name: 'HMAC-SHA256', pattern: 'HmacSHA256', desc: 'Cryptographic hash for API request signature verification' },
      { name: 'PBKDF2', pattern: 'PBKDF2', desc: 'Key derivation function for passwords or tokens' },
      { name: 'Android Keystore', pattern: 'AndroidKeyStore', desc: 'Hardware-backed hardware security module (TEE/StrongBox)' },
    ];

    for (const c of cryptoMatches) {
      const found = strings.filter(s => s.includes(c.pattern));
      if (found.length > 0) {
        cryptoPrimitives.push({
          algorithm: c.name,
          description: c.desc,
          locations: found.slice(0, 3),
        });
      }
    }

    // Secrets discovery
    for (const s of strings) {
      // Google API Key: AIzaSy... (39 chars)
      if (/^AIzaSy[a-zA-Z0-9_\-]{33}$/.test(s)) {
        hardcodedSecrets.push({
          type: 'api_key',
          key: 'Google API Key',
          maskedValue: s.substring(0, 8) + '...' + s.substring(s.length - 4),
          location: 'DEX Strings',
        });
      }
      // Firebase URL: https://*.firebaseio.com
      if (/https:\/\/[a-z0-9\-]+\.firebaseio\.com/.test(s)) {
        hardcodedSecrets.push({
          type: 'firebase_url',
          key: 'Firebase Database URL',
          maskedValue: s,
          location: 'DEX Strings',
        });
      }
      // AWS Key: AKIA...
      if (/^AKIA[0-9A-Z]{16}$/.test(s)) {
        hardcodedSecrets.push({
          type: 'generic_secret',
          key: 'AWS Access Key ID',
          maskedValue: s.substring(0, 4) + '****************' + s.substring(s.length - 2),
          location: 'DEX Strings',
        });
      }
    }

    return {
      rootDetection: {
        found: rootIndicators.length > 0,
        confidence: rootIndicators.length > 0 ? 'observed' : 'none',
        indicators: rootIndicators,
        bypassTip: 'Can be bypassed via Frida script: hook RootBeer methods or Common SU file checks to return false.',
      },
      sslPinning: {
        found: sslIndicators.length > 0,
        confidence: sslIndicators.length > 0 ? 'observed' : 'none',
        indicators: sslIndicators,
        bypassTip: 'Can be bypassed via Frida OkHttp3 CertificatePinner.check() hook or system CA injection.',
      },
      cryptoPrimitives,
      hardcodedSecrets,
      exportedComponents: [],
    };
  }
}
