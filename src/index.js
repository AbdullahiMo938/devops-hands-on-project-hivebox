import cron from 'node-cron';
import express from "express";
import APP_VERSION from "./version.js";
import * as client from 'prom-client';
import 'dotenv/config';
import Redis from "ioredis";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ==========================================
// 1. Express App
// ==========================================
const app = express();

// ==========================================
// 2. Redis / Valkey Client
// ==========================================
const valkey = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  connectTimeout: 5000,
  maxRetriesPerRequest: 5,

  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

valkey.on("connect", () => {
  console.log("✅ Connected to Valkey/Redis");
});

valkey.on("error", (err) => {
  console.error("❌ Valkey Error:", err.message);
});

// ==========================================
// 3. S3 / MinIO Client
// ==========================================
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: "us-east-1",

  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },

  forcePathStyle: true,
});

// ==========================================
// 4. Prometheus Metrics
// ==========================================
const register = new client.Registry();

client.collectDefaultMetrics({
  register
});

const tempGauge = new client.Gauge({
  name: "hivebox_global_avg_temp_24h",
  help: "Average temperature from all active global sensors in the last 24 hours",
  registers: [register]
});

// ==========================================
// 5. Fetch Global Temperature Data
// ==========================================
async function getGlobalAverage() {
  try {
    // 24 hour window
    const timeWindow = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    // IMPORTANT:
    // Removed minimal=true because it removes useful fields
    const url =
      `https://api.opensensemap.org/boxes?phenomenon=temperature&date=${timeWindow}`;

    console.log(`🌐 Fetching global data since: ${timeWindow}`);

    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error(`API Error: ${resp.status}`);
    }

    const boxes = await resp.json();

    console.log(`📦 Boxes fetched: ${boxes.length}`);

    // Extract temperatures safely
    const temperatures = boxes
      .flatMap(box => box.sensors || [])
      .map(sensor => {
        const value = sensor?.lastMeasurement?.value;
        return parseFloat(value);
      })
      .filter(temp => {
        return !isNaN(temp) && temp > -50 && temp < 60;
      });

    console.log(`🌡️ Valid temperatures: ${temperatures.length}`);

    if (temperatures.length === 0) {
      return {
        averageTemp: 0,
        sensorsCount: 0,
        status: "No valid measurements"
      };
    }

    // Calculate average
    const averageTemp =
      temperatures.reduce((sum, temp) => sum + temp, 0) /
      temperatures.length;

    return {
      averageTemp: parseFloat(averageTemp.toFixed(2)),
      sensorsCount: temperatures.length,

      status:
        averageTemp < 10
          ? "Too cold"
          : averageTemp <= 36
          ? "Good"
          : "Too Hot",

      window: "Last 24 hours",
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    console.error("❌ Global Fetch Error:", err.message);
    return null;
  }
}

// ==========================================
// 6. Archive to S3 / MinIO
// ==========================================
async function archiveToStorage() {
  try {
    const data = await valkey.get("latest_temp");

    if (!data) {
      return {
        status: "empty"
      };
    }

    const fileName = `archive-24h-${Date.now()}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || "hiveboxbucket",
        Key: fileName,
        Body: data,
        ContentType: "application/json"
      })
    );

    console.log(`📁 Archived: ${fileName}`);

    return {
      status: "success",
      file: fileName
    };

  } catch (error) {
    console.error("❌ S3 Archive Failed:", error.message);

    return {
      status: "error",
      error: error.message
    };
  }
}

// ==========================================
// 7. Routes
// ==========================================

// Health / Version Route
app.get("/version", (req, res) => {
  res.send(`HiveBox API running. Version: ${APP_VERSION}`);
});

// Temperature Route
app.get("/temperature", async (req, res) => {
  const result = await getGlobalAverage();

  if (!result) {
    return res.status(503).json({
      error: "Service unavailable"
    });
  }

  // Cache result
  if (result.sensorsCount > 0) {
    try {
      await valkey.set(
        "latest_temp",
        JSON.stringify(result),
        "EX",
        3600
      );

      tempGauge.set(result.averageTemp);

    } catch (err) {
      console.error("❌ Cache update failed:", err.message);
    }
  }

  res.json(result);
});

// Prometheus Metrics Route
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Manual Archive Route
app.get("/store", async (req, res) => {
  const result = await archiveToStorage();

  res.json({
    message: "Manual archive triggered",
    details: result
  });
});

// ==========================================
// 8. Cron Job
// ==========================================

// Every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("⏰ Running scheduled archive...");
  await archiveToStorage();
});

// ==========================================
// 9. Start Server
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 HiveBox Global API running on port ${PORT}`);
});

// ==========================================
// 10. Export App
// ==========================================
export default app;