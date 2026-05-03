import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import routes from './routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ============================================
// LOGGING SETUP
// ============================================
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const logFile = path.join(logsDir, 'app.log');

export function writeLog(message: string): void {
  const line = `${message}\n`;
  process.stdout.write(line);
  try {
    fs.appendFileSync(logFile, line);
  } catch {
    // non-fatal — don't crash if log write fails
  }
}

export function logEvent(level: 'INFO' | 'WARN' | 'ERROR', event: string, details?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const detailStr = details ? ' ' + JSON.stringify(details) : '';
  writeLog(`[${ts}] ${level} ${event}${detailStr}`);
}

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: true, // allow all origins in development
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Rate limiters ----
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// ---- Structured request logging ----
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const userId = (req as any).user?.id ?? '-';
    const ts = new Date().toISOString();
    writeLog(`[${ts}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms userId=${userId}`);
  });
  next();
});

// ============================================
// ROUTES
// ============================================
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Appointment Booking API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      services: '/api/services',
      resources: '/api/resources',
      bookings: '/api/bookings',
      availability: '/api/availability',
    },
  });
});

app.use('/api', routes);

// ============================================
// ERROR HANDLING
// ============================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  logEvent('ERROR', `Unhandled error on ${req.method} ${req.path}`, { message: err?.message });
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err?.message : 'Internal server error',
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  logEvent('INFO', 'Server started', { port: PORT });
  console.log('🚀 Server started successfully!');
  console.log(`📡 API running on http://localhost:${PORT}`);
  console.log(`📚 API docs available at http://localhost:${PORT}/`);
  console.log(`\n🔐 Test Credentials:`);
  console.log(`   Customer: customer@bookflow.com / password123`);
  console.log(`   Organiser: organiser@bookflow.com / password123`);
  console.log(`   Admin: admin@bookflow.com / password123`);
});

export default app;
