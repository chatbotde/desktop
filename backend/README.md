# Buddy Backend

Go backend server for the Buddy Electron application.

## Features

- ✅ HTTP REST API server
- ✅ CORS support for Electron frontend
- ✅ Graceful shutdown
- ✅ Health check endpoints
- ✅ Scalable architecture

## Getting Started

### Prerequisites

- Go 1.25 or higher
- Git

### Installation

1. Navigate to the backend directory:
```bash
cd buddy/backend
```

2. Install dependencies:
```bash
go mod download
```

3. Run the server:
```bash
go run main.go
```

Or build and run:
```bash
go build -o buddy-backend main.go
./buddy-backend
```

### Configuration

The server uses environment variables for configuration:

- `PORT` - Server port (default: 8080)

Example:
```bash
PORT=3000 go run main.go
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server health status.

### Status
```
GET /api/v1/status
```

Returns server status and version information.

### Echo (Testing)
```
POST /api/v1/echo
```

Echoes back the request body (useful for testing).

## Development

### Project Structure

```
backend/
├── main.go          # Entry point and server setup
├── go.mod           # Go module definition
├── go.sum           # Dependency checksums
└── README.md        # This file
```

### Adding New Routes

Add new routes in the `setupRoutes` function in `main.go`:

```go
api.HandleFunc("/your-endpoint", handleYourEndpoint).Methods("GET")
```

## Building

Build for your current platform:
```bash
go build -o buddy-backend main.go
```

Build for Windows:
```bash
GOOS=windows GOARCH=amd64 go build -o buddy-backend.exe main.go
```

Build for Linux:
```bash
GOOS=linux GOARCH=amd64 go build -o buddy-backend main.go
```

Build for macOS:
```bash
GOOS=darwin GOARCH=amd64 go build -o buddy-backend main.go
```

## Integration with Electron

The backend runs as a local HTTP server that the Electron frontend can communicate with via HTTP requests. The CORS middleware allows requests from the Electron app.

## License

ISC
