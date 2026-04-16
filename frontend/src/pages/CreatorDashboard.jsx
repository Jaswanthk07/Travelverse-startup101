import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import MonumentBuilder from "../components/MonumentBuilder";
import {
  SOCKET_URL,
  approveCreatorBooking,
  fetchCreatorMonuments,
  fetchCreatorPendingBookings,
  fetchCreatorStats,
} from "../lib/api";

const socket = io(SOCKET_URL, { autoConnect: true });

function CreatorDashboard() {
  const [monuments, setMonuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [liveVisitors, setLiveVisitors] = useState({});
  const [pendingBookings, setPendingBookings] = useState([]);
  const [tab, setTab] = useState("overview");
  const [isApprovingId, setIsApprovingId] = useState("");

  const fetchAll = async () => {
    const [monumentList, statBlock, pending] = await Promise.all([
      fetchCreatorMonuments(),
      fetchCreatorStats(),
      fetchCreatorPendingBookings(),
    ]);
    setMonuments(monumentList);
    setStats(statBlock);
    setActivity(statBlock.recentActivity ?? []);
    setPendingBookings(pending);
  };

  useEffect(() => {
    fetchAll().catch((error) => console.warn("Creator dashboard unavailable:", error.message));
  }, []);

  useEffect(() => {
    const handleCrowdUpdate = (crowd) => {
      setLiveVisitors((current) => ({ ...current, [crowd.landmarkId]: crowd }));
    };

    socket.on("crowd:update", handleCrowdUpdate);
    monuments.forEach((monument) => socket.emit("crowd:watch", monument.id));

    return () => {
      monuments.forEach((monument) => socket.emit("crowd:unwatch", monument.id));
      socket.off("crowd:update", handleCrowdUpdate);
    };
  }, [monuments]);

  const liveNow = useMemo(
    () =>
      Object.values(liveVisitors).reduce(
        (total, crowd) => total + Number(crowd?.percentage ?? 0),
        0
      ),
    [liveVisitors]
  );

  return (
    <main className="section-shell py-12">
      <section className="rounded-lg border border-white/10 bg-slate-900/70 p-8">
        <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your monuments, watch live visitor movement, and publish new experiences.
        </p>
      </section>

      <div className="mt-6 flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: "overview", label: "Overview" },
          { id: "monuments", label: `Monuments (${monuments.length})` },
          { id: "approvals", label: `Approvals (${pendingBookings.length})` },
          { id: "add", label: "+ Add Monument" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === item.id ? "bg-white text-slate-950" : "text-slate-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && stats ? (
        <section className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total Monuments", stats.monumentCount, "text-teal-300"],
              ["Total Views", stats.totalViews, "text-sky-300"],
              ["Confirmed Bookings", stats.totalBookings, "text-amber-300"],
              ["Live Now", `${liveNow}%`, "text-rose-300"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
                <p className={`text-3xl font-black ${color}`}>{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="mb-3 font-bold text-white">Live Visitor Tracking</h2>
            <div className="space-y-3">
              {monuments.map((monument) => {
                const crowd = liveVisitors[monument.id];
                const percentage = Number(crowd?.percentage ?? 0);
                const tone =
                  percentage < 30
                    ? "bg-emerald-400"
                    : percentage < 65
                      ? "bg-amber-400"
                      : "bg-rose-400";

                return (
                  <div
                    key={monument.id}
                    className="flex flex-col gap-3 rounded-lg border border-white/10 bg-slate-900/70 p-4 lg:flex-row lg:items-center"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-white">{monument.name}</p>
                      <p className="text-sm text-slate-400">{monument.location}</p>
                    </div>
                    <div className="w-full lg:w-56">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full ${tone}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-bold text-white">Recent Visits</h2>
            <div className="space-y-3">
              {activity.length ? (
                activity.map((item) => (
                  <div key={`${item.landmarkId}-${item.timestamp}`} className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
                    <p className="text-sm text-white">Someone viewed {item.landmarkId}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(item.timestamp).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No visitor activity yet.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "monuments" ? (
        <section className="mt-6 space-y-3">
          {monuments.length ? (
            monuments.map((monument) => {
              const crowd = liveVisitors[monument.id];
              return (
                <div key={monument.id} className="flex gap-4 rounded-lg border border-white/10 bg-slate-900/70 p-4">
                  {monument.image ? (
                    <img src={monument.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ) : null}
                  <div className="flex-1">
                    <p className="font-semibold text-white">{monument.name}</p>
                    <p className="text-sm text-slate-400">
                      {monument.location} · {monument.city}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {monument.type ?? "monument"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{crowd?.percentage ?? 0}% crowd</p>
                    <p className="text-xs text-slate-500">{crowd?.level ?? "Waiting for live data"}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-8 text-center text-slate-400">
              You have not added any monuments yet.
            </div>
          )}
        </section>
      ) : null}

      {tab === "add" ? (
        <section className="mt-6">
          <MonumentBuilder
            onSuccess={(created) => {
              setMonuments((current) => [created, ...current]);
              setTab("monuments");
              fetchAll().catch(() => {});
            }}
          />
        </section>
      ) : null}

      {tab === "approvals" ? (
        <section className="mt-6 space-y-4">
          {pendingBookings.length ? (
            pendingBookings.map((booking) => (
              <article key={booking.id} className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-display text-2xl font-semibold text-white">{booking.eventName}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {booking.landmarkName} · {booking.visitDate} · {booking.slotTime}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Traveler: {booking.userName} ({booking.userEmail})
                    </p>
                    <p className="mt-2 text-sm text-emerald-100">
                      Paid via {booking.paymentMethod ?? "demo payment"} · ₹{booking.totalAmount}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <span className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-100">
                      {booking.status}
                    </span>
                    <button
                      type="button"
                      disabled={isApprovingId === booking.id}
                      onClick={async () => {
                        setIsApprovingId(booking.id);
                        try {
                          await approveCreatorBooking(booking.id);
                          setPendingBookings((current) =>
                            current.filter((item) => item.id !== booking.id)
                          );
                        } catch (error) {
                          console.warn("Approve booking failed:", error.message);
                        } finally {
                          setIsApprovingId("");
                        }
                      }}
                      className="rounded-lg bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
                    >
                      {isApprovingId === booking.id ? "Approving..." : "Approve Booking"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-8 text-center text-slate-400">
              No paid traveler bookings are waiting for approval right now.
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

export default CreatorDashboard;
