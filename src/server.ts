import path from 'node:path';
import fs from 'node:fs';
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { ApkParser } from './analyzer/apk-parser.js';
import { DEMO_BANKING_APP } from './samples/demo-apps.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB
});

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // In-memory cache for recent analyses
  const analysesCache: Map<string, any> = new Map();
  analysesCache.set(DEMO_BANKING_APP.id, DEMO_BANKING_APP);

  // API Routes
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({ status: 'ok', version: '1.0.0', service: 'ApkFlow Analysis Server' });
  });

  // Get available demo apps
  app.get('/api/demos', (req: Request, res: Response) => {
    res.json([
      {
        id: DEMO_BANKING_APP.id,
        name: DEMO_BANKING_APP.app.name,
        packageName: DEMO_BANKING_APP.app.packageName,
        framework: DEMO_BANKING_APP.app.framework.displayName,
        endpointsCount: DEMO_BANKING_APP.endpoints.length,
        hasRootCheck: DEMO_BANKING_APP.security.rootDetection.found,
        hasSslPinning: DEMO_BANKING_APP.security.sslPinning.found,
      },
    ]);
  });

  // Get demo by ID
  app.get('/api/demos/:id', (req: Request, res: Response) => {
    if (req.params.id === DEMO_BANKING_APP.id) {
      return res.json(DEMO_BANKING_APP);
    }
    const cached = analysesCache.get(req.params.id);
    if (cached) return res.json(cached);
    res.status(404).json({ error: 'Analysis not found' });
  });

  // Analyze uploaded APK
  app.post('/api/analyze', upload.single('apk'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No APK file uploaded.' });
      }

      console.log(`[ApkFlow] Analyzing uploaded APK: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)...`);
      const result = await ApkParser.analyze(req.file.buffer, req.file.originalname);
      analysesCache.set(result.id, result);
      console.log(`[ApkFlow] Analysis complete for ${result.app.name} (${result.app.packageName}). Endpoints found: ${result.endpoints.length}`);
      res.json(result);
    } catch (err: any) {
      console.error('[ApkFlow] Analysis error:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze APK.' });
    }
  });

  // Serve static assets from public/ or client/dist
  const publicDir = path.resolve(process.cwd(), 'public');
  const clientDist = path.resolve(process.cwd(), 'client', 'dist');

  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.use((req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  } else if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}

export function startServer(port: number = 3840): Promise<{ port: number; url: string }> {
  return new Promise((resolve) => {
    const app = createApp();
    const server = app.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log(`🚀 [ApkFlow] Server running at ${url}`);
      resolve({ port, url });
    });
  });
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')
);
if (isDirectRun) {
  startServer(3840);
}
