import fs from 'node:fs';
import { ApkParser } from './src/analyzer/apk-parser.js';

async function test() {
  let buf: Buffer;
  let filename = 'BaridiMob_1.29.1_apkcube.apks';
  const realUserApks = 'C:\\Users\\safou\\Downloads\\BaridiMob_1.29.1_apkcube.apks';
  if (fs.existsSync(realUserApks)) {
    buf = fs.readFileSync(realUserApks);
  } else {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip();
    zip.addFile('AndroidManifest.xml', Buffer.from('<manifest package="com.app.test"><application android:name=".App"/></manifest>'));
    buf = zip.toBuffer();
    filename = 'SyntheticApp.apk';
  }
  const result = await ApkParser.analyze(buf, filename);
  console.log('✅ Analysis Successful!');
  console.log(`App Name: ${result.app.name}`);
  console.log(`Package: ${result.app.packageName}`);
  console.log(`Version: ${result.app.versionName}`);
  console.log(`Framework: ${result.app.framework.displayName}`);
  console.log(`Endpoints Found: ${result.endpoints.length}`);
  console.log(`Flowchart Nodes: ${result.flow.nodes.length}`);
  console.log(`Root Detection: ${result.security.rootDetection.found}`);
  console.log(`SSL Pinning: ${result.security.sslPinning.found}`);
  console.log(`Crypto Primitives: ${result.security.cryptoPrimitives.map(c => c.algorithm).join(', ')}`);
}

test().catch(console.error);
