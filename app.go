package main

import (
	"DCSFlightTracker/internal/reader"
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx            context.Context
	readers        []reader.Reader
	selectedReader int
	logger         logger.Logger
}

// NewApp creates a new App application struct
func NewApp(readers []reader.Reader) *App {
	return &App{
		readers:        readers,
		selectedReader: 0,
		logger:         logger.NewDefaultLogger(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type SelectedFiles struct {
	// Full path of every selected file
	Files []string
	// Index of the reader type to use. In most cases we expect 0=Tacview.
	ReaderIndex int
	Error       string
}

func (a *App) OpenDirectoryBrowser(readerIndex int) SelectedFiles {
	homeDir, _ := os.UserHomeDir()
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{Title: "Select your Tacview directory", DefaultDirectory: filepath.Join(homeDir, "Documents", "Tacview")})
	if err != nil {
		dir, _ = runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{Title: "Select your Tacview directory"})
	}

	reader := a.readers[readerIndex]
	files, err := reader.ValidFiles(dir)
	if err != nil {
		a.logger.Error(fmt.Sprint("Failed to open directory: ", err.Error()))
		return SelectedFiles{Error: "Failed to open directory"}
	}

	for i, file := range files {
		files[i] = filepath.Join(dir, file)
	}

	return SelectedFiles{Files: files, ReaderIndex: readerIndex}
}

var readerStats = make(map[int]reader.TimesResult)

func (a *App) StartAnalysing(readerIndex int, files []string) {
	result, _ := reader.ReadTimes(a.readers[readerIndex], files)
	readerStats[readerIndex] = result
}

func (a *App) ReadAnalysis(readerIndex int) reader.TimesResult {
	result, exists := readerStats[readerIndex]
	if !exists {
		return reader.TimesResult{}
	}
	return result
}

func (a *App) GetProgress(readerIndex int) reader.Progress {
	return reader.GetProgress(a.readers[readerIndex])
}
