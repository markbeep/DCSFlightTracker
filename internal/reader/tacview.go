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
	planeSeconds sync.Map
	alreadyRead  sync.Map
}

func NewTacviewReader() TacviewReader {
	return TacviewReader{
		planeSeconds: sync.Map{},
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

	reLineMatch, err := regexp.Compile(`([\d\w]+),T=\d+\.\d+\|\d+\.\d+\|.*Pilot=` + author)
	if err != nil {
		return fmt.Errorf("username (%s) fails regex: %w", author, err)
	}

	var currentPlaneId string
	var currentPlaneName string
	var currentPlaneSpawnedAt float64
	var currentTimestamp float64
	for scanner.Scan() {
		line := scanner.Text()

		if strings.HasPrefix(line, "#") {
			// Tacview timestamps start with #
			currentTimestamp, err = strconv.ParseFloat(line[1:], 64)
			if err != nil {
				return fmt.Errorf("failed to parse timestamp: %w", err)
			}

		} else if currentPlaneId == "" {
			// We search for a new aircraft to spawn under the author's name
			// TODO: does this work for detecting a pilot entering an already spawned aircraft?
			matches := reLineMatch.FindStringSubmatch(line)
			if len(matches) > 0 {
				currentPlaneId = matches[1]
				currentPlaneName = rePlaneName.FindStringSubmatch(line)[1]
				currentPlaneSpawnedAt = currentTimestamp
			}

		} else if strings.HasPrefix(line, "-"+currentPlaneId) {
			// Aircrafts that get despawned are prefixed with a -
			timeAlive := currentTimestamp - currentPlaneSpawnedAt
			actual, _ := r.planeSeconds.LoadOrStore(currentPlaneName, 0.0)
			r.planeSeconds.Store(currentPlaneName, actual.(float64)+timeAlive)
			currentPlaneId = ""
		}
	}

	// To account for any aircrafts that are not despawned at the end of the file
	if currentPlaneId != "" {
		timeAlive := currentTimestamp - currentPlaneSpawnedAt
		actual, _ := r.planeSeconds.LoadOrStore(currentPlaneName, 0.0)
		r.planeSeconds.Store(currentPlaneName, actual.(float64)+timeAlive)
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

func (r *TacviewReader) GetPlaneSeconds() map[string]float64 {
	planeSeconds := make(map[string]float64)
	r.planeSeconds.Range(func(key, value interface{}) bool {
		planeSeconds[key.(string)] = value.(float64)
		return true
	})
	return planeSeconds
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
