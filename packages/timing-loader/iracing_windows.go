//go:build windows

package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/mpapenbr/goirsdk/irsdk"
)

type windowsIRacingClient struct {
	sdk *irsdk.Irsdk
}

func NewIRacingClient() IRacingClient {
	return &windowsIRacingClient{}
}

func (c *windowsIRacingClient) Connect() error {
	running, err := irsdk.IsSimRunning(context.Background(), http.DefaultClient)
	if err != nil || !running {
		return fmt.Errorf("iRacing is not running")
	}

	sdk := irsdk.NewIrsdk()
	if !sdk.GetData() {
		return fmt.Errorf("could not get initial data from iRacing")
	}

	c.sdk = sdk
	return nil
}

func (c *windowsIRacingClient) IsConnected() bool {
	return c.sdk != nil
}

func (c *windowsIRacingClient) GetSessionID() (int, error) {
	if c.sdk == nil {
		return 0, fmt.Errorf("not connected")
	}
	yaml := c.sdk.GetLatestYaml()
	return yaml.WeekendInfo.SubSessionID, nil
}

func (c *windowsIRacingClient) GetInitialLaps() ([]Laptime, error) {
	if c.sdk == nil {
		return nil, fmt.Errorf("not connected")
	}

	yamlData := c.sdk.GetLatestYaml()
	sessionID := yamlData.WeekendInfo.SubSessionID

	// Find current session number from telemetry
	sessionNum, err := c.sdk.GetIntValue("SessionNum")
	if err != nil {
		return nil, fmt.Errorf("could not read SessionNum: %w", err)
	}

	// Look up results for the current session
	sessions := yamlData.SessionInfo.Sessions
	if int(sessionNum) < 0 || int(sessionNum) >= len(sessions) {
		return nil, nil
	}
	results := sessions[sessionNum].ResultsPositions

	// Build a CarIdx -> Driver lookup
	driverByCarIdx := make(map[int]*struct {
		UserID   int
		UserName string
	})
	for i := range yamlData.DriverInfo.Drivers {
		d := &yamlData.DriverInfo.Drivers[i]
		if d.CarIsPaceCar > 0 || d.IsSpectator > 0 {
			continue
		}
		driverByCarIdx[d.CarIdx] = &struct {
			UserID   int
			UserName string
		}{d.UserID, strings.TrimSpace(d.UserName)}
	}

	var laptimes []Laptime
	for _, r := range results {
		d, ok := driverByCarIdx[r.CarIdx]
		if !ok {
			continue
		}
		// Send the driver's best lap if available
		if r.FastestTime > 0 && r.FastestLap > 0 {
			ft := r.FastestTime
			laptimes = append(laptimes, Laptime{
				DriverID:   d.UserID,
				DriverName: d.UserName,
				SessionID:  sessionID,
				LapNumber:  r.FastestLap,
				LapTime:    &ft,
			})
		}
	}

	return laptimes, nil
}

func (c *windowsIRacingClient) GetLaptimes() ([]Laptime, error) {
	if c.sdk == nil {
		return nil, fmt.Errorf("not connected")
	}

	if !c.sdk.GetData() {
		return nil, fmt.Errorf("no new data available")
	}

	yamlData := c.sdk.GetLatestYaml()
	sessionID := yamlData.WeekendInfo.SubSessionID

	// Read per-car-index telemetry arrays
	carIdxLap, lapErr := c.sdk.GetIntValues("CarIdxLap")
	carIdxLastLapTime, timeErr := c.sdk.GetFloatValues("CarIdxLastLapTime")
	if lapErr != nil || timeErr != nil {
		return nil, fmt.Errorf("could not read telemetry: lap=%v time=%v", lapErr, timeErr)
	}

	var laptimes []Laptime

	for _, driver := range yamlData.DriverInfo.Drivers {
		if driver.CarIsPaceCar > 0 || driver.IsSpectator > 0 {
			continue
		}

		carIdx := driver.CarIdx
		if carIdx < 0 || carIdx >= len(carIdxLap) {
			continue
		}

		lapNum := int(carIdxLap[carIdx])
		if lapNum <= 0 {
			continue
		}

		driverName := strings.TrimSpace(driver.UserName)

		var lapTime *float64
		if carIdx < len(carIdxLastLapTime) {
			lt := float64(carIdxLastLapTime[carIdx])
			if lt > 0 {
				lapTime = &lt
			}
		}

		laptimes = append(laptimes, Laptime{
			DriverID:   driver.UserID,
			DriverName: driverName,
			SessionID:  sessionID,
			LapNumber:  lapNum,
			LapTime:    lapTime,
		})
	}

	return laptimes, nil
}

func (c *windowsIRacingClient) Close() {
	if c.sdk != nil {
		c.sdk.Close()
		c.sdk = nil
	}
}
