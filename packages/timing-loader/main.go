package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	competition := flag.String("competition", "", "Competition name (required)")
	serverURL := flag.String("server", "http://localhost:8787", "Result server URL")
	apiKey := flag.String("apikey", "", "API key for server authentication (required)")
	interval := flag.Duration("interval", 10*time.Second, "Polling interval")
	flag.Parse()

	if *competition == "" || *apiKey == "" {
		fmt.Fprintln(os.Stderr, "Usage: esm-loader --competition NAME --apikey KEY [--server URL] [--interval DURATION]")
		flag.PrintDefaults()
		os.Exit(1)
	}

	fmt.Printf("eSM Prequal Timing Loader\n")
	fmt.Printf("Competition: %s\n", *competition)
	fmt.Printf("Server: %s\n", *serverURL)
	fmt.Printf("Interval: %s\n", *interval)

	client := NewIRacingClient()
	sentLaps := make(map[lapKey]bool)

	// Handle graceful shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	ticker := time.NewTicker(*interval)
	defer ticker.Stop()

	fmt.Println("Waiting for iRacing connection...")

	for {
		select {
		case <-sigCh:
			fmt.Println("\nShutting down...")
			client.Close()
			return
		case <-ticker.C:
			if !client.IsConnected() {
				if err := client.Connect(); err != nil {
					fmt.Printf("Waiting for iRacing: %v\n", err)
					continue
				}
				fmt.Println("Connected to iRacing!")
			}

			laptimes, err := client.GetLaptimes()
			if err != nil {
				fmt.Printf("Error reading laptimes: %v\n", err)
				client.Close()
				continue
			}

			// Filter to unsent laps only
			var newLaps []Laptime
			for _, lt := range laptimes {
				key := lapKey{
					DriverID:  lt.DriverID,
					SessionID: lt.SessionID,
					LapNumber: lt.LapNumber,
				}
				if !sentLaps[key] {
					newLaps = append(newLaps, lt)
				}
			}

			if len(newLaps) == 0 {
				continue
			}

			batch := LaptimeBatch{
				Competition: *competition,
				Laptimes:    newLaps,
			}

			if err := sendBatch(*serverURL, *apiKey, batch); err != nil {
				fmt.Printf("Error sending batch: %v\n", err)
				continue
			}

			// Mark as sent
			for _, lt := range newLaps {
				key := lapKey{
					DriverID:  lt.DriverID,
					SessionID: lt.SessionID,
					LapNumber: lt.LapNumber,
				}
				sentLaps[key] = true
			}
		}
	}
}
