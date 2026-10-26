# ⚡ ApkFlow

<div align="center">

```
   ___       __   ________             
  / _ | ___ / /__/ __/ / /__ _    __   
 / __ |/ _ \/ // / _// / _ \ |/|/ /   
/_/ |_/ .__/\_,_/_/ /_/\___/__,__/    
     /_/                               
```

**Visual Mobile App Reverse-Engineering & Architecture Reconstruction Engine**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)
[![Security](https://img.shields.io/badge/Security-REA--Inspired-red.svg?style=for-the-badge)](https://github.com)

[Explore Features](#-key-features) • [Quick Start](#-quick-start) • [How It Works](#-how-apkflow-works) • [Demo](#-built-in-demos)

</div>

---

## 💡 Why ApkFlow?

When analyzing a mobile application in decompilers like Jadx or Ghidra, researchers and developers are flooded with thousands of obfuscated classes, scattered resources, and complex call trees. Answering fundamental questions like:
- **"What architecture does this app use?"**
- **"How does the authentication handshake actually flow?"**
- **"Where is the payload encrypted or signed?"**
- **"How can I write a clean, reproducible client script in TypeScript or Python?"**

traditionally takes days of manual note-taking and flowchart sketching.

**ApkFlow** solves this by automating the entire decompilation mental model. Just drop an APK into the local web dashboard, and ApkFlow constructs an **interactive flowchart**, extracts all endpoints and cryptographic requirements, and writes **ready-to-run TypeScript and Python code** for you in seconds.

---

## 🚀 Key Features

### 1. 🗺️ Interactive Architecture Flowchart
- Automatically maps out the application lifecycle:
  `[App Launch]` ➔ `[Security & Root Gate]` ➔ `[TLS & SSL Pinning]` ➔ `[Auth Handshake]` ➔ `[Crypto & Signing Pipeline]` ➔ `[Business APIs]` ➔ `[Persistence]`
- Click on any node to open the **Inspector Drawer** with technical indicators, bypass strategies, and exact schema definitions.

### 2. 🛠️ Plain-English Reconstruction Blueprint
- Explains how the target app works internally in plain, understandable language.
- Generates a numbered, phase-by-phase reverse engineering guide with practical tips (e.g. Frida scripts for root detection, Ghidra offset hunting for JNI signing keys).

### 3. 💻 Ready-to-Run Code Generator
- Generates production-ready, clean client code in:
  - **TypeScript (Node.js)**: Modern ES module using native `fetch` and `node:crypto`.
  - **Python**: Modular script using `requests` with HMAC-SHA256 signature calculation.
  - **cURL**: Copy-paste terminal command with verified headers and body payload.

### 4. 🛡️ Security & Cryptographic Dossier
- **Root & Tamper Detection**: Inspects RootBeer, `/system/bin/su`, Magisk markers, and test-keys.
- **SSL Certificate Pinning**: Identifies OkHttp `CertificatePinner`, `TrustManager` overrides, and SPKI pins.
- **Crypto Primitives**: Flags AES-CBC/GCM, RSA, HMAC-SHA256, and Android Keystore usages in DEX bytecode and Native `.so` libraries.
- **Secret Discovery**: Scans for embedded Google API Keys, Firebase URLs, and AWS access credentials.

### 5. 🧩 Deep Framework Identification
Detects whether the target APK is:
- **Android Native** (Kotlin / Java JVM bytecode)
- **Flutter** (Dart AOT binary `libapp.so`)
- **React Native** (Hermes bytecode or plain JS bundle)
- **Unity** (IL2CPP / C# to C++ compiled engine)
- **Hybrid** (Capacitor / Cordova WebView)
- **Native Security Layer** (Custom C++ `.so` libraries via JNI)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ installed

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

---

## 🎯 Built-in Demos

Don't have an APK file on hand? ApkFlow comes pre-loaded with comprehensive reverse-engineering datasets:
- **Fintech Banking App (e.g. BaridiMob)**: Demonstrates native JNI signature calculation (`libsec-core.so`), RootBeer bypass, OkHttp Certificate Pinning, and balance/transfer API calls.

Click **"Load Demo: SecureBank (BaridiMob)"** directly inside the web UI to explore!

---

## 🏗️ Architecture & Philosophy

ApkFlow draws inspiration from the **Reverse Engineer Anything (REA)** framework:

```
apkflow/
├── public/                 # Sleek Vanilla CSS/JS Local Dashboard (Zero-build friction)
│   ├── index.html          # Clean semantic UI with dark-mode aesthetic
│   ├── styles.css          # Glassmorphism design system & responsive layout
│   └── app.js              # Graph visualizer, inspector drawer & code generator
├── src/
│   ├── analyzer/
│   │   ├── apk-parser.ts   # Core orchestrator
│   │   ├── axml-decoder.ts # Pure TypeScript AXML (AndroidManifest.xml) decoder
│   │   ├── dex-scanner.ts  # DEX string pool & cryptographic primitive scanner
│   │   ├── framework-detector.ts # Flutter, React Native, Unity, C++ detector
│   │   ├── flow-builder.ts # Projects bytecode into lifecycle Flow Graph
│   │   └── code-generator.ts # Generates TypeScript, Python, and cURL clients
│   ├── samples/
│   │   └── demo-apps.ts    # Pre-configured realistic application datasets
│   ├── server.ts           # Express REST API & static server
│   └── cli.ts              # Command-line entrypoint
```

---

## ⚖️ Legal & Ethical Notice

ApkFlow is developed for **educational, security research, and interoperability purposes only**. Users are responsible for complying with applicable local laws, Terms of Service, and obtaining proper authorization before analyzing or interfacing with third-party software.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
