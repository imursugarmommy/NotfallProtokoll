// Configuration
const API_URL = window.location.origin;
let logsSentCount = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkServerHealth();
    refreshLogs();
    updateLogCount();
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
                data: data
            };

            const response = await fetch(`${this.apiUrl}/api/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logEntry)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            logsSentCount++;
            updateLogCount();
            
            return result;
        } catch (error) {
            console.error('Failed to send log:', error);
            displayLocalError(`Failed to send log: ${error.message}`);
            return null;
        }
    }

    info(message, data = null) {
        return this.sendLog('info', message, data);
    }

    warn(message, data = null) {
        return this.sendLog('warn', message, data);
    }

    error(message, data = null) {
        return this.sendLog('error', message, data);
    }
}

// Create global logger instance
const logger = new Logger(API_URL);

// Test functions for buttons
async function testInfoLog() {
    await logger.info('This is an informational message', { 
        source: 'test button',
        action: 'info log test'
    });
    await refreshLogs();
}

async function testWarnLog() {
    await logger.warn('This is a warning message', { 
        source: 'test button',
        action: 'warning log test',
        severity: 'medium'
    });
    await refreshLogs();
}

async function testErrorLog() {
    await logger.error('This is an error message', { 
        source: 'test button',
        action: 'error log test',
        severity: 'high'
    });
    await refreshLogs();
}

// Send custom log from form
async function sendCustomLog() {
    const level = document.getElementById('logLevel').value;
    const message = document.getElementById('logMessage').value.trim();

    if (!message) {
        displayLocalError('Please enter a message');
        return;
    }

    await logger.sendLog(level, message, { source: 'custom log form' });
    
    // Clear the input
    document.getElementById('logMessage').value = '';
    
    await refreshLogs();
}

// Refresh logs from server
async function refreshLogs() {
    try {
        const response = await fetch(`${API_URL}/api/logs`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        displayLogs(result.logs);
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        displayLocalError(`Failed to fetch logs: ${error.message}`);
    }
}

// Display logs in the UI
function displayLogs(logs) {
    const container = document.getElementById('logContainer');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<p class="placeholder">No logs yet. Click a button above to send a test log.</p>';
        return;
    }

    // Display most recent logs first (reverse order)
    const sortedLogs = [...logs].reverse();
    
    container.innerHTML = sortedLogs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const dataString = log.data ? JSON.stringify(log.data, null, 2) : '';
        
        return `
            <div class="log-entry ${log.level}">
                <div class="log-header">
                    <span class="log-level ${log.level}">${log.level}</span>
                    <span class="log-timestamp">${timestamp}</span>
                </div>
                <div class="log-message">${escapeHtml(log.message)}</div>
                ${dataString ? `<pre style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-secondary);">${escapeHtml(dataString)}</pre>` : ''}
            </div>
        `;
    }).join('');
}

// Check server health
async function checkServerHealth() {
    const statusElement = document.getElementById('serverStatus');
    
    try {
        const response = await fetch(`${API_URL}/api/health`);
        
        if (response.ok) {
            statusElement.textContent = 'Connected ✓';
            statusElement.style.color = 'var(--success-color)';
        } else {
            statusElement.textContent = 'Error';
            statusElement.style.color = 'var(--danger-color)';
        }
    } catch (error) {
        statusElement.textContent = 'Disconnected ✗';
        statusElement.style.color = 'var(--danger-color)';
        console.error('Server health check failed:', error);
    }
}

// Update log count display
function updateLogCount() {
    document.getElementById('logCount').textContent = logsSentCount;
}

// Display local error (when backend is unavailable)
function displayLocalError(message) {
    const container = document.getElementById('logContainer');
    const errorHtml = `
        <div class="log-entry error">
            <div class="log-header">
                <span class="log-level error">Error</span>
                <span class="log-timestamp">${new Date().toLocaleString()}</span>
            </div>
            <div class="log-message">${escapeHtml(message)}</div>
        </div>
    `;
    
    if (container.querySelector('.placeholder')) {
        container.innerHTML = errorHtml;
    } else {
        container.insertAdjacentHTML('afterbegin', errorHtml);
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enable Enter key for sending custom log
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('logMessage');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendCustomLog();
            }
        });
    }
});
