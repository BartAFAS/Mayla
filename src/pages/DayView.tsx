import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function DayView() {
  const { date } = useParams<{ date: string }>();
  const { moments, users } = useData();
  const navigate = useNavigate();

  if (!date) return null;

  const dayMoments = moments
    .filter((m) => m.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));

  const getUserName = (id: string | null) => {
    if (!id) return null;
    return users.find((u) => u.id === id)?.name || 'Onbekend';
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      <h2 className="text-xl font-bold text-gray-800 mb-4 capitalize">
        {format(parseISO(date), 'EEEE d MMMM yyyy', { locale: nl })}
      </h2>

      {dayMoments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Geen momenten op deze dag</p>
      ) : (
        <div className="space-y-2">
          {dayMoments.map((moment) => {
            const isOpen = !moment.assignedUserId;
            return (
              <button
                key={moment.id}
                onClick={() => navigate(`/moment/${moment.id}`)}
                className="w-full bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className={`w-2 h-10 rounded-full ${isOpen ? 'bg-orange-400' : 'bg-green-400'}`} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{moment.time}u</p>
                  {moment.assignedUserId ? (
                    <p className="text-sm text-green-600">✅ {getUserName(moment.assignedUserId)}</p>
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
    </div>
  );
}
