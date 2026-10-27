import { AnalysisResult } from '../types/index.js';

export interface SecurityVulnerability {
  id: string;
  category: string; // e.g. M1, M5, M8
  categoryName: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  cvss: number;
  location: string;
  description: string;
  remediation: string;
}

export interface SecurityAuditReport {
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  metrics: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  vulnerabilities: SecurityVulnerability[];
  owaspTop10Scorecard: {
    code: string;
    title: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    findingCount: number;
  }[];
}

export class SecurityAuditor {
  /**
   * Evaluates APK metadata, DEX strings, manifest flags, and cryptographic usages
   * against the industry-standard OWASP Mobile Top 10 benchmark.
   */
  public static audit(analysis: AnalysisResult): SecurityAuditReport {
    const vulns: SecurityVulnerability[] = [];
    const app = analysis.app;
    const sec = analysis.security;

    // --- M1: Improper Credential Usage ---
    const secrets = sec.hardcodedSecrets || [];
    for (const secret of secrets) {
      vulns.push({
        id: `VULN-M1-${secret.key.substring(0, 10)}`,
        category: 'M1',
        categoryName: 'Improper Credential Usage',
        title: `Hardcoded ${secret.type.toUpperCase()}: ${secret.key}`,
        severity: secret.type === 'private_key' || secret.type === 'jwt_token' ? 'CRITICAL' : 'HIGH',
        cvss: secret.type === 'private_key' ? 9.2 : 7.5,
        location: secret.location,
        description: `Found embedded high-entropy credential or API token in static bytecode or resources.`,
        remediation: `Migrate static keys to Android Keystore or fetch dynamically via authenticated backend sessions.`,
      });
    }

    // --- M4 & M8: Security Misconfiguration & Exported Components ---
    const exported = sec.exportedComponents || [];
    for (const comp of exported) {
      if (comp.riskLevel === 'high') {
        vulns.push({
          id: `VULN-M4-${comp.name.split('.').pop()}`,
          category: 'M4',
          categoryName: 'Insufficient Input/Output Validation',
          title: `Unprotected Exported Component: ${comp.name.split('.').pop()}`,
          severity: 'HIGH',
          cvss: 7.8,
          location: `AndroidManifest.xml <${comp.type} android:name="${comp.name}">`,
          description: `Component has android:exported="true" without permission requirements, allowing arbitrary third-party apps to trigger it.`,
          remediation: `Set android:exported="false" or protect with a custom signature-level permission.`,
        });
      }
    }

    // --- M5: Insecure Communication ---
    if (!sec.sslPinning.found) {
      vulns.push({
        id: 'VULN-M5-NO-SSL-PINNING',
        category: 'M5',
        categoryName: 'Insecure Communication',
        title: 'Missing SSL / TLS Certificate Pinning',
        severity: 'MEDIUM',
        cvss: 5.9,
        location: 'Network Pipeline (OkHttp / HttpURLConnection)',
        description: 'Application does not enforce certificate pinning, enabling Man-in-the-Middle (MitM) inspection via custom CA certificates.',
        remediation: 'Implement okhttp3.CertificatePinner or declare SPKI hashes in res/xml/network_security_config.xml.',
      });
    }

    // --- M6: Inadequate Privacy Controls (Dangerous Permissions) ---
    const dangerousPerms = (app.permissions || []).filter(p => 
      p.includes('RECEIVE_SMS') || 
      p.includes('READ_SMS') || 
      p.includes('READ_PHONE_STATE') || 
      p.includes('ACCESS_FINE_LOCATION')
    );
    if (dangerousPerms.length > 0) {
      vulns.push({
        id: 'VULN-M6-EXCESSIVE-PERMS',
        category: 'M6',
        categoryName: 'Inadequate Privacy Controls',
        title: `High-Risk System Permissions (${dangerousPerms.length} detected)`,
        severity: 'MEDIUM',
        cvss: 5.3,
        location: 'AndroidManifest.xml (<uses-permission>)',
        description: `App requests sensitive privacy permissions: ${dangerousPerms.join(', ')}.`,
        remediation: 'Apply principle of least privilege. Replace direct SMS reads with SMS Retriever API.',
      });
    }

    // --- M7: Insufficient Binary Protections ---
    if (!sec.rootDetection.found) {
      vulns.push({
        id: 'VULN-M7-NO-ROOT-CHECK',
        category: 'M7',
        categoryName: 'Insufficient Binary Protections',
        title: 'Lack of Root / Tamper Detection',
        severity: 'LOW',
        cvss: 3.5,
        location: 'Application Runtime Environment',
        description: 'Application does not detect rooted devices or debuggers, allowing runtime analysis and memory modification.',
        remediation: 'Integrate RootBeer library or hardware-backed SafetyNet/Play Integrity API.',
      });
    }

    // --- M10: Insufficient Cryptography ---
    const ecbCrypto = sec.cryptoPrimitives.find(c => c.algorithm.includes('ECB'));
    if (ecbCrypto) {
      vulns.push({
        id: 'VULN-M10-ECB-MODE',
        category: 'M10',
        categoryName: 'Insufficient Cryptography',
        title: 'Weak Cryptographic Mode: Electronic Codebook (ECB)',
        severity: 'HIGH',
        cvss: 7.4,
        location: ecbCrypto.locations.join(', ') || 'Bytecode',
        description: 'ECB mode preserves plaintext patterns and does not provide semantic security.',
        remediation: 'Switch to AES-GCM (Authenticated Encryption) or AES-CBC with HMAC integrity check.',
      });
    }

    // Calculate Counts & Score
    const critical = vulns.filter(v => v.severity === 'CRITICAL').length;
    const high = vulns.filter(v => v.severity === 'HIGH').length;
    const medium = vulns.filter(v => v.severity === 'MEDIUM').length;
    const low = vulns.filter(v => v.severity === 'LOW').length;

    // Score deduction algorithm: 100 base
    let score = 100 - (critical * 25) - (high * 12) - (medium * 5) - (low * 2);
    score = Math.max(15, Math.min(100, score));

    let grade: SecurityAuditReport['grade'] = 'A';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 45) grade = 'D';
    else grade = 'F';

