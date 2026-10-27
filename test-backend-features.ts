import fs from 'node:fs';
import { ApkParser } from './src/analyzer/apk-parser.js';
import { SourceExtractor } from './src/analyzer/source-extractor.js';
import { ApkRebuilder } from './src/analyzer/apk-rebuilder.js';
import { ApkFlowAgent } from './src/analyzer/ai-agent.js';
import { FridaGenerator } from './src/analyzer/frida-generator.js';
import { MockServer } from './src/analyzer/mock-server.js';
import { SecurityAuditor } from './src/analyzer/security-auditor.js';
import { ExportService } from './src/analyzer/export-service.js';
import { SecretHunter } from './src/analyzer/secret-hunter.js';
import { ElfInspector } from './src/analyzer/elf-inspector.js';
import { IntentInspector } from './src/analyzer/intent-inspector.js';
import { AdbBridge } from './src/analyzer/adb-bridge.js';

async function testAll() {
  console.log('🧪 Starting ApkFlow v2.0 Extended Feature Tests...');
  const apkBuf = fs.readFileSync('QuickPay-Sample.apk');
  const analysis = await ApkParser.analyze(apkBuf, 'QuickPay-Sample.apk');
  console.log(`✅ Analyzed ${analysis.app.name}`);

  // 1. Source Extractor
  const sources = SourceExtractor.extract(apkBuf, analysis);
  console.log(`✅ Extracted ${sources.fileCount} source files. Tree nodes: ${sources.tree.length}`);

  // 2. ApkRebuilder
  const rebuild = ApkRebuilder.rebuild(apkBuf, analysis.app.name, analysis.app.packageName, {
    bypassRoot: true,
    bypassSsl: true,
    makeDebuggable: true,
    redirectApiUrl: 'http://127.0.0.1:8888',
  });
  console.log(`✅ Rebuilt APK: ${rebuild.filename} (${rebuild.size} bytes), SHA-256: ${rebuild.sha256.substring(0, 16)}...`);

  // 3. AI Agent
  console.log('🤖 Testing AI Agent with prompt in Arabic: "الغاء كشف الروت وتخطي SSL بينينج وتغيير رابط السيرفر الى https://proxy.myserver.com ثم اعادة البناء"...');
  const agentRes = await ApkFlowAgent.execute(
    'الغاء كشف الروت وتخطي SSL بينينج وتغيير رابط السيرفر الى https://proxy.myserver.com ثم اعادة البناء',
    analysis,
    sources.files,
    apkBuf
  );
  console.log(`✅ AI Agent executed successfully! Actions: ${agentRes.actionsTaken.length}, Output: ${agentRes.rebuiltApk?.filename}`);

  // 4. Frida Suite Generator
  console.log('⚡ Testing Frida Dynamic Instrumentation Suite...');
  const fridaSuite = FridaGenerator.generate(analysis);
  console.log(`✅ Frida Script generated: ${fridaSuite.fullScript.length} chars, Package: ${fridaSuite.packageName}`);
  console.log(`   USB Spawn command: ${fridaSuite.cliCommands.usbSpawn}`);

  // 5. Mock Server & API Sandbox
  console.log('🌐 Testing Mock Server Gateway...');
  const mockResult = await MockServer.execute('https://api.quickpay.io/v2/auth/login', 'POST', {}, { username: 'test' });
  console.log(`✅ Mock Response: Status ${mockResult.status}, Token: ${mockResult.data?.data?.token ? 'Found' : 'Missing'}, Latency: ${mockResult.latencyMs}ms`);

  // 6. OWASP SAST Security Auditor
  console.log('🛡️ Testing OWASP SAST Security Auditor...');
  const auditReport = SecurityAuditor.audit(analysis);
  console.log(`✅ SAST Score: ${auditReport.score}/100, Grade: ${auditReport.grade}, Total Vulnerabilities: ${auditReport.metrics.total}`);

  // 7. Export Hub (Postman, OpenAPI, HTML Report)
  console.log('📥 Testing Export Hub...');
  const postman = ExportService.exportPostman(analysis);
  const openapi = ExportService.exportOpenApi(analysis);
  const htmlReport = ExportService.exportHtmlReport(analysis, auditReport);
  console.log(`✅ Postman items: ${(postman as any).item.length}, OpenAPI paths: ${Object.keys((openapi as any).paths).length}, HTML report length: ${htmlReport.length} chars`);

  // 8. Secret Hunter
  console.log('🔍 Testing Secret Hunter...');
  const secretSources = Object.entries(sources.files).map(([p, content]) => ({ path: p, content }));
  const secretReport = SecretHunter.scanSources(secretSources);
  console.log(`✅ Secrets Found: ${secretReport.totalSecrets} (Critical: ${secretReport.criticalCount}, High: ${secretReport.highCount}), Risk: ${secretReport.overallRisk}`);

  // 9. Native ELF Binary & JNI Inspector
  console.log('⚙️ Testing Native ELF Inspector...');
  // Create a minimal valid ELF buffer for ARM64 test
  const elfTestBuf = Buffer.alloc(128);
  elfTestBuf[0] = 0x7F; elfTestBuf[1] = 0x45; elfTestBuf[2] = 0x4C; elfTestBuf[3] = 0x46; // \x7fELF
  elfTestBuf[4] = 2; // 64-bit
  elfTestBuf[5] = 1; // little endian
  elfTestBuf.writeUInt16LE(0xB7, 18); // EM_AARCH64 (arm64-v8a)
  elfTestBuf.write('Java_com_quickpay_wallet_security_NativeCrypto_signPayload\0__stack_chk_fail\0libc.so\0libcrypto.so\0', 32, 'utf8');
  const elfAnalysis = ElfInspector.inspect(elfTestBuf, 'libnative-crypto.so', 'arm64-v8a');
  console.log(`✅ ELF Parsed: ${elfAnalysis.filename} (${elfAnalysis.elfHeader.machine}), JNI Exports: ${elfAnalysis.exportedJniMethods.length}, Stack Canary: ${elfAnalysis.securityMitigations.hasStackCanary}`);

  // 10. Deep Link & Intent Matrix
  console.log('🔗 Testing Deep Link & Intent Matrix...');
  const intentReport = IntentInspector.audit(analysis.app.packageName, analysis.app.activities, sources.files['AndroidManifest.xml']);
  console.log(`✅ Deep Links Analyzed: ${intentReport.totalDeepLinks} (Custom Schemes: ${intentReport.customSchemeCount}, App Links: ${intentReport.appLinksCount})`);

  // 11. ADB Live Bridge & Simulator
  console.log('📱 Testing ADB Bridge & Virtual Device Simulator...');
  const devices = await AdbBridge.listDevices();
  const installResult = await AdbBridge.executeAction('install', analysis.app.packageName, rebuild.filename);
  const logcat = AdbBridge.getSampleLogcat(analysis.app.packageName);
  console.log(`✅ ADB Devices: ${devices.length} (${devices[0].model}), Action: ${installResult.command} -> ${installResult.output.split('\n')[0]}, Logs: ${logcat.length} entries`);

  console.log('\n🎉 ALL APFLOW EXTENDED ENTERPRISE MODULES VERIFIED SUCCESSFULLY!');
}

testAll().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
