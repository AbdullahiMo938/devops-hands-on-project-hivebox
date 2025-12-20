import cron from 'node-cron';
import express from "express";
// import fetch from "node-fetch";
import APP_VERSION from "./version.js";
import * as client from 'prom-client';
import 'dotenv/config';
import Redis from "ioredis";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const valkey = new Redis({
  host : "localhost",
  port: 6379
});
const s3 = new S3Client({
  endpoint: "http://localhost:9000",
  region: "us-east-1",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin",
  },
  forcePathStyle: true, // Necessary for local MinIO
});



// // Now you can access your variables
// console.log(process.env.AWS_S3_BUCKET);


const app = express();

const register  = new client.Registry();
client.collectDefaultMetrics({ register})

function printversion() {
console.log(APP_VERSION)
}
printversion();
app.get("/version", (req, res) => {
  res.send(`API running. Version: ${APP_VERSION}`);
});


app.get("/temperature", async (req, res) => {
    // 1. Read from the environment, or use a default string if missing
    const SENSEBOX_ID = process.env.SENSEBOX_ID || "606b20a3b8e635001b80a306";

// 2. Use the variable in the URL
    const resp = await fetch(`https://api.opensensemap.org/boxes/${SENSEBOX_ID}/data/606b20a3b8e635001b80a309`);
    const senseBoxData = await resp.json();
    // console.log(senseBoxData);
    const oneHourAgo = Date.now() -   60 *60 * 1000;

    

  // 2. Filter for recent measurements
  const recentData = senseBoxData.filter((reading) => {
    return new Date(reading.createdAt).getTime() > oneHourAgo;
  });

  // 2. Safety Check: Handle empty data
  if (recentData.length === 0) {
    res.json({ status: "No Data" });
    return;
  }

  // 3. Sum the temperature values
  const totalTemperature = recentData.reduce((sum, reading) => {
    return sum + parseFloat(reading.value);
  }, 0);

  // 4. Calculate the average
  const averageTemp = totalTemperature / recentData.length;

  
  let status = "";

  if (averageTemp < 10) {
    status = "Too cold";
  } else if (averageTemp <= 36) {
    status = "Good";
  } else {
    status = "Too Hot";
  }
 const result = { averageTemp , status}

 try {
  await valkey.set("latest_temp" , JSON.stringify(result));
 } catch (err) {
  console.error ("Cache error:" , err);
 }



res.json(result);


});
app.get("/metrics", async(req,res) => {
  res.setHeader('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
});
async function archiveToStorage() {
  const data = await valkey.get("latest_temp");
  if (!data) return { status: "empty" };

  const fileName = `archive-${Date.now()}.json`;

  

  try {
    // Sending the package
    await s3.send(new PutObjectCommand({
      Bucket: "hiveboxbucket",
      Key: fileName,
      Body: data
    }));

    // Printing our success message
    console.log(` Success: Object stored as ${fileName}`);
    return { status: "success", file: fileName };

  } catch (error) {
    // ⚠️ If something goes wrong
    console.error(" Failed to store object:", error);
    return { status: "error", message: error.message };
  }
}


app.get("/store", async (req, res) => {
  try { 
    const result = await archiveToStorage();
    res.json({
      message: "Archive process activated", 
      details: result
    });
  } catch (error) {
    res.status(500).json({ error: "failed to run manual archive" });
  }
}); 


cron.schedule('*/5 * * * *', async () => {
  console.log("⏰ Running scheduled archive...");
  await archiveToStorage();
}); // 👈 The cron job sits on its own

app.listen(3000, () => console.log("🚀 Server running on port 3000"));
export default app;


