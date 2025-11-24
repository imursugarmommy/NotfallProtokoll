# NotfallProtokoll

Emergency Protocol Logging System with HTML/CSS/JavaScript frontend and Node.js backend.

## Features

- **Frontend**: Clean, responsive web interface built with HTML, CSS, and vanilla JavaScript
- **Backend**: Node.js server using Express.js to capture and store logs
- **Real-time Logging**: Send logs from frontend to backend via REST API
- **Multiple Log Levels**: Support for info, warning, and error log levels
- **Log History**: View all captured logs with timestamps
- **System Status**: Monitor server connection status

## Installation

1. Clone the repository:

```bash
git clone https://github.com/imursugarmommy/NotfallProtokoll.git
cd NotfallProtokoll
```

2. Install dependencies:

```bash
npm install
```

## Usage

1. Start the server:

```bash
npm start
```

2. Open your browser and navigate to:

```
http://localhost:3000
```

3. Use the interface to:
   - Send test logs using the predefined buttons
   - Create custom logs with your own messages
   - View log history in real-time
   - Monitor system status

## API Endpoints

### POST /api/logs

Send a log entry to the backend.

**Request Body:**

```json
{
  "level": "info|warn|error",
  "message": "Log message",
  "timestamp": "ISO 8601 timestamp",
  "data": {}
}
```

### GET /api/logs

Retrieve all captured logs.

**Response:**

```json
{
  "success": true,
  "count": 10,
  "logs": []
}
```

### GET /api/health

Check server health status.

## Project Structure

```
NotfallProtokoll/
├── public/
│   ├── index.html      # Frontend HTML
│   ├── styles.css      # Frontend CSS
│   └── script.js       # Frontend JavaScript
├── server.js           # Backend Node.js server
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Additional**: CORS for cross-origin requests

## License

ISC
