package reader

import (
	"archive/zip"
	"bufio"
	"errors"
	"fmt"
	"io"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

type TacviewReader struct {
	totalSeconds    sync.Map
	groundSeconds   sync.Map
	numberOfFlights sync.Map

	// Name of all files that have already been read to not count them again
	alreadyRead sync.Map
}

func NewTacviewReader() TacviewReader {
	return TacviewReader{
		totalSeconds:    sync.Map{},
		groundSeconds:   sync.Map{},
		numberOfFlights: sync.Map{},
	}
}

func (r *TacviewReader) ID() string {
	return "Tacview"
}

func findAuthor(scanner *bufio.Scanner) (string, error) {
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "Author=") {
			return strings.TrimSpace(strings.Split(line, "=")[1]), nil
		}
	}
	if err := scanner.Err(); err != nil {
		return "", err
	}
	return "", errors.New("author not found")
}

var rePlaneName = regexp.MustCompile(".*Name=(.+?),")

func (r *TacviewReader) readContents(file io.ReadCloser) error {
	scanner := bufio.NewScanner(file)
	author, err := findAuthor(scanner)
	if err != nil {
		return err
	}

	reObjectId, err := regexp.Compile(`([\d\w]+),T=.*,Pilot=` + author)
	if err != nil {
		return fmt.Errorf("username (%s) fails regex: %w", author, err)
	}

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
				return fmt.Errorf("failed to parse timestamp: %w", err)
			}

		} else if planeId != "" && strings.HasPrefix(line, "-"+planeId) {
			// Aircrafts that get despawned are prefixed with a -
			timeAlive := currentTimestamp - spawnedAt
			actual, _ := r.totalSeconds.LoadOrStore(planeName, 0.0)
			r.totalSeconds.Store(planeName, actual.(float64)+timeAlive)
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
				reLocation = regexp.MustCompile(planeId + `,T=(-?\d*\.?\d*)\|(-?\d*\.?\d*)\|(-?\d*\.?\d*)`)
				stationarySince = -1

				actual, _ := r.numberOfFlights.LoadOrStore(planeName, 0)
				r.numberOfFlights.Store(planeName, actual.(int)+1)
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
						actual, _ := r.groundSeconds.LoadOrStore(planeName, 0.0)
						r.groundSeconds.Store(planeName, actual.(float64)+stationaryTime)
					}
					stationarySince = -1
				}
			}

		}
	}

	// To account for any aircrafts that are not despawned at the end of the file
	if planeId != "" {
		timeAlive := currentTimestamp - spawnedAt
		actual, _ := r.totalSeconds.LoadOrStore(planeName, 0.0)
		r.totalSeconds.Store(planeName, actual.(float64)+timeAlive)

		if stationarySince > -1 {
			stationaryTime := currentTimestamp - stationarySince
			actual, _ := r.groundSeconds.LoadOrStore(planeName, 0.0)
			r.groundSeconds.Store(planeName, actual.(float64)+stationaryTime)
		}

		actual, _ = r.numberOfFlights.LoadOrStore(planeName, 0)
		r.numberOfFlights.Store(planeName, actual.(int)+1)
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	return nil
}

// Reads a given Tacview file and extracts the time each plane was flown
// by the author. Thread-safe.
func (r *TacviewReader) ReadFile(filepath string) error {
	if _, ok := r.alreadyRead.Load(filepath); ok {
		return nil
	}

	zipReader, err := zip.OpenReader(filepath)
	if err != nil {
		return fmt.Errorf("failed '%s': %w", filepath, err)
	}
	defer zipReader.Close()

	// We assume Tacview zip files only have one file, but this would allow for multiple if required
	for _, f := range zipReader.File {
		rc, err := f.Open()
		r.readContents(rc)
		if err != nil {
			return fmt.Errorf("failed '%s': %w", filepath, err)
		}
		rc.Close()
	}

	r.alreadyRead.Store(filepath, true)

	return nil
}

func (r *TacviewReader) GetAircraftStats() []Aircraft {
	var aircrafts []Aircraft
	r.totalSeconds.Range(func(key, value interface{}) bool {
		groundSeconds, ok := r.groundSeconds.Load(key)
		if !ok {
			groundSeconds = 0.0
		}
		flights, ok := r.numberOfFlights.Load(key)
		if !ok {
			flights = 0
		}

		ac := Aircraft{
			Name:          key.(string),
			TotalSeconds:  value.(float64),
			GroundSeconds: groundSeconds.(float64),
			Flights:       flights.(int),
		}
		aircrafts = append(aircrafts, ac)
		return true
	})
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
