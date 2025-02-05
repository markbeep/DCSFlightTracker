package reader

import (
	"testing"
)

func TestTotalHours(t *testing.T) {
	tacview := NewTacviewReader()
	err := tacview.ReadFile("../../test/shortened.zip.acmi")
	if err != nil {
		t.Error(err)
	}
	stats := tacview.GetAircraftStats()
	if len(stats) != 1 {
		t.Fatalf("Expected 1 aircraft, got %d", len(stats))
	}
	oh58d := stats[0]
	if oh58d.Name != "OH58D" {
		t.Fatalf("Expected OH58D, got %s", oh58d.Name)
	}
	if oh58d.TotalSeconds != 13249.81 {
		t.Fatalf("Expected 13249.81, got %f", oh58d.TotalSeconds)
	}
	if oh58d.GroundSeconds < 30.159 || oh58d.GroundSeconds > 30.16 {
		t.Fatalf("Expected 30.1599999, got %f", oh58d.GroundSeconds)
	}
	if oh58d.Flights != 2 {
		t.Fatalf("Expected 2, got %d", oh58d.Flights)
	}
	if len(oh58d.Missions) != 1 {
		t.Fatalf("Expected 1 mission, got %d", len(oh58d.Missions))
	}
	if oh58d.Missions[0].Name != "TestMission" {
		t.Fatalf("Expected TestMission, got %s", oh58d.Missions[0].Name)
	}
	if oh58d.Missions[0].Seconds != 13249.81 {
		t.Fatalf("Expected 13249.81, got %f", oh58d.Missions[0].Seconds)
	}

}
