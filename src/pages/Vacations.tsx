import { useState, useEffect } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Palmtree, Plus, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import DatePicker from '../components/DatePicker';
import { onVacationsSnapshot, addVacation, updateVacation, deleteVacation, broadcastNotification } from '../services/storage';
import type { VacationMoment } from '../types';

export default function Vacations() {
  const { user, isAdmin } = useAuth();
  const { users } = useData();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [vacations, setVacations] = useState<VacationMoment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [assignUserId, setAssignUserId] = useState('');

  useEffect(() => {
    const unsubscribe = onVacationsSnapshot((v) => {
      setVacations(v.sort((a, b) => a.startDate.localeCompare(b.startDate)));
    });
    return unsubscribe;
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const upcoming = vacations.filter((v) => v.endDate >= today);
  const past = vacations.filter((v) => v.endDate < today);

  const handleCreate = async () => {
    if (!startDate || !endDate || !user) return;
    const created = await addVacation({
      startDate,
      endDate,
      notes,
      assignedUserIds: [],
      createdBy: user.id,
    });
    await broadcastNotification(
      { message: `Nieuw vakantiemoment: ${startDate} t/m ${endDate}. Wie kan op Mayla passen?`, type: 'new_moment', momentId: created.id },
      user.id,
    );
    showToast('Vakantiemoment aangemaakt');
    setShowForm(false);
    setStartDate('');
    setEndDate('');
    setNotes('');
  };

  const handleAssign = async (vacationId: string, userId: string) => {
    const assignedUser = users.find((u) => u.id === userId);
    if (!assignedUser) return;
    const v = vacations.find((v) => v.id === vacationId);
    if (!v) return;
    const newIds = [...v.assignedUserIds, userId];
    await updateVacation(vacationId, { assignedUserIds: newIds });
    await broadcastNotification(
      { message: `${assignedUser.name} past op Mayla van ${v.startDate} t/m ${v.endDate}`, type: 'signup', momentId: vacationId },
      userId,
    );
    showToast(`${assignedUser.name} toegewezen`);
  };

  const handleSignUp = async (vacationId: string) => {
    if (!user) return;
    const v = vacations.find((v) => v.id === vacationId);
    if (!v) return;
    const newIds = [...v.assignedUserIds, user.id];
    await updateVacation(vacationId, { assignedUserIds: newIds });
    await broadcastNotification(
      { message: `${user.name} past op Mayla van ${v.startDate} t/m ${v.endDate}`, type: 'signup', momentId: vacationId },
      user.id,
    );
    showToast('Aangemeld!');
  };

  const handleUnassign = async (vacationId: string, userId: string) => {
    const v = vacations.find((v) => v.id === vacationId);
    if (!v) return;
    const newIds = v.assignedUserIds.filter((id) => id !== userId);
    await updateVacation(vacationId, { assignedUserIds: newIds });
    showToast('Afgemeld', 'info');
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Vakantiemoment verwijderen',
      message: 'Weet je zeker dat je dit vakantiemoment wilt verwijderen?',
      confirmText: 'Verwijderen',
      danger: true,
    });
    if (ok) {
      await deleteVacation(id);
      showToast('Vakantiemoment verwijderd');
    }
  };

  const getDayCount = (start: string, end: string) =>
    differenceInDays(parseISO(end), parseISO(start)) + 1;

  const getAssignedUsers = (userIds: string[]) =>
    userIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palmtree className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-800">Vakantieopvang</h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 bg-primary-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nieuw
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
          <h3 className="font-semibold text-gray-800">Nieuw vakantiemoment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Van</label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tot en met</label>
              <DatePicker value={endDate} onChange={setEndDate} min={startDate} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opmerkingen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Bijv. 'extra wandeling nodig'"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!startDate || !endDate}
              className="flex-1 bg-primary-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              Aanmaken
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400">
          <Palmtree className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Geen aankomende vakantiemomenten</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3 mb-6">
          {upcoming.map((v) => {
            const assignedUsers = getAssignedUsers(v.assignedUserIds);
            const days = getDayCount(v.startDate, v.endDate);
            const isOpen = v.assignedUserIds.length === 0;
            const isMySignUp = v.assignedUserIds.includes(user?.id || '');
            const availableUsers = users.filter((u) => !v.assignedUserIds.includes(u.id) && !['Robin', 'Bart', 'Anny'].includes(u.name));

            return (
              <div
                key={v.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  isOpen ? 'border-orange-200' : 'border-green-200'
                }`}
              >
                <div className={`px-4 py-2 ${isOpen ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-orange-400' : 'bg-green-400'}`} />
                    <span className={`text-xs font-semibold ${isOpen ? 'text-orange-700' : 'text-green-700'}`}>
                      {isOpen ? '⏳ Open – oppas nodig!' : `✅ ${assignedUsers.map((u) => u!.name).join(', ')}`}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">
                        {format(parseISO(v.startDate), 'd MMM', { locale: nl })} – {format(parseISO(v.endDate), 'd MMM yyyy', { locale: nl })}
                      </p>
                      <p className="text-sm text-gray-500">{days} {days === 1 ? 'dag' : 'dagen'}</p>
                    </div>
                    <Palmtree className={`w-5 h-5 ${isOpen ? 'text-orange-300' : 'text-green-300'}`} />
                  </div>

                  {v.notes && (
                    <p className="text-sm text-gray-600 mb-3">{v.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    {/* Assigned users list */}
                    {assignedUsers.length > 0 && (
                      <div className="space-y-1">
                        {assignedUsers.map((u) => (
                          <div key={u!.id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-1.5">
                            <span className="text-sm text-green-700">🏖️ {u!.name}</span>
                            {(isAdmin || u!.id === user?.id) && (
                              <button
                                onClick={() => handleUnassign(v.id, u!.id)}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Verwijderen
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Admin assign */}
                    {isAdmin && availableUsers.length > 0 && (
                      <div className="flex gap-2">
                        <select
                          value={assignUserId}
                          onChange={(e) => setAssignUserId(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                        >
                          <option value="">Wijs iemand toe...</option>
                          {availableUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => { if (assignUserId) handleAssign(v.id, assignUserId); }}
                          disabled={!assignUserId}
                          className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Self sign-up */}
                    {!isAdmin && !isMySignUp && (
                      <button
                        onClick={() => handleSignUp(v.id)}
                        className="w-full bg-primary-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700"
                      >
                        Ik pas op Mayla
                      </button>
                    )}

                    {/* Self unassign for non-admin */}
                    {!isAdmin && isMySignUp && (
                      <button
                        onClick={() => handleUnassign(v.id, user!.id)}
                        className="w-full bg-orange-100 text-orange-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-200"
                      >
                        Afmelden
                      </button>
                    )}

                    {/* Delete */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="flex items-center justify-center gap-1 text-red-500 text-xs hover:text-red-700 w-full py-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Verwijderen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-500 text-sm mb-2">Afgelopen</h3>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 5).map((v) => {
              const assignedUsers = getAssignedUsers(v.assignedUserIds);
              const days = getDayCount(v.startDate, v.endDate);
              return (
                <div key={v.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                  <Palmtree className="w-5 h-5 text-gray-300" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {format(parseISO(v.startDate), 'd MMM', { locale: nl })} – {format(parseISO(v.endDate), 'd MMM', { locale: nl })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {days} {days === 1 ? 'dag' : 'dagen'} • {assignedUsers.length > 0 ? assignedUsers.map((u) => u!.name).join(', ') : 'Niemand'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
