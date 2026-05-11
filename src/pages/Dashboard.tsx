import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isBefore, startOfDay, parseISO, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Dog, CalendarDays, Clock, User, ChevronRight, Palmtree } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { onVacationsSnapshot } from '../services/storage';
import type { VacationMoment } from '../types';
import { useState, useEffect } from 'react';
import UserAvatar from '../components/UserAvatar';

export default function Dashboard() {
  const { user } = useAuth();
  const { moments, users } = useData();
  const navigate = useNavigate();
  const [vacations, setVacations] = useState<VacationMoment[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | 'open'>('all');

  useEffect(() => {
    const unsubscribe = onVacationsSnapshot((v) => setVacations(v));
    return unsubscribe;
  }, []);

  const today = startOfDay(new Date());
  const todayStr = format(today, 'yyyy-MM-dd');
  const upcoming = moments
    .filter((m) => !isBefore(parseISO(m.date), today))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const upcomingVacations = vacations
    .filter((v) => v.endDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const openMoments = upcoming.filter((m) => !m.assignedUserId);
  const filledMoments = upcoming.filter((m) => m.assignedUserId);

  const filteredMoments = upcoming.filter((m) => {
    if (filter === 'mine') return m.assignedUserId === user?.id;
    if (filter === 'open') return !m.assignedUserId;
    return true;
  });

  const filteredVacations = upcomingVacations.filter((v) => {
    if (filter === 'mine') return v.assignedUserIds.includes(user?.id || '');
    if (filter === 'open') return v.assignedUserIds.length === 0;
    return true;
  });

  const formatDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Vandaag';
    if (isTomorrow(d)) return 'Morgen';
    return format(d, 'EEEE d MMMM', { locale: nl });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Goedenacht';
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {getGreeting()} {user?.name}! <Dog className="w-6 h-6 inline-block -mt-1" />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: nl })}
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">Open</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{openMoments.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-600">Ingevuld</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{filledMoments.length}</p>
        </div>
      </div>

      {/* Upcoming moments */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Aankomende momenten</h3>
        <button
          onClick={() => navigate('/kalender')}
          className="text-sm text-primary-600 font-medium flex items-center gap-1"
        >
          <CalendarDays className="w-4 h-4" />
          Kalender
        </button>
      </div>

      {/* Filter */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
        {([['all', 'Alles'], ['mine', 'Mijn'], ['open', 'Open']] as const).map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {filteredMoments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Dog className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{filter === 'mine' ? 'Geen eigen momenten' : filter === 'open' ? 'Geen open momenten' : 'Geen aankomende momenten'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMoments.slice(0, 10).map((moment) => {
            const isOpen = !moment.assignedUserId;
            const assignedUser = moment.assignedUserId ? users.find((u) => u.id === moment.assignedUserId) : null;
            return (
              <button
                key={moment.id}
                onClick={() => navigate(`/moment/${moment.id}`)}
                className="w-full bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div
                  className={`w-2 h-10 rounded-full ${isOpen ? 'bg-orange-400' : 'bg-green-400'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-400 capitalize">
                    {formatDateLabel(moment.date)}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {moment.time}u
                  </p>
                  {assignedUser ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <UserAvatar userId={assignedUser.id} name={assignedUser.name} size="sm" />
                      <p className="text-sm text-green-600 truncate">{assignedUser.name}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-orange-500">⏳ Open</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            );
          })}
        </div>
      )}

      {/* Upcoming vacations */}
      {filteredVacations.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3 mt-6">
            <h3 className="font-semibold text-gray-800">Vakantiemomenten</h3>
            <button
              onClick={() => navigate('/vakantie')}
              className="text-sm text-primary-600 font-medium flex items-center gap-1"
            >
              <Palmtree className="w-4 h-4" />
              Overzicht
            </button>
          </div>
          <div className="space-y-2">
            {filteredVacations.slice(0, 5).map((vacation) => {
              const isOpen = vacation.assignedUserIds.length === 0;
              const start = parseISO(vacation.startDate);
              const end = parseISO(vacation.endDate);
              const days = differenceInDays(end, start) + 1;
              const assignedUsersList = vacation.assignedUserIds
                .map((id) => users.find((u) => u.id === id))
                .filter(Boolean);
              return (
                <button
                  key={vacation.id}
                  onClick={() => navigate('/vakantie')}
                  className="w-full bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <div
                    className={`w-2 h-10 rounded-full ${isOpen ? 'bg-orange-400' : 'bg-blue-400'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-400">
                      {format(start, 'd MMM', { locale: nl })} – {format(end, 'd MMM yyyy', { locale: nl })} ({days} {days === 1 ? 'dag' : 'dagen'})
                    </p>
                    <p className="font-semibold text-gray-800 truncate">
                      {vacation.notes || 'Vakantie'}
                    </p>
                    {assignedUsersList.length > 0 ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex -space-x-1.5">
                          {assignedUsersList.slice(0, 3).map((u) => (
                            <UserAvatar key={u!.id} userId={u!.id} name={u!.name} size="sm" className="ring-1 ring-white" />
                          ))}
                        </div>
                        <p className="text-sm text-blue-600 truncate">
                          {assignedUsersList.map((u) => u!.name).join(', ')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-orange-500">⏳ Open</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
