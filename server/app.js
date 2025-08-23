// app.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';

// Importing Routes
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import miscRoutes from './routes/miscellaneousRoutes.js';
import examRoutes from './routes/examRoutes.js';


// Error Middleware
import errorMiddleware from './middleware/errorMiddleware.js';

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
export const myCache = new NodeCache();

// Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (e.g., avatar uploads, thumbnails, receipts)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/receipts', express.static(path.join(process.cwd(), 'uploads', 'receipts')));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL, // e.g., http://localhost:5173
  credentials: true, // allow cookies/auth
}));

// API Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/exam", examRoutes);

app.use("/api/v1", miscRoutes); // any additional routes (e.g., contact, feedback)

// Health check route
app.use("/ping", (req, res) => {
  res.send("Server is working");
});

// 404 handler
app.all("*", (req, res) => {
  res.status(404).send("!oops page not found");
});

// Global error handler
app.use(errorMiddleware);

export default app;
