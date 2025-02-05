package reader

import (
	"DCSFlightTracker/internal/util"
	"archive/zip"
	"bufio"
	"errors"
	"fmt"
	"io"
	"os"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"sync"
)

type TacviewReader struct {
	totalSeconds    util.Dict[string, float64]
	groundSeconds   util.Dict[string, float64]
	numberOfFlights util.Dict[string, int]
	missionTime     util.Dict[string, *util.Dict[string, float64]]
	// Name of all files that have already been read to not count them again
	alreadyRead util.Dict[string, bool]
	mu          sync.Mutex
}

func NewTacviewReader() TacviewReader {
	return TacviewReader{
		totalSeconds:    util.Dict[string, float64]{},
		groundSeconds:   util.Dict[string, float64]{},
		numberOfFlights: util.Dict[string, int]{},
		alreadyRead:     util.Dict[string, bool]{},
		missionTime:     util.Dict[string, *util.Dict[string, float64]]{},
		mu:              sync.Mutex{},
	}
}

func (r *TacviewReader) ID() string {
	return "Tacview_acmi"
}

func findAuthorMission(scanner *bufio.Scanner) (string, string, error) {
	author := ""
	mission := ""
	for scanner.Scan() {
		line := scanner.Text()
		// Remove BOM
		if len(line) >= 3 && line[:3] == "\xef\xbb\xbf" {
			line = line[3:]
		}

		if strings.HasPrefix(line, "File") {
			continue
		}
		if !strings.HasPrefix(line, "0,") {
			break
		}
		if strings.HasPrefix(line, "0,Author=") {
			author = line[9:]
		}
		if strings.HasPrefix(line, "0,Title=") {
			mission = line[8:]
		}
	}
	if err := scanner.Err(); err != nil {
		return "", "", err
	}
	if author == "" {
		return "", "", errors.New("author not found")
	}
	return author, mission, nil
}

var rePlaneName = regexp.MustCompile(".*Name=(.+?),")

