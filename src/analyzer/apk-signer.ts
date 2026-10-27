import crypto from 'node:crypto';
import AdmZip from 'adm-zip';

/**
 * Native Pure-TypeScript Android APK v1 JAR Signer
 * Generates META-INF/MANIFEST.MF, META-INF/CERT.SF, and PKCS#7 CERT.RSA
 * with a valid self-signed Android Debug Certificate (RSA-2048 / SHA-256).
 * Zero external dependencies (no Java, jarsigner, or apksigner required).
 */

// ASN.1 DER Encoding Helpers
function derLength(len: number): Buffer {
  if (len < 128) return Buffer.from([len]);
  if (len < 256) return Buffer.from([0x81, len]);
  if (len < 65536) return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
  return Buffer.from([0x83, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff]);
}

function derTag(tag: number, ...buffers: Buffer[]): Buffer {
  const content = Buffer.concat(buffers);
  return Buffer.concat([Buffer.from([tag]), derLength(content.length), content]);
}

function derSeq(...items: Buffer[]): Buffer {
  return derTag(0x30, ...items);
}

function derSet(...items: Buffer[]): Buffer {
  return derTag(0x31, ...items);
}

function derOid(oidStr: string): Buffer {
  const parts = oidStr.split('.').map(Number);
  const firstByte = parts[0] * 40 + parts[1];
  const bytes = [firstByte];
  for (let i = 2; i < parts.length; i++) {
    let val = parts[i];
    const octets = [];
    octets.push(val & 0x7f);
    while ((val >>= 7) > 0) {
      octets.push((val & 0x7f) | 0x80);
    }
    octets.reverse();
    bytes.push(...octets);
  }
  return derTag(0x06, Buffer.from(bytes));
}

function derInt(val: number | Buffer): Buffer {
  if (typeof val === 'number') {
    if (val === 0) return derTag(0x02, Buffer.from([0]));
    const buf: number[] = [];
    let temp = val;
    while (temp > 0) {
      buf.unshift(temp & 0xff);
      temp >>= 8;
    }
    if (buf[0] & 0x80) buf.unshift(0);
    return derTag(0x02, Buffer.from(buf));
  } else {
    if (val[0] & 0x80) {
      return derTag(0x02, Buffer.concat([Buffer.from([0]), val]));
    }
    return derTag(0x02, val);
  }
}

function derPrintableString(str: string): Buffer {
  return derTag(0x13, Buffer.from(str, 'ascii'));
}

function derUtf8String(str: string): Buffer {
  return derTag(0x0c, Buffer.from(str, 'utf8'));
}

