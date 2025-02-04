package reader

import (
	"fmt"
	"slices"
)

type Reader interface {
	ValidFiles(dir string) ([]string, error)
	// Reads a file and internally stores the time flown with each aircraft.
	// This method has to be thread-safe.
	ReadFile(filepath string) error
	GetPlaneSeconds() map[string]float64
}

type Aircraft struct {
	Name    string
	Seconds float64
}

func (a Aircraft) String() string {
	if a.Seconds < 60 {
		return fmt.Sprintf("%s: %.2f secs", a.Name, a.Seconds)
	}
	mins := a.Seconds / 60
	if mins < 60 {
		return fmt.Sprintf("%s: %.2f mins", a.Name, mins)
	}
	hours := mins / 60
	return fmt.Sprintf("%s: %.2f hours", a.Name, hours)
}

type TimesResult struct {
	Aircrafts []Aircraft
	Failures  []string
}

var successful = 0
var failed = 0
var total = 0

func ReadTimes(reader Reader, files []string) (TimesResult, error) {
	successful = 0
	failed = 0
	total = 0

	var fails []string

	done := make(chan bool)

	for _, filename := range files {
		go func(fp string) {
			err := reader.ReadFile(fp)
			if err != nil {
				fmt.Println(err.Error())
				fails = append(fails, err.Error())
				done <- false
			} else {
				done <- true
			}
		}(filename)
	}

	total = len(files)
	for i := 1; i <= total; i++ {
		if !<-done {
			failed++
		} else {
			successful++
		}
	}

	flownSeconds := reader.GetPlaneSeconds()

	var aircrafts []Aircraft
	for plane, seconds := range flownSeconds {
		aircrafts = append(aircrafts, Aircraft{Name: plane, Seconds: seconds})
	}

	slices.SortFunc(aircrafts, func(a, b Aircraft) int { return int(b.Seconds) - int(a.Seconds) })
	return TimesResult{Aircrafts: aircrafts, Failures: fails}, nil
}

type Progress struct {
	Successful int
	Failed     int
	Total      int
}

func GetProgress() Progress {
	return Progress{Successful: successful, Failed: failed, Total: total}
}