func (r *TacviewReader) readContents(file io.ReadCloser) error {
	scanner := bufio.NewScanner(file)
	author, mission, err := findAuthorMission(scanner)
	if err != nil {
		return err
	}

	reObjectId, err := regexp.Compile(`([\d\w]+),T=.*,Pilot=` + author)
	if err != nil {
		return fmt.Errorf("username (%s) fails regex: %w", author, err)
	}

	// Keep track thread-locally and then merge at the end
	totalSeconds := util.Dict[string, float64]{}
	groundSeconds := util.Dict[string, float64]{}
	numberOfFlights := util.Dict[string, int]{}

	var planeId string
	var planeName string
	var spawnedAt float64
	var currentTimestamp float64
	var stationarySince float64 = -1

	// Location of the aircraft regex. Format along the lines
	// of hexId,T=long|lat|alt
	var reLocation *regexp.Regexp = nil

	for scanner.Scan() {
		line := scanner.Text()

		if strings.HasPrefix(line, "#") {
			// Tacview timestamps start with #
			currentTimestamp, err = strconv.ParseFloat(line[1:], 64)
			if err != nil {
				continue
			}

		} else if planeId != "" && strings.HasPrefix(line, "-"+planeId) {
			// Aircrafts that get despawned are prefixed with a -
			timeAlive := currentTimestamp - spawnedAt
			totalSeconds[planeName] = totalSeconds.LoadOrStore(planeName, 0.0) + timeAlive
			planeId = ""
		} else {
			if planeId == "" {
				// We search for a new aircraft to spawn under the author's name
				// TODO: does this work for detecting a pilot entering an already spawned aircraft?
				matches := reObjectId.FindStringSubmatch(line)
				if len(matches) == 0 {
					continue
				}
				planeId = matches[1]
				planeName = rePlaneName.FindStringSubmatch(line)[1]
				spawnedAt = currentTimestamp
				// We only consider the long/lat/alt of an aircraft to consider it moving or stationary
				reLocation = regexp.MustCompile(planeId + `,T=(-?\d*\.?\d*)\|(-?\d*\.?\d*)\|(-?\d*\.?\d*)`)
				stationarySince = -1

				numberOfFlights[planeName] = numberOfFlights.LoadOrStore(planeName, 0) + 1

			}

			if reLocation != nil {
				// We search for the location of the aircraft
				matches := reLocation.FindStringSubmatch(line)
				if len(matches) == 0 {
					continue
				}

				// If the locations are the same (empty), we start counting how long
				if matches[1] == "" && matches[2] == "" && matches[3] == "" {
					// Aircraft is stationary / hasn't moved since last frame
					stationarySince = currentTimestamp
				} else {
					if stationarySince > -1 {
						stationaryTime := currentTimestamp - stationarySince
						groundSeconds[planeName] = groundSeconds.LoadOrStore(planeName, 0.0) + stationaryTime
					}
					stationarySince = -1
				}
			}

		}
	}

	// To account for any aircrafts that are not despawned at the end of the file
	if planeId != "" {
		timeAlive := currentTimestamp - spawnedAt
		totalSeconds[planeName] = totalSeconds.LoadOrStore(planeName, 0.0) + timeAlive

		if stationarySince > -1 {
			stationaryTime := currentTimestamp - stationarySince
			groundSeconds[planeName] = groundSeconds.LoadOrStore(planeName, 0.0) + stationaryTime
		}

		numberOfFlights[planeName] = numberOfFlights.LoadOrStore(planeName, 0) + 1
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	r.mu.Lock()
	for key, value := range totalSeconds {
		r.totalSeconds[key] = r.totalSeconds.LoadOrStore(key, 0.0) + value

		// Store time spent in mission with the aircraft
		missionTimes := r.missionTime.LoadOrStore(key, &util.Dict[string, float64]{})
		(*missionTimes)[mission] = (*missionTimes).LoadOrStore(mission, 0.0) + value
	}
	for key, value := range groundSeconds {
		r.groundSeconds[key] = r.groundSeconds.LoadOrStore(key, 0.0) + value
	}
	for key, value := range numberOfFlights {
		r.numberOfFlights[key] = r.numberOfFlights.LoadOrStore(key, 0) + value
	}
	r.mu.Unlock()

	return nil
}

// Reads a given Tacview file and extracts the time each plane was flown
// by the author. Thread-safe.
func (r *TacviewReader) ReadFile(filepath string) error {
	r.mu.Lock()
	if _, ok := r.alreadyRead[filepath]; ok {
		return nil
	}
	r.mu.Unlock()

	zipReader, err := zip.OpenReader(filepath)
	if err != nil {
		return fmt.Errorf("failed '%s': %w", filepath, err)
	}
	defer zipReader.Close()

	// We assume Tacview zip files only have one file, but this would allow for multiple if required
	for _, f := range zipReader.File {
		rc, err := f.Open()
		if err != nil {
			return fmt.Errorf("failed '%s': %w", filepath, err)
		}
		if err = r.readContents(rc); err != nil {
			return fmt.Errorf("failed '%s': %w", filepath, err)
		}
		rc.Close()
	}

	r.mu.Lock()
	r.alreadyRead[filepath] = true
	r.mu.Unlock()

	return nil
}

func (r *TacviewReader) GetAircraftStats() []Aircraft {
	var aircrafts []Aircraft

	for key, value := range r.totalSeconds {
		groundSeconds, ok := r.groundSeconds[key]
		if !ok {
			groundSeconds = 0.0
		}
		flights, ok := r.numberOfFlights[key]
		if !ok {
			flights = 0
		}
		var missions []Mission
		for mission, time := range *r.missionTime[key] {
			missions = append(missions, Mission{
				Name:    mission,
				Seconds: time,
			})
		}
		slices.SortFunc(missions, func(a, b Mission) int { return int(b.Seconds) - int(a.Seconds) })

		ac := Aircraft{
			Name:          key,
			TotalSeconds:  value,
			GroundSeconds: groundSeconds,
			Flights:       flights,
			Missions:      missions,
		}
		aircrafts = append(aircrafts, ac)

	}
	return aircrafts
}

func (r *TacviewReader) ValidFiles(dir string) ([]string, error) {
	dirEntries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}
	var validFiles []string
	for _, entry := range dirEntries {
		if strings.HasSuffix(entry.Name(), ".zip.acmi") {
			validFiles = append(validFiles, entry.Name())
		}
	}
	return validFiles, nil
}
