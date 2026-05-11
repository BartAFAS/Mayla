import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import DatePicker from '../components/DatePicker';

type RepeatMode = 'none' | 'weekly';

export default function MomentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { moments, createMoment, updateMoment } = useData();
  const { showToast } = useToast();

  const existing = id ? moments.find((m) => m.id === id) : null;
  const isEdit = !!existing;

  const [date, setDate] = useState(existing?.date || '');
  const [time, setTime] = useState(existing?.time || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Generate time options: 00:00, 00:30, 01:00, ..., 23:30
  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  const getRepeatDates = (): string[] => {
    if (repeatMode === 'none' || !date || !repeatEndDate) return [date];
    const dates: string[] = [];
    let current = new Date(date);
    const end = new Date(repeatEndDate);
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 7);
    }
    return dates.length > 0 ? dates : [date];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);

    if (isEdit && existing) {
      await updateMoment(existing.id, { date, time, notes });
      showToast('Moment bijgewerkt');
    } else {
      const dates = getRepeatDates();
      for (const d of dates) {
        await createMoment({
          date: d,
          time,
          notes,
          assignedUserId: null,
          createdBy: user.id,
        });
      }
      showToast(dates.length > 1 ? `${dates.length} momenten aangemaakt` : 'Moment aangemaakt');
    }
    setSubmitting(false);
    navigate(-1);
  };

  const repeatDatesCount = repeatMode !== 'none' && date && repeatEndDate ? getRepeatDates().length : 0;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Moment bewerken' : 'Nieuw uitlaatmoment'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
          <DatePicker value={date} onChange={setDate} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tijdstip</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          >
            <option value="">Kies tijdstip</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}u</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opmerkingen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Bijv. 'lange wandeling gewenst'"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>

        {/* Herhaling (alleen bij nieuw moment) */}
        {!isEdit && (
          <div className="bg-purple-50 rounded-xl p-4 space-y-3">
            <label className="block text-sm font-medium text-purple-700">Herhaling</label>
            <div className="flex flex-wrap gap-2">
              {([['none', 'Eenmalig'], ['weekly', 'Wekelijks']] as const).map(([key, lbl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRepeatMode(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    repeatMode === key
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            {repeatMode !== 'none' && (
              <div>
                <label className="block text-xs text-purple-600 mb-1">Herhalen tot en met</label>
                <DatePicker value={repeatEndDate} onChange={setRepeatEndDate} min={date} placeholder="Kies einddatum" />
                {repeatDatesCount > 0 && (
                  <p className="text-xs text-purple-600 mt-2">
                    → {repeatDatesCount} uitlaatmoment{repeatDatesCount !== 1 ? 'en' : ''} worden aangemaakt
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors mt-2 disabled:opacity-50"
        >
          {submitting ? 'Bezig...' : isEdit ? 'Opslaan' : repeatDatesCount > 1 ? `${repeatDatesCount} momenten aanmaken` : 'Moment aanmaken'}
        </button>
      </form>
    </div>
  );
}