function derUtcTime(date: Date): Buffer {
  const pad = (n: number) => String(n).padStart(2, '0');
  const str = `${pad(date.getUTCFullYear() % 100)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  return derTag(0x17, Buffer.from(str, 'ascii'));
}

function derBitString(buf: Buffer): Buffer {
  return derTag(0x03, Buffer.concat([Buffer.from([0x00]), buf]));
}

// Cached RSA Keypair for lightning-fast repeated APK builds
let cachedKeyPair: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject } | null = null;

function getDebugKeyPair() {
  if (!cachedKeyPair) {
    cachedKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  }
  return cachedKeyPair;
}

function createSelfSignedDebugCert(privateKey: crypto.KeyObject, publicKey: crypto.KeyObject) {
  const serialNumber = derInt(Math.floor(Math.random() * 10000000) + 1);
  const sigAlg = derSeq(derOid('1.2.840.113549.1.1.11'), derTag(0x05));

  // Standard Android Debug Key Subject: CN=Android Debug, O=Android, C=US
  const nameSeq = derSeq(
    derSet(derSeq(derOid('2.5.4.6'), derPrintableString('US'))),
    derSet(derSeq(derOid('2.5.4.10'), derUtf8String('Android'))),
    derSet(derSeq(derOid('2.5.4.3'), derUtf8String('Android Debug')))
  );

  const notBefore = new Date();
  notBefore.setFullYear(notBefore.getFullYear() - 1);
  const notAfter = new Date();
  notAfter.setFullYear(notAfter.getFullYear() + 25);
  const validity = derSeq(derUtcTime(notBefore), derUtcTime(notAfter));

  const pubDer = publicKey.export({ type: 'spki', format: 'der' });
  const version = derTag(0xa0, derInt(2));
  const tbsCert = derSeq(version, serialNumber, sigAlg, nameSeq, validity, nameSeq, pubDer);

  const signer = crypto.createSign('SHA256');
  signer.update(tbsCert);
  const signature = signer.sign(privateKey);

  const certDer = derSeq(tbsCert, sigAlg, derBitString(signature));
  return { certDer, nameSeq, serialNumber };
}

function buildPkcs7SignedData(certSfContent: Buffer, privateKey: crypto.KeyObject, publicKey: crypto.KeyObject): Buffer {
  const { certDer, nameSeq, serialNumber } = createSelfSignedDebugCert(privateKey, publicKey);

  const sfSigner = crypto.createSign('SHA256');
  sfSigner.update(certSfContent);
  const sfSignature = sfSigner.sign(privateKey);

  const issuerAndSerial = derSeq(nameSeq, serialNumber);
  const digestAlg = derSeq(derOid('2.16.840.1.101.3.4.2.1'), derTag(0x05)); // SHA-256
  const rsaAlg = derSeq(derOid('1.2.840.1.13549.1.1.1'), derTag(0x05)); // rsaEncryption

  const signerInfo = derSeq(
    derInt(1),
    issuerAndSerial,
    digestAlg,
    rsaAlg,
    derTag(0x04, sfSignature)
  );

  const digestAlgsSet = derSet(digestAlg);
  const encapContentInfo = derSeq(derOid('1.2.840.113549.1.7.1'));
  const certsTag = derTag(0xa0, certDer);
  const signerInfosSet = derSet(signerInfo);

  const signedData = derSeq(
    derInt(1),
    digestAlgsSet,
    encapContentInfo,
    certsTag,
    signerInfosSet
  );

  return derSeq(
    derOid('1.2.840.113549.1.7.2'), // signedData
    derTag(0xa0, signedData)
  );
}

export class ApkSigner {
  /**
   * Signs an APK Zip in-place with Android v1 JAR signature and X.509 debug keystore
   */
  public static sign(zip: AdmZip): { signatureDigest: string; signedAt: string } {
    // 1. Remove any old META-INF signature files
    const entries = zip.getEntries();
    for (const entry of entries) {
      if (entry.entryName.startsWith('META-INF/') && (
        entry.entryName.endsWith('.SF') ||
        entry.entryName.endsWith('.RSA') ||
        entry.entryName.endsWith('.DSA') ||
        entry.entryName.endsWith('.EC') ||
        entry.entryName === 'META-INF/MANIFEST.MF'
      )) {
        zip.deleteFile(entry.entryName);
      }
    }

    // 2. Compute SHA-256 for all regular entries
    const validEntries = zip.getEntries().filter(e => !e.isDirectory && !e.entryName.startsWith('META-INF/'));
    
    // Build MANIFEST.MF
    let manifestMf = 'Manifest-Version: 1.0\r\nCreated-By: ApkFlow v2.0 (AI Android Modder)\r\n\r\n';
    const manifestEntriesMap = new Map<string, string>();

    for (const entry of validEntries) {
      const data = entry.getData();
      const digest = crypto.createHash('sha256').update(data).digest('base64');
      const entryText = `Name: ${entry.entryName}\r\nSHA-256-Digest: ${digest}\r\n\r\n`;
      manifestEntriesMap.set(entry.entryName, entryText);
      manifestMf += entryText;
    }

    const manifestBuf = Buffer.from(manifestMf, 'utf8');
    const manifestDigest = crypto.createHash('sha256').update(manifestBuf).digest('base64');

    // Build CERT.SF
    let certSf = 'Signature-Version: 1.0\r\n';
    certSf += 'Created-By: ApkFlow Rebuilder & AI Agent\r\n';
    certSf += `SHA-256-Digest-Manifest: ${manifestDigest}\r\n\r\n`;

    for (const [entryName, entryText] of manifestEntriesMap.entries()) {
      const entryDigest = crypto.createHash('sha256').update(Buffer.from(entryText, 'utf8')).digest('base64');
      certSf += `Name: ${entryName}\r\nSHA-256-Digest: ${entryDigest}\r\n\r\n`;
    }

    const certSfBuf = Buffer.from(certSf, 'utf8');

    // 3. Generate CERT.RSA using RSA-2048 & PKCS#7
    const keyPair = getDebugKeyPair();
    const certRsaBuf = buildPkcs7SignedData(certSfBuf, keyPair.privateKey, keyPair.publicKey);

    // 4. Inject into ZIP
    zip.addFile('META-INF/MANIFEST.MF', manifestBuf);
    zip.addFile('META-INF/CERT.SF', certSfBuf);
    zip.addFile('META-INF/CERT.RSA', certRsaBuf);

    return {
      signatureDigest: manifestDigest,
      signedAt: new Date().toISOString(),
    };
  }
}
