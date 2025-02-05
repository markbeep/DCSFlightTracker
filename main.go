package main

import (
	"DCSFlightTracker/internal/reader"
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	tacviewReader := reader.NewTacviewReader()

	app := NewApp([]reader.Reader{&tacviewReader})

	err := wails.Run(&options.App{
		Title:     "DCSFlightTracker",
		Frameless: true,
		MinWidth:  400,
		MinHeight: 420,
		Width:     400,
		Height:    600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0x4a, G: 0x59, B: 0x42, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
