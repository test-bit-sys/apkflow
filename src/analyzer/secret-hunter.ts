/**
 * ApkFlow Deep Secret & Sensitive Data Vault Hunter
 * Scans APK bytecode, strings.xml, manifest, assets, and smali for credentials,
 * cloud keys, private certificates, and high-entropy secrets.
 */

export interface DetectedSecret {
  id: string;
  type: 
    | 'aws' 
    | 'google' 
    | 'stripe' 
    | 'github' 
    | 'slack' 
    | 'twilio' 
    | 'jwt' 
    | 'private_key' 
    | 'database' 
    | 'aes_key' 
    | 'high_entropy' 
    | 'generic_credential';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  matchedString: string;
  maskedString: string;
  entropy: number;
  location: string;
  line?: number;
  recommendation: string;
  remediationSnippet?: string;
}

export interface SecretAuditReport {
  totalSecrets: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  overallRisk: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'LOW';
  secrets: DetectedSecret[];
}

interface SecretRule {
  id: string;
  type: DetectedSecret['type'];
  severity: DetectedSecret['severity'];
  title: string;
  regex: RegExp;
  recommendation: string;
}

export class SecretHunter {
  private static readonly RULES: SecretRule[] = [
    {
      id: 'SEC-AWS-KEY',
      type: 'aws',
      severity: 'CRITICAL',
      title: 'AWS Access Key ID',
      regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
      recommendation: 'Remove hardcoded AWS credentials immediately. Use AWS Cognito identity pools or temporary STS tokens issued from your backend.',
    },
    {
      id: 'SEC-GOOGLE-KEY',
      type: 'google',
      severity: 'HIGH',
      title: 'Google Cloud / Firebase API Key',
      regex: /AIza[0-9A-Za-z\-_]{35}/g,
      recommendation: 'Restrict this key in the Google Cloud Console to your specific Android SHA-1 fingerprint and package name.',
    },
    {
      id: 'SEC-STRIPE-SK',
      type: 'stripe',
      severity: 'CRITICAL',
      title: 'Stripe Secret Key (sk_live / rk_live)',
      regex: /(?:sk|rk)_live_[0-9a-zA-Z]{24,}/g,
      recommendation: 'CRITICAL: Secret keys must NEVER be in client-side mobile code. Rotate this key immediately in the Stripe dashboard.',
    },
    {
      id: 'SEC-STRIPE-PK',
      type: 'stripe',
      severity: 'LOW',
      title: 'Stripe Publishable Key (pk_live)',
      regex: /pk_live_[0-9a-zA-Z]{24,}/g,
      recommendation: 'Publishable keys are intended for client usage, but ensure backend validation of all charge amounts and currency.',
    },
    {
      id: 'SEC-GITHUB-PAT',
      type: 'github',
      severity: 'CRITICAL',
      title: 'GitHub Personal Access Token',
      regex: /(?:ghp|gho|ghu|ghs|ghr)_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}/g,
      recommendation: 'Revoke and rotate the GitHub token immediately. Never bundle developer personal tokens into production releases.',
    },
    {
      id: 'SEC-SLACK-TOKEN',
      type: 'slack',
      severity: 'HIGH',
      title: 'Slack Webhook / Bot Token',
      regex: /xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}|https:\/\/hooks\.slack\.com\/services\/T[0-9a-zA-Z_]{8,}\/B[0-9a-zA-Z_]{8,}\/[0-9a-zA-Z_]{24}/g,
      recommendation: 'Revoke the webhook URL or Slack bot token. Forward notifications through an authenticated server proxy.',
    },
    {
      id: 'SEC-TWILIO-SID',
      type: 'twilio',
      severity: 'HIGH',
      title: 'Twilio Account SID',
      regex: /AC[a-zA-Z0-9]{32}/g,
      recommendation: 'Keep Twilio Account SIDs and Auth Tokens on the backend server; initiate SMS verification via backend REST endpoints.',
    },
    {
      id: 'SEC-RSA-PRIV',
      type: 'private_key',
      severity: 'CRITICAL',
      title: 'Embedded RSA / EC Private Key',
      regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
      recommendation: 'Private keys should never be distributed inside an APK. Use Android KeyStore (hardware-backed TEE/StrongBox) or server-side signing.',
    },
    {
      id: 'SEC-JWT-TOKEN',
      type: 'jwt',
      severity: 'HIGH',
      title: 'Hardcoded JWT Bearer Token',
      regex: /ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}\.[A-Za-z0-9._-]{10,}/g,
      recommendation: 'Replace hardcoded static JWT tokens with dynamic OAuth2 / OIDC login flows storing tokens in EncryptedSharedPreferences.',
    },
    {
      id: 'SEC-DB-URI',
      type: 'database',
      severity: 'CRITICAL',
      title: 'Database Connection URI with Credentials',
      regex: /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis):\/\/[a-zA-Z0-9_]+:[^@\s]+@[a-zA-Z0-9.-]+(?::[0-9]+)?\/[a-zA-Z0-9_]*/g,
      recommendation: 'Mobile apps must never directly access production databases. Access databases via authenticated REST/GraphQL API microservices.',
    },
    {
      id: 'SEC-AES-KEY',
      type: 'aes_key',
      severity: 'CRITICAL',
      title: 'Hardcoded AES Encryption Key / IV (Hex 32/64 bytes)',
      regex: /(?:(?:0x)?[0-9a-fA-F]{32}|(?:0x)?[0-9a-fA-F]{64})/g,
      recommendation: 'Generate cryptographic keys inside Android KeyStore (`KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")`).',
    },
  ];

  /**
   * Calculates Shannon Entropy of a string to detect high-entropy keys
   */
  public static calculateEntropy(str: string): number {
    const len = str.length;
    if (len === 0) return 0;
    const frequencies = new Map<string, number>();
    for (const char of str) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }
    let entropy = 0;
    for (const count of frequencies.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  /**
   * Masks a secret string for safe display (e.g. `sk_live_...9f2b`)
   */
  public static maskSecret(val: string): string {
    if (val.length <= 8) return '********';
    const start = val.substring(0, Math.min(6, Math.floor(val.length / 3)));
    const end = val.substring(val.length - 4);
    return `${start}...${end}`;
  }

  /**
   * Scans a file dictionary or raw string list for secrets
   */
  public static scanSources(files: { path: string; content: string }[]): SecretAuditReport {
    const foundSecrets: DetectedSecret[] = [];
    const seenSecrets = new Set<string>();

    for (const file of files) {
      const lines = file.content.split('\n');

      // Rule matching
      for (const rule of this.RULES) {
        // Reset regex state
        rule.regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = rule.regex.exec(file.content)) !== null) {
          const matchedVal = match[0];
          // Skip false positives or excessively short hex numbers in code
          if (rule.type === 'aes_key' && (matchedVal.startsWith('000000') || /^[0-9]+$/.test(matchedVal))) {
            continue;
          }

          const secretKey = `${rule.type}:${matchedVal}`;
          if (seenSecrets.has(secretKey)) continue;
          seenSecrets.add(secretKey);

          // Find approximate line number
          let lineNum = 1;
          let currentPos = 0;
          for (let i = 0; i < lines.length; i++) {
            currentPos += lines[i].length + 1;
            if (currentPos >= match.index) {
              lineNum = i + 1;
              break;
            }
          }

          const entropy = this.calculateEntropy(matchedVal);

          foundSecrets.push({
            id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: rule.type,
            severity: rule.severity,
            title: rule.title,
            matchedString: matchedVal,
            maskedString: this.maskSecret(matchedVal),
            entropy: Number(entropy.toFixed(2)),
            location: `${file.path}:${lineNum}`,
            line: lineNum,
            recommendation: rule.recommendation,
            remediationSnippet: `// Remediation: Remove hardcoded secret and obtain dynamically\nString secureToken = KeyStoreHelper.getEncryptedSecret(context, "SEC_KEY");`,
          });
        }
      }

      // Check for standalone high-entropy secrets (strings > 28 chars with entropy > 4.65)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const stringLiterals = line.match(/"([A-Za-z0-9+/=_\-]{28,})"/g) || [];
        for (const lit of stringLiterals) {
          const rawStr = lit.replace(/"/g, '');
          // Ignore package names or URLs
          if (rawStr.includes('/') || rawStr.includes('.') || rawStr.startsWith('android')) continue;

          const entropy = this.calculateEntropy(rawStr);
          if (entropy >= 4.65) {
            const secretKey = `entropy:${rawStr}`;
            if (!seenSecrets.has(secretKey)) {
              seenSecrets.add(secretKey);
              foundSecrets.push({
                id: `sec_ent_${Math.random().toString(36).substring(2, 7)}`,
                type: 'high_entropy',
                severity: 'MEDIUM',
                title: 'High-Entropy Secret / Token',
                matchedString: rawStr,
                maskedString: this.maskSecret(rawStr),
                entropy: Number(entropy.toFixed(2)),
                location: `${file.path}:${i + 1}`,
                line: i + 1,
                recommendation: 'Review this high-entropy string to ensure it is not a secret key, encryption seed, or internal API secret.',
              });
            }
          }
        }
      }
    }

    // Tally metrics
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const s of foundSecrets) {
      if (s.severity === 'CRITICAL') criticalCount++;
      else if (s.severity === 'HIGH') highCount++;
      else if (s.severity === 'MEDIUM') mediumCount++;
      else lowCount++;
    }

    let overallRisk: SecretAuditReport['overallRisk'] = 'LOW';
    if (criticalCount > 0) overallRisk = 'CRITICAL';
    else if (highCount > 0) overallRisk = 'HIGH';
    else if (mediumCount > 0) overallRisk = 'ELEVATED';

    return {
      totalSecrets: foundSecrets.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      overallRisk,
      secrets: foundSecrets,
    };
  }
}
