import { useEffect, useRef, useState } from "react";
import {
  OpenFileBrowser,
  ReadTacviewTimes,
  GetProgress,
} from "../../wailsjs/go/main/App";
import { reader } from "../../wailsjs/go/models";
import { Quit, WindowMinimise } from "../../wailsjs/runtime/runtime";
import "../cs16.css";
import { twMerge } from "tailwind-merge";
import { ChevronDownIcon, MinusIcon } from "@heroicons/react/24/solid";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

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

export default function IndexPage() {
  const refDraggable = useRef<HTMLDivElement>(null);
  const refNonDraggable = useRef<HTMLDivElement>(null);
  // What reader to use
  const [readerIndex, setReaderIndex] = useState(ReaderTypes.Tacview);
  const [files, setFiles] = useState<string[]>([]);
  const [directory, setDirectory] = useState<string>("");
  const [results, setResults] = useState<reader.Aircraft[]>([]);
  const [failures, setFailures] = useState<string[]>([]);
  const [progress, setProgress] = useState<reader.Progress | null>();
  const [inProgress, setInProgress] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);

  useEffect(() => {
    if (refDraggable.current) {
      refDraggable.current.setAttribute("style", "--wails-draggable:drag");
    }
  }, [refDraggable]);

  useEffect(() => {
    if (refNonDraggable.current) {
      refNonDraggable.current.setAttribute(
        "style",
        "--wails-draggable:no-drag",
      );
    }
  }, [refNonDraggable]);

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
    setFailures(results.Failures);
    setInProgress(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden pb-2 px-3">
      <div
        ref={refDraggable}
        className="mb-1 w-full justify-start items-center gap-1 flex cursor-default pt-2"
      >
        <PaperAirplaneIcon className="size-4 text-white" />
        <p className="select-none font-bold text-white">DCSFlightTracker</p>
        <div
          ref={refNonDraggable}
          className="absolute right-2 top-2 flex justify-end gap-1"
        >
          <button
            className="cs-btn size-4.5 flex items-center justify-center cursor-pointer"
            onClick={() => WindowMinimise()}
          >
            <MinusIcon className="size-3 absolute" />
          </button>
          <button
            className="cursor-pointer cs-btn aspect-square close"
            onClick={() => Quit()}
          />
        </div>
      </div>

      <div className="cs-border p-2 flex flex-col grow gap-1">
        <div className="flex gap-1">
          <button className="cursor-pointer cs-btn" onClick={handleFileSelect}>
            {directory ? "Change" : "Select"} directory
          </button>
          <button
            className="cs-btn cursor-pointer"
            disabled={!directory}
            onClick={() => setShowDirectory(old => !old)}
          >
            <ChevronDownIcon
              className={twMerge(
                "size-3 text-white",
                showDirectory && "rotate-180",
              )}
            />
          </button>
        </div>
        {showDirectory && <p className="text-xs">{directory}</p>}

        <div className="cs-checkbox">
          <input id="checkbox" type="checkbox" />
          <label className="cs-checkbox__label" htmlFor="checkbox">
            Include ground time
          </label>
        </div>

        <div className={twMerge("flex gap-2 justify-start items-center")}>
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
            {progress ? (
              <p>
                {progress.Successful + progress?.Failed} / {progress?.Total}{" "}
                files
              </p>
            ) : (
              <p>0 files analyzed</p>
            )}
            {progress && (
              <p
                className="cursor-pointer"
                onClick={() => {
                  if (failures.length > 0)
                    (document.querySelector(".cs-dialog") as any).showModal();
                }}
              >
                {progress.Failed} failures
              </p>
            )}

            <dialog className="cs-dialog">
              <form method="dialog">
                <div className="heading">
                  <div className="wrapper">
                    <div className="icon"></div>
                    <p className="text">File failures</p>
                  </div>
                  <button className="cs-btn close cursor-pointer"></button>
                </div>
                <div className="content text-base whitespace-nowrap overflow-x-auto max-w-[20rem]">
                  {failures.map(x => (
                    <p>{x}</p>
                  ))}
                </div>
                <menu className="footer-btns">
                  <button className="cs-btn cursor-pointer">OK</button>
                </menu>
              </form>
            </dialog>
          </div>
        </div>

        <div className="inner flex flex-col text-xs h-[20rem] overflow-y-auto">
          {results.map((aircraft, index) => (
            <p className={twMerge("", index < 9 && "pl-2")}>
              {index + 1}: {aircraft.Name} {secondsDisplay(aircraft.Seconds)}
            </p>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          className="cursor-pointer cs-btn"
          onClick={() => onAnalyze(files)}
          disabled={inProgress || !files || files.length === 0}
        >
          Analyze
        </button>
      </div>
    </div>
  );
}
