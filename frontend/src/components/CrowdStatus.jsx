import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { fetchCrowdStatus, SOCKET_URL } from "../lib/api";
import CrowdRing from "./CrowdRing";

const fallbackCrowd = {
  level: "Moderate",
  percentage: 54,
  bestSlot: "Next 2 hours",
  source: "Offline estimate",
  refreshesAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

function formatRefreshTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "soon";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function CrowdStatus({ landmarkId, compact = false }) {
  const [crowd, setCrowd] = useState(fallbackCrowd);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    const loadCrowd = async () => {
      try {
        const response = await fetchCrowdStatus(landmarkId);

        if (isMounted) {
          setCrowd(response);
        }
      } catch (error) {
        console.warn("Crowd status unavailable:", error.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCrowd();
    socket.emit("crowd:watch", landmarkId);
    socket.on("crowd:update", (update) => {
      if (update.landmarkId === landmarkId) {
        setCrowd(update);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      socket.emit("crowd:unwatch", landmarkId);
      socket.disconnect();
    };
  }, [landmarkId]);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
        <CrowdRing crowd={crowd} size="sm" />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">
            Live Crowd
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {isLoading ? "Refreshing..." : `${crowd.level} now`}
          </p>
          <p className="mt-1 text-xs text-slate-400">{crowd.bestSlot}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-100/80">
            Live Crowd
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            {isLoading ? "Refreshing crowd level" : `${crowd.level} crowd now`}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Best time to visit: {crowd.bestSlot}
          </p>
        </div>
        <CrowdRing crowd={crowd} />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <p>Refreshes at {formatRefreshTime(crowd.refreshesAt)}</p>
        <p>{crowd.source}</p>
      </div>
    </section>
  );
}

export default CrowdStatus;
