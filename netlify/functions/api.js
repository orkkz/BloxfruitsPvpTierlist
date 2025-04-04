import express from 'express';
import serverless from 'serverless-http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from '../../server/routes.js';
import { setupAuth } from '../../server/auth.js';
import session from 'express-session';
import MemoryStore from 'memorystore';

const MemoryStoreSession = MemoryStore(session);
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// Session setup
app.use(
  session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // 24 hours
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'bloxfruits-secret'
  })
);

// Setup authentication
setupAuth(app);

// Register routes
await registerRoutes(app);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Handler for serverless function
export const handler = serverless(app);