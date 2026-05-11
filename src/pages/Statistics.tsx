import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { BarChart3, Trophy } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import UserAvatar from '../components/UserAvatar';

type Period = 'week' | 'month' | 'year';

export default function Statistics() {
  const { moments, users } = useData();
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();

  const { range, label } = useMemo(() => {
    switch (period) {
      case 'week':
        return {
          range: { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) },
          label: `Week ${format(now, 'w', { locale: nl })} — ${format(startOfWeek(now, { weekStartsOn: 1 }), 'd MMM', { locale: nl })} t/m ${format(endOfWeek(now, { weekStartsOn: 1 }), 'd MMM', { locale: nl })}`,
        };
      case 'month':
        return {
          range: { start: startOfMonth(now), end: endOfMonth(now) },
          label: format(now, 'MMMM yyyy', { locale: nl }),
        };
      case 'year':
        return {
          range: { start: startOfYear(now), end: endOfYear(now) },
          label: format(now, 'yyyy'),
        };
    }
  }, [period]);

  const EXCLUDED_NAMES = ['Robin', 'Bart', 'Anny'];

  const stats = useMemo(() => {
    const filtered = moments.filter((m) => {
      if (!m.assignedUserId) return false;
      const d = parseISO(m.date);
      return isWithinInterval(d, range);
    });

    const countMap = new Map<string, number>();
    for (const m of filtered) {
      countMap.set(m.assignedUserId!, (countMap.get(m.assignedUserId!) || 0) + 1);
    }

    const result = users
      .filter((u) => !EXCLUDED_NAMES.includes(u.name))
      .map((u) => ({ user: u, count: countMap.get(u.id) || 0 }))
      .sort((a, b) => b.count - a.count);

    return result;
  }, [moments, users, range]);

  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const totalWalks = stats.reduce((sum, s) => sum + s.count, 0);
  const topWalker = stats.find((s) => s.count > 0);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-bold text-gray-800">Statistieken</h2>
      </div>

      {/* Period toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {([['week', 'Week'], ['month', 'Maand'], ['year', 'Jaar']] as const).map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Period label */}
      <p className="text-sm text-gray-500 mb-4 text-center capitalize">{label}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-primary-600">{totalWalks}</p>
          <p className="text-xs text-gray-500 mt-1">Totaal uitlaten</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <p className="text-lg font-bold text-gray-800">{topWalker?.user.name || '—'}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">Meeste uitlaten</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Ranglijst</h3>
        <div className="space-y-3">
          {stats.map((s, i) => (
            <div key={s.user.id} className="flex items-center gap-3">
              {/* Rank */}
              <div className="w-8 text-center">
                {s.count > 0 && i < 3 ? (
                  <span className="text-lg">{medals[i]}</span>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <UserAvatar userId={s.user.id} name={s.user.name} size="md" />

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-medium truncate ${s.count > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                    {s.user.name}
                  </p>
                  <p className={`text-sm font-bold ml-2 ${s.count > 0 ? 'text-primary-600' : 'text-gray-300'}`}>
                    {s.count}×
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === 0 && s.count > 0
                        ? 'bg-yellow-400'
                        : i === 1 && s.count > 0
                        ? 'bg-gray-400'
                        : i === 2 && s.count > 0
                        ? 'bg-orange-400'
                        : 'bg-primary-400'
                    }`}
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalWalks === 0 && (
          <p className="text-center text-gray-400 text-sm mt-4">
            Nog geen uitlaatmomenten in deze periode
          </p>
        )}
      </div>
    </div>
  );
}
