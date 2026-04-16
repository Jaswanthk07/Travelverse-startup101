import { useEffect, useState } from "react";
import {
  fetchDiscoverableUsers,
  fetchFriendActivity,
  followUser,
} from "../lib/api";

const fallbackActivity = [
  {
    id: "local-1",
    actorName: "Koushik",
    actorAvatar: "https://api.dicebear.com/8.x/initials/svg?seed=Koushik",
    action: "visited",
    landmarkName: "Charminar",
    image: "/images/charminar.svg",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "local-2",
    actorName: "Saikiran",
    actorAvatar: "https://api.dicebear.com/8.x/initials/svg?seed=Saikiran",
    action: "saved",
    landmarkName: "Qutub Minar",
    image: "/images/qutub-minar.svg",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

function timeAgo(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  return `${Math.round(minutes / 60)} hr ago`;
}

function FriendActivityFeed({ userEmail }) {
  const [activity, setActivity] = useState(fallbackActivity);
  const [people, setPeople] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    fetchFriendActivity(userEmail)
      .then((response) => setActivity(response.length ? response : fallbackActivity))
      .catch((error) => console.warn("Friend activity unavailable:", error.message));

    fetchDiscoverableUsers()
      .then(setPeople)
      .catch((error) => console.warn("Friend discovery unavailable:", error.message));
  }, [userEmail]);

  const handleFollow = async (person) => {
    setFollowing((current) => ({ ...current, [person.id]: true }));

    try {
      await followUser(person.id);
    } catch (error) {
      console.warn("Follow request failed:", error.message);
    }
  };

  return (
    <section className="glass-panel rounded-lg p-6 shadow-soft">
      <p className="text-sm uppercase tracking-[0.25em] text-amber-100/80">
        Friend Activity
      </p>
      <h2 className="mt-3 font-display text-2xl font-semibold text-white">
        Recently around you
      </h2>

      {people.length ? (
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {people.slice(0, 4).map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => handleFollow(person)}
              className="flex min-w-[11rem] items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left"
            >
              <img
                src={person.avatarUrl}
                alt={person.name}
                className="h-10 w-10 rounded-full bg-white/10"
                loading="lazy"
              />
              <span>
                <span className="block text-sm font-semibold text-white">{person.name}</span>
                <span className="text-xs text-slate-400">
                  {following[person.id] ? "Following" : "Follow"}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {activity.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.landmarkName}
                loading="lazy"
                className="h-24 w-full object-cover"
              />
            ) : null}
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex gap-3">
                <img
                  src={item.actorAvatar}
                  alt={item.actorName ?? item.name}
                  className="h-11 w-11 rounded-full bg-white/10"
                  loading="lazy"
                />
                <div>
                  <p className="font-semibold text-white">
                    {item.actorName ?? item.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {item.action} {item.landmarkName}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {timeAgo(item.createdAt)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FriendActivityFeed;
