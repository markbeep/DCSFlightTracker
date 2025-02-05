import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReadAnalysis } from "../../wailsjs/go/main/App";
import { reader } from "../../wailsjs/go/models";
import { Layout } from "../components/layout";
import { detailedTime, secondsDisplay } from "../util/time";

export default function StatsPage() {
  const { readerIndex } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<reader.TimesResult | null>(null);
  const [selectedAircraft, setSelectedAircraft] =
    useState<reader.Aircraft | null>(null);
  const [combinedSeconds, setCombinedSeconds] = useState(0);

  useEffect(() => {
    if (!readerIndex) {
      return;
    }
    ReadAnalysis(parseInt(readerIndex)).then(res => {
      const combinedSeconds = res.Aircrafts.reduce(
        (old, ac) => old + ac.TotalSeconds,
        0,
      );
      setResults(res);
      setCombinedSeconds(combinedSeconds);
    });
  }, [readerIndex]);

  return (
    <Layout className="pb-3">
      <div className="cs-border p-2 flex flex-col h-[calc(100%-4rem)] grow gap-1">
        <label className="cs-select__label" htmlFor="aircraft">
          Aircraft
        </label>
        <select
          className="cs-select"
          name="aircraft"
          id="aircraft"
          onChange={e =>
            setSelectedAircraft(
              results?.Aircrafts.find(ac => ac.Name === e.target.value) || null,
            )
          }
        >
          <option value="Total" onClick={() => setSelectedAircraft(null)}>
            Overview ({secondsDisplay(combinedSeconds)})
          </option>
          {results?.Aircrafts.map(ac => (
            <option key={ac.Name} value={ac.Name}>
              {ac.Name} ({secondsDisplay(ac.TotalSeconds)})
            </option>
          ))}
        </select>

        <div className="inner text-xs h-full overflow-y-auto">
          <div className="grid grid-cols-2 gap-0.5 gap-x-2 whitespace-nowrap">
            {selectedAircraft === null ? (
              results?.Aircrafts.map(ac => (
                <>
                  <p>{ac.Name}</p>
                  <p>{detailedTime(ac.TotalSeconds)}</p>
                </>
              ))
            ) : (
              <>
                <p>Total flight time</p>
                <p>{detailedTime(selectedAircraft.TotalSeconds)}</p>

                <p className="pl-2">Moving</p>
                <p>
                  {detailedTime(
                    selectedAircraft.TotalSeconds -
                      selectedAircraft.GroundSeconds,
                  )}
                </p>

                <p className="pl-2">Stationary</p>
                <p>{detailedTime(selectedAircraft.GroundSeconds)}</p>

                <p>Flights</p>
                <p>{selectedAircraft.Flights}</p>

                <p className="pl-2">Landed</p>
                <p>Unk</p>

                <p className="pl-2">Destroyed</p>
                <p>Unk</p>

                <p className="pl-2">Other</p>
                <p>Unk</p>

                <p className="mt-2">Most frequent missions</p>
                <p />
                {selectedAircraft.Missions.map(mission => (
                  <>
                    <p className="truncate pl-2">
                      {mission.Name || "<Unknown>"}
                    </p>
                    <p>{detailedTime(mission.Seconds)}</p>
                  </>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button className="cursor-pointer cs-btn" onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    </Layout>
  );
}
