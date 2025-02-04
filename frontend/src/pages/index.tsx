import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  OpenDirectoryBrowser,
  StartAnalysing,
} from "../../wailsjs/go/main/App";
import { Layout } from "../components/layout";
import "../cs16.css";
import { longestCommonPrefix } from "../util/prefix";
import { twMerge } from "tailwind-merge";

enum ReaderTypes {
  Tacview = 0,
}

export default function IndexPage() {
  // What reader to use
  const [readerIndex, setReaderIndex] = useState(ReaderTypes.Tacview);
  const [files, setFiles] = useState<string[]>([]);
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [dragStart, setDragStart] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [dirSelected, setDirSelected] = useState(false);

  const handleDirectorySelect = async () => {
    const dirInfo = await OpenDirectoryBrowser(readerIndex);
    if (dirInfo.Error) {
      setError(dirInfo.Error);
    } else if (!dirInfo.Files) {
      setFiles([]);
    } else {
      setFiles(dirInfo.Files);
    }
  };

  const onAnalyze = async (files: string[]) => {
    StartAnalysing(readerIndex, files);
    navigate(`/analyzing/${readerIndex}`);
  };

  const shortenedFiles = useMemo(() => {
    const common = longestCommonPrefix(files);
    return files.map(file => ({
      long: file,
      short: file.slice(common.length),
    }));
  }, [files]);

  return (
    <Layout>
      <div className="cs-border p-3 flex flex-col gap-1 h-[calc(100%-3rem)]">
        <p>Files</p>
        <div
          className={twMerge(
            "inner flex flex-col text-xs overflow-y-auto whitespace-nowrap h-full",
            shortenedFiles.length === 0 && "items-center justify-center",
          )}
        >
          {shortenedFiles.length === 0 && error && <p>Error: {error}</p>}
          {shortenedFiles.length === 0 && !error && dirSelected && (
            <p>No valid files found</p>
          )}
          {shortenedFiles.length === 0 && !error && !dirSelected && (
            <p>Select your tacview directory</p>
          )}

          {shortenedFiles.map((file, index) => (
            <p
              key={file.long}
              className={twMerge(
                "select-none",
                selectedFiles.includes(file.long) && "selected",
              )}
              onClick={() => {
                if (selectedFiles.includes(file.long)) {
                  setSelectedFiles(selectedFiles.filter(f => f !== file.long));
                } else {
                  setSelectedFiles(old => [...old, file.long]);
                }
              }}
              onMouseDown={() => setDragStart(index)}
              onMouseUp={() => {
                if (dragStart === -1) return;
                const from = Math.min(dragStart, index);
                const to = Math.max(dragStart, index);
                if (from === to) return;
                const toChange = shortenedFiles
                  .slice(from, to + 1)
                  .map(f => f.long);
                if (selectedFiles.includes(shortenedFiles[index].long)) {
                  setSelectedFiles(
                    selectedFiles.filter(f => !toChange.includes(f)),
                  );
                } else {
                  setSelectedFiles(old => [...old, ...toChange]);
                }
              }}
            >
              {file.short}
            </p>
          ))}
        </div>
      </div>
      <div className="pt-3 flex justify-between">
        <button
          className="cursor-pointer cs-btn"
          onClick={handleDirectorySelect}
        >
          Select directory
        </button>

        <button
          className="cursor-pointer cs-btn"
          onClick={() => onAnalyze(files)}
          disabled={!files || files.length === 0}
        >
          Analyze
        </button>
      </div>
    </Layout>
  );
}
