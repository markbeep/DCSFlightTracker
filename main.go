package main

import (
	"DCSFlightTracker/internal/reader"
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	// "github.com/wailsapp/wails/v2"
	// "github.com/wailsapp/wails/v2/pkg/options"
	// "github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	tacviewReader := reader.NewTacviewReader()

	// reader.ReadTimes("data", &tacviewReader)
	// flightTimes, err := reader.ReadTimes("data", &tacviewReader)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// for _, plane := range flightTimes {
	// 	fmt.Println(plane)
	// }

	// // Create an instance of the app structure
	app := NewApp([]reader.Reader{&tacviewReader})

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "DCSFlightTracker",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
