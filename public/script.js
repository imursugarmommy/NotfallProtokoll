// Configuration
const API_URL = window.location.origin;
const logs = [];

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  checkServerHealth();
  readLogsFromFile();

  // Enable Enter key for sending custom log
  const messageInput = document.getElementById("logMessage");
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendCustomLog();
      }
    });
  }
});

// Logger class to send logs to backend
class Logger {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async sendLog(level, message, data = null) {
    try {
      const logEntry = {
        level: level,
        message: message,
        timestamp: new Date().toISOString(),
        data: data,
      };

      const response = await fetch(`${this.apiUrl}/api/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("Failed to send log:", error);
      displayLocalError(`Failed to send log: ${error.message}`);
      return null;
    }
  }

  info(message, data = null) {
    return this.sendLog("info", message, data);
  }

  warning(message, data = null) {
    return this.sendLog("warning", message, data);
  }
}

const logger = new Logger(API_URL);

async function leave() {
  await logger.warning("One Person left", {
    source: "button",
    level: "warning",
  });
}

async function come() {
  await logger.info("One Person came", {
    source: "button",
    level: "info",
  });
}

async function readLogsFromFile() {
  try {
    const response = await fetch(`${API_URL}/api/logs/file`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();

    const logsFromFile = JSON.parse(result).logs;
    logs.push(...logsFromFile);
    updateCounts();

    displayLogs(logsFromFile);
  } catch (error) {
    console.error("Failed to read logs from file:", error);
    displayLocalError(`Failed to read logs from file: ${error.message}`);
  }
}

// Display logs in the UI
function displayLogs(logs) {
  const container = document.getElementById("logContainer");

  if (!logs || logs.length === 0) {
    container.innerHTML =
      '<p class="placeholder">No logs yet. Click a button above to send a test log.</p>';
    return;
  }

  // sort logs by timestamp descending
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  container.innerHTML = sortedLogs
    .map((log) => {
      const timestamp = new Date(log.timestamp).toLocaleString();

      return `
            <div class="log-entry ${log.level}">
              <p class="log-timestamp">${timestamp}</p>
              <p class="log-message">${escapeHtml(log.message)}</p>
            </div>
        `;
    })
    .join("");
}

// Check server health
async function checkServerHealth() {
  const statusElement = document.getElementById("serverStatus");

  try {
    const response = await fetch(`${API_URL}/api/health`);

    if (response.ok) {
      statusElement.textContent = "Connected ✓";
      statusElement.style.color = "var(--success-color)";
    } else {
      statusElement.textContent = "Error";
      statusElement.style.color = "var(--danger-color)";
    }
  } catch (error) {
    statusElement.textContent = "Disconnected ✗";
    statusElement.style.color = "var(--danger-color)";
    console.error("Server health check failed:", error);
  }
}

async function updateLogCount() {
  const countElement = document.getElementById("logCount");
  countElement.textContent = `${logs.length}`;
}

// Update total, info and warning counts in the UI
function updateCounts() {
  const total = logs.length;
  const infoCount = logs.reduce((acc, l) => {
    try {
      return acc + ((l.level || "info").toString().toLowerCase() === "info");
    } catch (e) {
      return acc;
    }
  }, 0);

  const warningCount = logs.reduce((acc, l) => {
    try {
      return acc + ((l.level || "").toString().toLowerCase() === "warning");
    } catch (e) {
      return acc;
    }
  }, 0);

  const totalEl = document.getElementById("logCount");
  const infoEl = document.getElementById("infoCount");
  const warningEl = document.getElementById("warningCount");
  const presentEl = document.getElementById("presentCount");

  if (totalEl) totalEl.textContent = `${total}`;
  if (infoEl) infoEl.textContent = `${infoCount}`;
  if (warningEl) warningEl.textContent = `${warningCount}`;
  // Leute im Gebaeude = info - warning (don't go below 0)
  const present = Math.max(0, infoCount - warningCount);
  if (presentEl) presentEl.textContent = `${present}`;
}

// Display local error (when backend is unavailable)
function displayLocalError(message) {
  const container = document.getElementById("logContainer");
  const errorHtml = `
        <div class="log-entry error">
            <span class="log-level error">Error</span>
            <span class="log-timestamp">${new Date().toLocaleString()}</span>
            <div class="log-message">${escapeHtml(message)}</div>
        </div>
    `;

  if (container.querySelector(".placeholder")) {
    container.innerHTML = errorHtml;
  } else {
    container.insertAdjacentHTML("afterbegin", errorHtml);
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
