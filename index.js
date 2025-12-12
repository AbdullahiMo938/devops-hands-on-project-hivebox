
import express from "express";
import fetch from "node-fetch";
import APP_VERSION from "./version.js";
import * as client from 'prom-client';
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




res.json({averageTemp , status})
});
app.get("/metrics", async(req,res) => {
  res.setHeader('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
});



export default app;


