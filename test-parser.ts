import fs from 'node:fs';
import { ApkParser } from './src/analyzer/apk-parser.js';

async function test() {
  const buf = fs.readFileSync('QuickPay-Sample.apk');
  const result = await ApkParser.analyze(buf, 'QuickPay-Sample.apk');
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
