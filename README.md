# ⚡ ApkFlow v2.0

<div align="center">

```
   ___       __   ________             
  / _ | ___ / /__/ __/ / /__ _    __   
 / __ |/ _ \/ // / _// / _ \ |/|/ /   
/_/ |_/ .__/\_,_/_/ /_/\___/__,__/    
     /_/                               
```

**Next-Generation Visual Mobile App Reverse-Engineering, Decompiler, Rebuilder, Dynamic Instrumentation & Autonomous AI Modding Engine**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)
[![OWASP SAST](https://img.shields.io/badge/OWASP-Mobile_Top_10-red.svg?style=for-the-badge)](https://owasp.org)
[![Frida](https://img.shields.io/badge/Frida-Runtime_Hooks-orange.svg?style=for-the-badge)](https://frida.re)
[![AI Agent](https://img.shields.io/badge/AI_Agent-Autonomous_Modder-emerald.svg?style=for-the-badge)](https://github.com)

[Explore Features](#-key-features) • [Source Code Explorer](#2--decompiled-source-code-explorer) • [Rebuilder & Studio](#3--apk-mod--rebuild-studio) • [AI Copilot](#4--autonomous-ai-agent-copilot) • [Frida Studio](#5--frida-dynamic-instrumentation-studio) • [Secret Vault](#7--sensitive-data--secret-vault-hunter) • [Native ELF & JNI](#8--native-binary--elf--jni-inspector) • [Quick Start](#-quick-start)

</div>

---

## 💡 Why ApkFlow?

When reverse-engineering a mobile application in decompilers like Jadx or Ghidra, researchers and developers face thousands of obfuscated classes, scattered resources, and complex call trees. Answering fundamental questions like:
- **"What architecture does this app use?"**
- **"How does the authentication handshake actually flow?"**
- **"Where is the payload encrypted, signed, or checked for root?"**
- **"How can I automatically bypass root and SSL pinning, modify endpoints, and recompile the APK in 1 click?"**
- **"Can an AI Agent analyze the bytecode, synthesize unified diffs, and rebuild the application for me?"**
- **"Where are the hardcoded cloud credentials, API keys, and native JNI symbols hidden?"**

traditionally takes days of manual patching, smali editing, and keystore signing.

**ApkFlow v2.0** automates the entire mobile reverse-engineering lifecycle in an integrated, web-based dashboard with 11 enterprise-grade modules.

---

## 🚀 Key Features

### 1. 🗺️ Interactive Architecture Flowchart
- Automatically maps out the application lifecycle visually:
  `[App Launch]` ➔ `[Security & Root Gate]` ➔ `[TLS & SSL Pinning]` ➔ `[Auth Handshake]` ➔ `[Crypto & Signing Pipeline]` ➔ `[Business APIs]` ➔ `[Persistence]`
- Interactive n8n-style canvas with smooth pan/zoom, zoom indicators, and dynamic bezier cables.
- Click on any node to open the **Inspector Drawer** with technical indicators, bypass strategies, and exact schema definitions.

### 2. 📂 Decompiled Source Code Explorer
- **Interactive File Tree**: Folders, files, and resources organized cleanly (`AndroidManifest.xml`, `java/`, `smali/`, `res/`, `assets/`, `cpp/`).
- **Live Search**: Instant real-time filtering across all project files.
- **In-Memory Editor & Staging**: View and edit decompiled files directly in the browser and stage changes for recompilation with one click.
- **Language Syntax Awareness**: Java, Smali, XML, JSON, C++.

### 3. 🛠️ APK Mod & Rebuild Studio
- **1-Click Security Bypasses**:
  - 🛡️ **Bypass Root & Tamper Detection**: Neutralizes RootBeer heuristics, `/system/bin/su` binaries, and `test-keys` in DEX bytecode.
  - 🔓 **Bypass SSL Certificate Pinning**: Injects permissive `network_security_config.xml` trusting user CA certificates, and neutralizes OkHttp SPKI pin hashes.
  - 🐞 **Make Application Debuggable**: Injects `android:debuggable="true"` into `AndroidManifest.xml` for seamless debugger attachment.
  - 🌐 **API Server Redirector**: Intercepts and redirects backend endpoints to local proxies (e.g. `http://10.0.2.2:8080` or Burp Suite).
  - 🚫 **Strip Analytics & Telemetry**: Redirects Firebase, Google Analytics, and Adjust trackers to local sinkholes.
- **Native Pure-TypeScript Signer**:
  - Embeds standard Android Debug X.509 Certificate (`CN=Android Debug, O=Android, C=US`).
  - Generates PKCS#7 `CERT.RSA` + `CERT.SF` + `MANIFEST.MF` with RSA-2048 and SHA-256 in < 50ms with **zero external dependencies** (no Java or apksigner needed).
  - Yields ready-to-install signed APKs (`adb install -r app-modded-signed.apk`).

### 4. 🤖 Autonomous AI Agent Copilot
- **Natural Language Task Execution**: Supports Arabic and English prompts, e.g.:
  - *"Bypass root detection, disable SSL pinning, and redirect API to http://127.0.0.1:8080 and rebuild"*
  - *"تخطي كشف الروت وفك تشفير الاتصال وتغيير السيرفر الى https://proxy.server ثم اعادة البناء"*
- **Agent Reasoning Trace**: Visual step-by-step thinking accordion (Reconnaissance, Target Identification, Diff Generation, Bytecode Repacking, Cryptographic Signing).
- **Interactive Code Diff Viewer**: Displays unified syntax-highlighted diffs (`+ additions`, `- deletions`) across modified files.
- **Direct Download & ADB Integration**: Delivers the newly compiled, signed APK immediately within the chat thread.

### 5. ⚡ Frida Dynamic Instrumentation Studio
- Generates ready-to-run Frida scripts tailored to the decompiled application:
  - **Root Detection Bypass**: Hooks `RootBeer.isRooted()` and `/system/bin/su` checks.
  - **SSL Unpinning**: Neutralizes OkHttp3 `CertificatePinner.check()`, `TrustManagerImpl`, and NetworkSecurityConfig.
  - **Cryptographic Cipher & Key Spy**: Hooks `javax.crypto.Cipher`, `SecretKeySpec`, and `Mac.doFinal()` to print encryption keys and IVs in real time.
  - **Native C++ JNI Interceptor**: Intercepts `Java_*` JNI functions and native memory buffers.
  - **Activity Lifecycle Tracer**: Monitors UI navigation, intents, and bundle extras.
- Provides copy-pasteable CLI commands for USB spawn, attach, and remote daemon modes.

### 6. 🌐 Interactive API Sandbox & Virtual Mock Gateway
- Simulates discovered API endpoints (`/v2/auth/login`, `/v2/wallet/balance`, `/v2/wallet/transfer`, etc.) directly from the browser.
- Automatically synthesizes valid JWT tokens, balances, and transaction IDs with realistic latencies (40-90ms).
- In-browser interactive request runner with custom headers and payload testing.

### 7. 🔍 Sensitive Data & Secret Vault Hunter
- Scans DEX bytecode, strings, manifest, and assets for hardcoded credentials:
  - AWS Access Keys & Secrets (`AKIA...`)
  - Google Cloud & Firebase API Keys (`AIza...`)
  - Stripe Secret & Publishable Keys (`sk_live_...`, `pk_live_...`)
  - GitHub Personal Access Tokens (`ghp_...`, `github_pat_...`)
  - Slack Tokens, Twilio SIDs, Embedded Private Keys, JWTs, and DB URIs.
- Calculates Shannon Entropy scores to detect obfuscated secrets.
- 1-Click "Redact with AI Agent" to automatically sanitize secrets from the code and rebuild the APK.

### 8. ⚙️ Native Binary & ELF / JNI Inspector
- Dissects Android native shared objects (`.so`) in `lib/arm64-v8a/` and `lib/armeabi-v7a/`.
- Parses ELF binary headers (Bitness, Endianness, Machine Architecture).
- Extracts dynamic exported JNI symbols (`Java_<package>_<class>_<method>`) and `JNI_OnLoad`.
- Verifies binary security mitigations: **Stack Canary Protection (`__stack_chk_fail`)** and Fortified Functions.
- Extracts hidden strings and URLs compiled into native binaries.

### 9. 🔗 Deep Link & Intent-Filter Security Matrix
- Audits custom URI schemes (e.g. `quickpay://transfer`) vs verified Android App Links.
- Detects scheme hijacking risks, unverified domains, and open intent redirection vulnerabilities.
- Generates 1-click ADB execution commands to test deep links on real devices or emulators.

### 10. 📱 ADB Live Device Bridge & Real-Time Logcat
- Auto-discovers connected USB Android devices and emulators (`adb devices`).
- Seamlessly falls back to a high-fidelity **Virtual Android Emulator (Google Pixel 8 Pro, API 34)** when running in standalone mode.
- 1-Click actions: Launch App, Force Stop, Clear Data, Install Modded APK, and Inject Frida.
- Real-time color-coded Logcat stream with package filtering.

### 11. 🛡️ OWASP Mobile Top 10 SAST Auditor & Export Hub
- Automated static security assessment covering:
  - `M1: Improper Credential Usage`
  - `M2: Inadequate Supply Chain Security`
  - `M3: Insecure Authentication / Authorization`
  - `M4: Insufficient Input / Output Validation`
  - `M5: Insecure Communication & Cleartext Traffic`
  - `M8: Security Misconfiguration (Debuggable flag, Backup enabled)`
  - `M9: Insecure Data Storage`
- Calculates overall Risk Score (0-100) and Letter Grade (A+ to F).
- **Export Formats**:
  - 📮 **Postman Collection v2.1.0 JSON**
  - 🌐 **OpenAPI 3.0.3 Specification JSON**
  - 📊 **Standalone Offline HTML Executive Security Report**
  - 📦 **Rebuilt & Signed APK**

---

## ⚡ Quick Start

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/apkflow.git
cd apkflow

# 2. Install dependencies
npm install

# 3. Launch ApkFlow
npm start
```

The web dashboard will automatically launch at **`http://localhost:3840`**!

### Analyze an APK from the Command Line:

```bash
npx tsx src/cli.ts path/to/application.apk
```

### Run Automated Backend Feature Tests:

```bash
npm test
```

---

## 🏗️ Architecture & Engine Components

```
apkflow/
├── public/                     # Sleek Vanilla CSS/JS Dashboard (Zero-build friction)
│   ├── index.html              # Modern dark-mode UI with floating tool dock
│   ├── styles.css              # Glassmorphic styling, terminal & card layouts
│   └── app.js                  # Frontend state machine & module controllers
├── src/
│   ├── analyzer/
│   │   ├── apk-parser.ts       # Core orchestrator
│   │   ├── apk-signer.ts       # Pure-TypeScript v1 Signer (RSA-2048 / PKCS#7)
│   │   ├── apk-rebuilder.ts    # Bytecode patcher, repackager & build engine
│   │   ├── source-extractor.ts # Java/Smali/Manifest/Resources decompiler
│   │   ├── ai-agent.ts         # Multilingual AI Modder Agent (Diff synthesizer)
│   │   ├── frida-generator.ts  # Frida runtime dynamic hooking suite
│   │   ├── mock-server.ts      # Interactive API Sandbox & Mock Gateway
│   │   ├── security-auditor.ts # OWASP Mobile Top 10 SAST audit engine
│   │   ├── secret-hunter.ts    # Credentials, cloud keys & entropy scanner
│   │   ├── elf-inspector.ts    # Native .so ELF binary & JNI symbol analyzer
│   │   ├── intent-inspector.ts # Deep Link & Intent-Filter Security Matrix
│   │   ├── adb-bridge.ts       # ADB Live Device Bridge & Emulator Simulator
│   │   ├── export-service.ts   # Postman, OpenAPI 3.0 & HTML report exporter
│   │   ├── axml-decoder.ts     # Pure-TypeScript AXML decoder
│   │   ├── dex-scanner.ts      # DEX string pool & crypto primitive scanner
│   │   ├── framework-detector.ts # Flutter, React Native, Unity, C++ detector
│   │   ├── flow-builder.ts     # Projects bytecode into lifecycle Flow Graph
│   │   └── code-generator.ts   # Generates TypeScript, Python, and cURL clients
│   ├── samples/
│   │   ├── demo-apps.ts        # Pre-configured realistic application datasets
│   │   └── generate-sample-apk.ts # Realistic sample APK generator
│   ├── server.ts               # Express REST API & static server
│   └── cli.ts                  # Command-line entrypoint
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/status` | `GET` | Health check and engine capabilities |
| `/api/demos` | `GET` | Lists available preloaded datasets |
| `/api/analyze` | `POST` | Upload and analyze an APK file (supports up to 2GB) |
| `/api/sources/:id` | `GET` | Full file tree of decompiled sources |
| `/api/sources/:id/file?path=...` | `GET` | Content of a specific source file |
| `/api/sources/:id/save` | `POST` | Stages modified file content into project cache |
| `/api/rebuild` | `POST` | Rebuilds APK with selected patches and debug signs |
| `/api/download-rebuilt/:id` | `GET` | Downloads the rebuilt and signed APK |
| `/api/agent/chat` | `POST` | Sends natural language instructions to AI Modder Agent |
| `/api/frida/:id` | `GET` | Generates full Frida JavaScript instrumentation suite |
| `/api/mock/send` | `POST` | Executes simulated request in virtual mock gateway |
| `/api/audit/:id` | `GET` | Performs OWASP Mobile Top 10 SAST audit |
| `/api/secrets/:id` | `GET` | Scans codebase for credentials and high-entropy keys |
| `/api/elf/:id` | `GET` | Analyzes native ELF `.so` libraries and exported JNI symbols |
| `/api/intent/:id` | `GET` | Audits custom schemes and verified App Links |
| `/api/adb/devices` | `GET` | Lists connected physical devices or virtual emulator |
| `/api/adb/action` | `POST` | Executes ADB actions (install, launch, stop, clear, frida) |
| `/api/adb/logcat/:package` | `GET` | Streams real-time color-coded Logcat events |
| `/api/diff/:id` | `POST` | Generates unified code diff between original and patched files |
| `/api/export/:id/postman` | `GET` | Downloads Postman Collection v2.1.0 JSON |
| `/api/export/:id/openapi` | `GET` | Downloads OpenAPI 3.0.3 specification JSON |
| `/api/export/:id/report` | `GET` | Downloads standalone Executive HTML audit report |

---

## ⚖️ Legal & Ethical Notice

ApkFlow is developed for **educational, authorized security auditing, and interoperability research purposes only**. Users are responsible for complying with applicable local laws, Terms of Service, and obtaining proper authorization before analyzing or modifying third-party software.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
