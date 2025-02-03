import { useEffect, useRef, useState } from "react";
import {
  OpenFileBrowser,
  ReadTacviewTimes,
  GetProgress,
} from "../wailsjs/go/main/App";
import { reader } from "../wailsjs/go/models";
import { Quit } from "../wailsjs/runtime";
import "./cs16.css";
import { twMerge } from "tailwind-merge";

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
  const ref = useRef<HTMLDivElement>(null);
  // What reader to use
  const [readerIndex, setReaderIndex] = useState(ReaderTypes.Tacview);
  const [files, setFiles] = useState<string[]>([]);
  const [directory, setDirectory] = useState<string>("");
  const [results, setResults] = useState<reader.Aircraft[]>([]);
  const [failures, setFailures] = useState<string[]>([]);
  const [progress, setProgress] = useState<reader.Progress | null>();
  const [inProgress, setInProgress] = useState(false);

  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute("style", "--wails-draggable:drag");
    }
  }, [ref]);

  const handleFileSelect = async () => {
    const dirInfo = await OpenFileBrowser(readerIndex);
    setProgress(null);
    setResults([]);
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
    setInProgress(true);
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

    const results = await timesPromise;
    setResults(results.Aircrafts);
    setFailures(results.Fails);
    setInProgress(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div ref={ref} className="mb-1 w-full justify-center flex cursor-default">
        <p className="select-none">DCSFlightTracker</p>
        <button
          className="cursor-pointer cs-btn aspect-square absolute top-0 right-0"
          onClick={() => Quit()}
        >
          x
        </button>
      </div>

      <div className="p-1 flex flex-col grow">
        <div className="flex gap-1">
          <button className="cursor-pointer cs-btn" onClick={handleFileSelect}>
            Select directory
          </button>

          <button
            className="cursor-pointer cs-btn"
            onClick={() => onAnalyze(files)}
            disabled={inProgress || !files || files.length === 0}
          >
            Analyze
          </button>
        </div>

        <div
          className={twMerge(
            "flex gap-2 justify-start items-center",
            !progress && "invisible",
          )}
        >
          <div className="cs-progress-bar">
            {progress && (
              <div
                className="bars"
                style={{
                  width: `${
                    (100 * (progress.Successful + progress.Failed)) /
                    progress.Total
                  }%`,
                }}
              />
            )}
          </div>
          <div className="flex gap-0 flex-col text-xs">
            <p>
              {(progress?.Successful ?? 0) + (progress?.Failed ?? 0)} /{" "}
              {progress?.Total ?? 1} files
            </p>
            <p
              className="cursor-pointer"
              onClick={() =>
                (document.querySelector(".cs-dialog") as any).showModal()
              }
            >
              {progress?.Failed} failures
            </p>

            <dialog className="cs-dialog">
              <form method="dialog">
                <div className="heading">
                  <div className="wrapper">
                    <div className="icon"></div>
                    <p className="text">File failures</p>
                  </div>
                  <button className="cs-btn close"></button>
                </div>
                <div className="content text-base whitespace-nowrap overflow-x-auto max-w-[20rem]">
                  {failures.map(x => (
                    <p>{x}</p>
                  ))}
                </div>
                <menu className="footer-btns">
                  <button className="cs-btn">OK</button>
                </menu>
              </form>
            </dialog>
          </div>
        </div>

        <div className="inner flex flex-col text-xs h-[20rem] overflow-y-scroll">
          {results.map((aircraft, index) => (
            <p className={index < 9 ? "pl-2" : ""}>
              {index + 1}: {aircraft.Name} {secondsDisplay(aircraft.Seconds)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