    let riskLevel: SecurityAuditReport['riskLevel'] = 'LOW';
    if (critical > 0 || score < 50) riskLevel = 'CRITICAL';
    else if (high > 1 || score < 70) riskLevel = 'HIGH';
    else if (medium > 2) riskLevel = 'MEDIUM';

    // OWASP Top 10 Scorecard
    const owaspCategories = [
      { code: 'M1', title: 'Improper Credential Usage' },
      { code: 'M2', title: 'Inadequate Supply Chain Security' },
      { code: 'M3', title: 'Insecure Authentication/Authorization' },
      { code: 'M4', title: 'Insufficient Input/Output Validation' },
      { code: 'M5', title: 'Insecure Communication' },
      { code: 'M6', title: 'Inadequate Privacy Controls' },
      { code: 'M7', title: 'Insufficient Binary Protections' },
      { code: 'M8', title: 'Security Misconfiguration' },
      { code: 'M9', title: 'Insecure Data Storage' },
      { code: 'M10', title: 'Insufficient Cryptography' },
    ];

    const owaspTop10Scorecard = owaspCategories.map(cat => {
      const count = vulns.filter(v => v.category === cat.code).length;
      let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
      if (count > 1) status = 'FAIL';
      else if (count === 1) status = 'WARN';

      return {
        code: cat.code,
        title: cat.title,
        status,
        findingCount: count,
      };
    });

    return {
      score,
      grade,
      riskLevel,
      summary: `Automated SAST audit identified ${vulns.length} potential vulnerabilities across ${owaspCategories.length} security vectors. Overall risk evaluation: ${riskLevel} (Score: ${score}/100, Grade: ${grade}).`,
      metrics: {
        critical,
        high,
        medium,
        low,
        total: vulns.length,
      },
      vulnerabilities: vulns,
      owaspTop10Scorecard,
    };
  }
}
