import path from 'node:path';
import fs from 'node:fs';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { ApkParser } from './analyzer/apk-parser.js';
import { DEMO_BANKING_APP } from './samples/demo-apps.js';

// Support up to 2GB APK uploads using temporary disk buffer
const tempUploadDir = path.resolve(process.cwd(), '.tmp_uploads');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const upload = multer({
  dest: tempUploadDir,
  limits: { fileSize: 2048 * 1024 * 1024 }, // 2GB
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

  // Download generated sample APK
  app.get('/api/download-sample-apk', (req: Request, res: Response) => {
    const samplePath = path.resolve(process.cwd(), 'QuickPay-Sample.apk');
    if (fs.existsSync(samplePath)) {
      res.download(samplePath, 'QuickPay-Sample.apk');
    } else {
      res.status(404).json({ error: 'Sample APK not found' });
    }
  });

  // Analyze uploaded APK (supports huge files up to 2GB)
  app.post('/api/analyze', upload.single('apk'), async (req: Request, res: Response) => {
    let tempPath: string | null = null;
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No APK file uploaded.' });
      }

      tempPath = req.file.path;
      const sizeMb = (req.file.size / 1024 / 1024).toFixed(1);
      console.log(`[ApkFlow] Analyzing uploaded APK: ${req.file.originalname} (${sizeMb} MB)...`);

      const fileBuffer = fs.readFileSync(tempPath);
      const result = await ApkParser.analyze(fileBuffer, req.file.originalname);
      analysesCache.set(result.id, result);

      console.log(`[ApkFlow] Analysis complete for ${result.app.name} (${result.app.packageName}). Endpoints found: ${result.endpoints.length}`);
      res.json(result);
    } catch (err: any) {
      console.error('[ApkFlow] Analysis error:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze APK.' });
    } finally {
      // Clean up temporary disk upload file
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {}
      }
    }
  });

  // Multer Error Handling Middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'APK is too large. Max supported size is 2GB.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    next(err);
  });

  // Serve static assets from public/ or client/dist
  const publicDir = path.resolve(process.cwd(), 'public');
  const clientDist = path.resolve(process.cwd(), 'client', 'dist');

  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  } else if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req: Request, res: Response, next: NextFunction) => {
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
