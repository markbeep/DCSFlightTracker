import { useEffect, useRef, useState } from "react";
import {
  OpenFileBrowser,
  ReadTacviewTimes,
  GetProgress,
} from "../wailsjs/go/main/App";
import { reader } from "../wailsjs/go/models";
import "./cs16.css";

enum ReaderTypes {
  Tacview = 0,
}

function secondsDisplay(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} seconds`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(2)} minutes`;
  }
  const hours = minutes / 60;
  return `${hours.toFixed(2)} hours`;
}

function App() {
  const ref = useRef<HTMLInputElement>(null);
  // What reader to use
  const [readerIndex, setReaderIndex] = useState(ReaderTypes.Tacview);
  const [files, setFiles] = useState<string[]>([]);
  const [directory, setDirectory] = useState<string>("");
  const [results, setResults] = useState<reader.Aircraft[]>([]);
  const [progress, setProgress] = useState<reader.Progress | null>();

  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute("directory", "");
    }
  }, [ref]);

  const handleFileSelect = async () => {
    const dirInfo = await OpenFileBrowser(readerIndex);
    if (dirInfo.Error) {
    } else if (!dirInfo.Files) {
      setFiles([]);
    } else {
      setFiles(dirInfo.Files);
      setDirectory(dirInfo.DirPath);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const onAnalyze = async (files: string[]) => {
    const timesPromise = ReadTacviewTimes(
      readerIndex,
      files.map(file => directory + "\\" + file),
    );

    while (true) {
      const prog = await GetProgress();
      if (prog.Total === 0) continue;
      console.log(prog);
      setProgress(prog);
      if (prog.Successful + prog.Failed >= prog.Total) {
        break;
      }
      await sleep(200);
    }

    setResults(await timesPromise);
    setProgress(null);
  };

  return (
    <div className="h-screen w-screen text-black p-5 overflow-clip">
      {progress && (
        <div className="cs-progress-bar">
          <div
            className="bars"
            style={{
              width: `${
                (100 * (progress.Successful + progress.Failed)) / progress.Total
              }%`,
            }}
          ></div>
        </div>
      )}
      {files && files.length > 0 ? (
        <div className="flex h-full">
          <div
            className="h-full flex flex-col gap-2 justify-center cursor-pointer"
            onClick={handleFileSelect}
          >
            <p>Selected files</p>
            <div className="h-[90%] whitespace-nowrap max-w-[15rem] overflow-y-auto overflow-x-auto">
              {files.map(file => (
                <p className="text-xs">{file}</p>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center w-full">
            <button
              className="border-2 rounded-xl p-4 hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
              onClick={() => onAnalyze(files)}
            >
              Analyze
            </button>
            <div>
              {results.map((aircraft, index) => (
                <p>
                  {index + 1}: {aircraft.Name}{" "}
                  {secondsDisplay(aircraft.Seconds)}
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button className="cursor-pointer cs-btn" onClick={handleFileSelect}>
            Open dialog
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
