const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Log storage (in-memory for simplicity)
const logs = [];

writeLogToFile = (logEntry) => {
  const logDir = path.join(__dirname, "logs");
  fs.mkdirSync(logDir, { recursive: true });

  const logFilePath = path.join(
    logDir,
    `protokoll_${new Date().toISOString().slice(0, 10)}.log`
  );
  const formattedLog = `[${logEntry.timestamp}] ${logEntry.message} ${
    logEntry.data ? JSON.stringify(logEntry.data) : ""
  }\n`;

  fs.appendFile(logFilePath, formattedLog, (err) => {
    if (err) {
      console.error("Failed to write log to file:", err);
    }
  });
};

// Endpoint to receive logs from frontend
app.post("/api/logs", (req, res) => {
  const { message, timestamp, data } = req.body;

  // Validate request body
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  // Validate message field
  if (message !== undefined && typeof message !== "string") {
    return res.status(400).json({
      success: false,
      message: "Message must be a string",
    });
  }

  const logEntry = {
    message: message || "",
    timestamp: timestamp || new Date().toISOString(),
    data: data || null,
  };

  logs.push(logEntry);

  // Log to console
  const consoleMessage = `[${logEntry.timestamp}] ${logEntry.message}`;
  console.info(consoleMessage);

  writeLogToFile(logEntry);

  res.status(200).json({
    success: true,
    message: "Log received",
    logId: logs.length - 1,
  });
});

// Endpoint to retrieve all logs
app.get("/api/logs", (req, res) => {
  res.status(200).json({
    success: true,
    count: logs.length,
    logs: logs,
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
