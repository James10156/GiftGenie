import express from 'express';
import cors from 'cors';
import { registerRoutes } from '../server/routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register all routes
await registerRoutes(app);

export default app;