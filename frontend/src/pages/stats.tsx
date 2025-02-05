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
  const [aircrafts, setAircrafts] = useState<reader.Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] =
    useState<reader.Aircraft | null>(null);
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => {
    if (!readerIndex) {
      return;
    }
    ReadAnalysis(parseInt(readerIndex)).then(res => {
      const combinedSeconds = res.Aircrafts.reduce(
        (old, ac) => old + ac.TotalSeconds,
        0,
      );
      const combined: reader.Aircraft = {
        Name: "Total",
        TotalSeconds: combinedSeconds,
        GroundSeconds: 0,
        Flights: 0,
      };
      setResults(res);
      setAircrafts([combined, ...res.Aircrafts]);
      setSelectedAircraft(combined);
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
              aircrafts.find(ac => ac.Name === e.target.value) || null,
            )
          }
        >
          {aircrafts.map(ac => (
            <option key={ac.Name} value={ac.Name}>
              {ac.Name} ({secondsDisplay(ac.TotalSeconds)})
            </option>
          ))}
        </select>

        <div className="inner text-xs h-full overflow-y-auto">
          {selectedAircraft && (
            <div className="grid grid-cols-2 gap-0.5">
              {selectedAircraft.Name === "Total" &&
                results?.Aircrafts.map(ac => (
                  <>
                    <p>{ac.Name}</p>
                    <p>{detailedTime(ac.TotalSeconds)}</p>
                  </>
                ))}

              {selectedAircraft.Name !== "Total" && (
                <>
                  <p>Total flight time</p>
                  <p>{detailedTime(selectedAircraft.TotalSeconds)}</p>

                  <p>Moving</p>
                  <p>
                    {detailedTime(
                      selectedAircraft.TotalSeconds -
                        selectedAircraft.GroundSeconds,
                    )}
                  </p>

                  <p>Stationary</p>
                  <p>{detailedTime(selectedAircraft.GroundSeconds)}</p>

                  <p>Flights</p>
                  <p>{selectedAircraft.Flights}</p>

                  <p>Landed</p>
                  <p>Unk</p>

                  <p>Destroyed</p>
                  <p>Unk</p>

                  <p>Other</p>
                  <p>Unk</p>
                </>
              )}
            </div>
          )}
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
