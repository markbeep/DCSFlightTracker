import { twMerge } from "tailwind-merge";
import { GetProgress } from "../../wailsjs/go/main/App";
import { reader } from "../../wailsjs/go/models";
import { Layout } from "../components/layout";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function AnalyzingPage() {
  const [progress, setProgress] = useState<reader.Progress | null>();
  const navigate = useNavigate();
  const { readerIndex } = useParams();

  useEffect(() => {
    if (!readerIndex) return;
    const index = parseInt(readerIndex);

    const interval = setInterval(async () => {
      const prog = await GetProgress(index);
      if (prog.Total === 0) return;

      setProgress(prog);
      if (prog.Successful + prog.Failed >= prog.Total) {
        navigate(`/stats/${index}`);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [readerIndex]);

  return (
    <Layout className="pb-3">
      <div className="cs-border p-2 flex flex-col grow gap-1 items-center justify-center">
        <div>Analyzing files</div>
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
        <div className="flex flex-col text-xs">
          {progress ? (
            <p>
              {progress.Successful + progress.Failed} / {progress.Total} files
            </p>
          ) : (
            <p>0 / 0 files</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
