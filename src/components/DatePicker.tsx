import { useState, useRef, useEffect } from 'react';
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
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, min, placeholder = 'Kies datum' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    value ? parseISO(value) : new Date()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedDate = value ? parseISO(value) : null;
  const minDate = min ? parseISO(min) : null;

  const handleSelect = (d: Date) => {
    if (minDate && d < minDate) return;
    onChange(format(d, 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-left text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value
            ? format(parseISO(value), 'd MMMM yyyy', { locale: nl })
            : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-72 left-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800 capitalize">
              {format(viewMonth, 'MMMM yyyy', { locale: nl })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d, i) => {
              const inMonth = isSameMonth(d, viewMonth);
              const today = isToday(d);
              const selected = selectedDate && isSameDay(d, selectedDate);
              const disabled = minDate && d < minDate;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !disabled && handleSelect(d)}
                  disabled={!!disabled}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-colors ${
                    selected
                      ? 'bg-primary-600 text-white font-bold'
                      : disabled
                      ? 'text-gray-200 cursor-not-allowed'
                      : !inMonth
                      ? 'text-gray-300'
                      : today
                      ? 'bg-primary-100 text-primary-700 font-bold hover:bg-primary-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {format(d, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
