package main

import (
	"DCSFlightTracker/internal/reader"
	"context"
	"fmt"

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

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type SelectedDirectory struct {
	DirPath     string
	Files       []string
	ReaderIndex int
	Error       string
}

func (a *App) OpenFileBrowser(readerIndex int) SelectedDirectory {
	dir, _ := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{Title: "Select your Tacview directory"})
	reader := a.readers[readerIndex]
	files, err := reader.ValidFiles(dir)
	if err != nil {
		a.logger.Error(fmt.Sprint("Failed to open directory: ", err.Error()))
		return SelectedDirectory{Error: "Failed to open directory"}
	}

	return SelectedDirectory{DirPath: dir, Files: files, ReaderIndex: readerIndex}
}

func (a *App) ReadTacviewTimes(readerIndex int, files []string) reader.TimesResult {
	result, _ := reader.ReadTimes(a.readers[readerIndex], files)
	return result
}

func (a *App) GetProgress() reader.Progress {
	return reader.GetProgress()
}
