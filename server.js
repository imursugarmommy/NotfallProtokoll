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

  // Write each log as a JSON-line (one JSON object per line). This makes
  // parsing on read reliable and avoids JSON.parse errors when the client
  // expects JSON.
  const out = {
    level: logEntry.level || "info",
    timestamp: logEntry.timestamp,
    message: logEntry.message,
    data: logEntry.data || null,
  };

  fs.appendFile(logFilePath, JSON.stringify(out) + "\n", (err) => {
    if (err) {
      console.error("Failed to write log to file:", err);
    }
  });
};

// Endpoint to receive logs from frontend
app.post("/api/logs", (req, res) => {
  const { level, message, timestamp, data } = req.body;

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
    level: level || "info",
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

app.get("/api/logs/file", (req, res) => {
  const logFilePath = path.join(
    __dirname,
    "logs",
    `protokoll_${new Date().toISOString().slice(0, 10)}.log`
  );

  if (!fs.existsSync(logFilePath)) {
    return res.status(404).json({
      success: false,
      message: "Log file not found for today",
    });
  }

  fs.readFile(logFilePath, "utf8", (err, content) => {
    if (err) {
      console.error("Failed to read log file:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to read log file" });
    }

    const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");

    const parsed = lines.map((line) => {
      // Try JSON.parse first (we now write JSON-lines). If that fails,
      // fall back to the legacy bracket format parsing. If neither works,
      // return the raw line.
      try {
        return JSON.parse(line);
      } catch (e) {
        const match = line.match(/^\[(.+?)\]\s*(.*?)\s*(\{.*\})?$/);
        if (match) {
          const timestamp = match[1];
          const message = match[2] || "";
          let data = null;
          if (match[3]) {
            try {
              data = JSON.parse(match[3]);
            } catch (err) {
              data = match[3];
            }
          }
          return {
            level: "info",
            timestamp,
            message,
            data,
          };
        }

        return { raw: line };
      }
    });

    res.status(200).json({ success: true, count: parsed.length, logs: parsed });
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
