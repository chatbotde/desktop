package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create server with CORS middleware
	router := mux.NewRouter()

	// Setup CORS - allow requests from Electron app
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // In production, specify exact origins
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Setup routes
	setupRoutes(router)

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Buddy backend server starting on http://localhost:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// setupRoutes configures all API routes
func setupRoutes(r *mux.Router) {
	// Health check
	r.HandleFunc("/health", handleHealth).Methods("GET")

	// API v1
	api := r.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/status", handleStatus).Methods("GET")

	// Example: Echo endpoint for testing
	api.HandleFunc("/echo", handleEcho).Methods("POST")
}

// handleHealth returns server health status
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"service": "buddy-backend",
		"time":    time.Now().UTC().Format(time.RFC3339),
	})
}

// handleStatus returns server status information
func handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "running",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// handleEcho echoes back the request body (for testing)
func handleEcho(w http.ResponseWriter, r *http.Request) {
	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"echo":      body,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}
