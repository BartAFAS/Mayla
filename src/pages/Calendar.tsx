import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { onVacationsSnapshot } from '../services/storage';
import type { VacationMoment } from '../types';

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { moments } = useData();
  const navigate = useNavigate();
  const [vacations, setVacations] = useState<VacationMoment[]>([]);

  useEffect(() => {
    const unsubscribe = onVacationsSnapshot((v) => setVacations(v));
    return unsubscribe;
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getMomentsForDay = (date: Date) =>
    moments.filter((m) => isSameDay(parseISO(m.date), date));

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: nl })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayMoments = getMomentsForDay(day);
          const hasOpen = dayMoments.some((m) => !m.assignedUserId);
          const hasFilled = dayMoments.some((m) => m.assignedUserId);
          const hasVacation = vacations.some((v) =>
            isWithinInterval(day, { start: parseISO(v.startDate), end: parseISO(v.endDate) })
          );
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <button
              key={idx}
              onClick={() => {
                if (dayMoments.length === 1) {
                  navigate(`/moment/${dayMoments[0].id}`);
                } else if (dayMoments.length > 1) {
                  navigate(`/dag/${format(day, 'yyyy-MM-dd')}`);
                }
              }}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-colors ${
                !inMonth ? 'text-gray-300' : today ? 'bg-primary-100 text-primary-700 font-bold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{format(day, 'd')}</span>
              {(dayMoments.length > 0 || hasVacation) && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasOpen && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  {hasFilled && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                  {hasVacation && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          Open
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          Ingevuld
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Vakantie
        </div>
      </div>
    </div>
  );
}
