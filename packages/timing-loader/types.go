package main

// Laptime represents a single lap time record to send to the server.
type Laptime struct {
	DriverID   int      `json:"driverId"`
	DriverName string   `json:"driverName"`
	SessionID  int      `json:"sessionId"`
	LapNumber  int      `json:"lapNumber"`
	LapTime    *float64 `json:"lapTime"` // nil if invalid lap
}

// LaptimeBatch is the request body for the POST /api/laptimes endpoint.
type LaptimeBatch struct {
	Competition string    `json:"competition"`
	Laptimes    []Laptime `json:"laptimes"`
}

// LaptimeBatchResponse is the response from the POST /api/laptimes endpoint.
type LaptimeBatchResponse struct {
	Inserted int `json:"inserted"`
}

// lapKey uniquely identifies a lap to avoid sending duplicates.
type lapKey struct {
	DriverID  int
	SessionID int
	LapNumber int
}
