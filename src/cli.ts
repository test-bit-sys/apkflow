#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import open from 'open';
import { startServer } from './server.js';
import { ApkParser } from './analyzer/apk-parser.js';

async function main() {
  console.log(`
   ___       __   ________             
  / _ | ___ / /__/ __/ / /__ _    __   
 / __ |/ _ \\/ // / _// / _ \\ |/|/ /   
/_/ |_/ .__/\\_,_/_/ /_/\\___/__,__/    
     /_/                               
  ⚡ Mobile App Reverse-Engineering & Architecture Visualizer
`);

  const args = process.argv.slice(2);
  const targetApk = args.find(arg => !arg.startsWith('--') && arg.endsWith('.apk'));
  const port = 3840;

  const { url } = await startServer(port);

  if (targetApk) {
    const fullPath = path.resolve(process.cwd(), targetApk);
    if (fs.existsSync(fullPath)) {
      console.log(`🔍 Pre-analyzing: ${targetApk}...`);
      const buffer = fs.readFileSync(fullPath);
      const result = await ApkParser.analyze(buffer, path.basename(fullPath));
      console.log(`✅ Analyzed ${result.app.name}! Opening dashboard...`);
    } else {
      console.warn(`⚠️ File not found: ${fullPath}`);
    }
  }

  console.log(`\n👉 Dashboard is available at: ${url}`);
  console.log(`Press Ctrl+C to stop.\n`);

  if (!args.includes('--no-open')) {
    try {
      await open(url);
    } catch {
      // browser open might fail in headless environments, ignore
    }
  }
}

main().catch(err => {
  console.error('Error starting ApkFlow:', err);
  process.exit(1);
});
