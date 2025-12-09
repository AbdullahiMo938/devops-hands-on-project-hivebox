import express from "express";
import fetch from "node-fetch";
import APP_VERSION from "./version.js";
const app = express();

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
    const resp = await fetch(`https://api.opensensemap.org/boxes/${SENSEBOX_ID}`);
    const senseBoxData = await resp.json();

    const oneHourAgo = Date.now() - 60 * 60 * 1000;

  // 2. Filter for recent measurements
  const recentData = senseBoxData.filter((reading) => {
    return reading.createdAt > oneHourAgo;
  });

  // 3. Sum the temperature values
  const totalTemperature = recentData.reduce((sum, reading) => {
    return sum + reading.value;
  }, 0);

  // 4. Calculate the average
  const averageTemp = totalTemperature / recentData.length;

  



res.json({averageTemp})

});

export default app;


