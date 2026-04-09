package main

// IRacingClient defines the interface for reading data from iRacing.
// The actual implementation uses platform-specific shared memory access (Windows only).
type IRacingClient interface {
	// Connect attempts to connect to the iRacing simulator.
	Connect() error

	// IsConnected returns true if currently connected to iRacing.
	IsConnected() bool

	// GetSessionID returns the current iRacing subsession ID.
	GetSessionID() (int, error)

	// GetInitialLaps reads session results to recover each driver's best lap.
	// Called once after connecting to handle mid-session starts.
	GetInitialLaps() ([]Laptime, error)

	// GetLaptimes reads all available lap time data from the current session.
	// Returns lap times for all drivers in the session.
	GetLaptimes() ([]Laptime, error)

	// Close disconnects from iRacing.
	Close()
}
