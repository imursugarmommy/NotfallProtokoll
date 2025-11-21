const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Log storage (in-memory for simplicity)
const logs = [];

// Endpoint to receive logs from frontend
app.post('/api/logs', (req, res) => {
    const { level, message, timestamp, data } = req.body;
    
    const logEntry = {
        level: level || 'info',
        message: message || '',
        timestamp: timestamp || new Date().toISOString(),
        data: data || null
    };
    
    logs.push(logEntry);
    
    // Log to console with appropriate level
    const consoleMessage = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] ${logEntry.message}`;
    
    switch (logEntry.level) {
        case 'error':
            console.error(consoleMessage, logEntry.data || '');
            break;
        case 'warn':
            console.warn(consoleMessage, logEntry.data || '');
            break;
        default:
            console.log(consoleMessage, logEntry.data || '');
    }
    
    res.status(200).json({ 
        success: true, 
        message: 'Log received',
        logId: logs.length - 1
    });
});

// Endpoint to retrieve all logs
app.get('/api/logs', (req, res) => {
    res.status(200).json({
        success: true,
        count: logs.length,
        logs: logs
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
});
