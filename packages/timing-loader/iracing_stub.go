//go:build !windows

package main

import "fmt"

type stubIRacingClient struct{}

func NewIRacingClient() IRacingClient {
	return &stubIRacingClient{}
}

func (c *stubIRacingClient) Connect() error {
	return fmt.Errorf("iRacing SDK is only available on Windows")
}

func (c *stubIRacingClient) IsConnected() bool {
	return false
}

func (c *stubIRacingClient) GetInitialLaps() ([]Laptime, error) {
	return nil, fmt.Errorf("not available on this platform")
}

func (c *stubIRacingClient) GetSessionID() (int, error) {
	return 0, fmt.Errorf("not available on this platform")
}

func (c *stubIRacingClient) GetLaptimes() ([]Laptime, error) {
	return nil, fmt.Errorf("not available on this platform")
}

func (c *stubIRacingClient) Close() {}
