"use client";

import { useEffect, useState } from "react";

interface Badge {
  id: number;
  badgeKey: string;
  name: string;
  description: string;
  earnedAt: string | null;
}

const BADGE_ICONS: Record<string, string> = {
  first_step: "👣",
  easy_master: "🌟",
  medium_master: "⭐",
  hard_master: "💫",
  expert_master: "🌠",
  combo_10: "🔥",
  combo_50: "🔥",
  daily_complete: "📅",
  weekly_streak: "📆",
  golden_star: "🏅",
  space_doctor: "🎓",
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/badges")
      .then((r) => r.json())
      .then((data) => {
        setBadges(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-float">⭐</div>
      </div>
    );
  }

  const earned = badges.filter((b) => b.earnedAt);
  const locked = badges.filter((b) => !b.earnedAt);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">🏆 뱃지 컬렉션</h1>
        <p className="text-slate-400 mt-1">
          {earned.length} / {badges.length} 획득
        </p>
      </div>

      {earned.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-amber-400 mb-3">획득한 뱃지</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {earned.map((badge) => (
              <div
                key={badge.id}
                className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-500/50 rounded-xl p-4 text-center animate-slide-up"
              >
                <span className="text-4xl">{BADGE_ICONS[badge.badgeKey] || "🏆"}</span>
                <p className="text-white font-bold mt-2 text-sm">{badge.name}</p>
                <p className="text-slate-400 text-xs mt-1">{badge.description}</p>
                <p className="text-amber-400/60 text-xs mt-2">
                  {new Date(badge.earnedAt!).toLocaleDateString("ko-KR")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-500 mb-3">미획득 뱃지</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {locked.map((badge) => (
            <div
              key={badge.id}
              className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center opacity-50"
            >
              <span className="text-4xl grayscale">🔒</span>
              <p className="text-slate-400 font-bold mt-2 text-sm">{badge.name}</p>
              <p className="text-slate-500 text-xs mt-1">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
