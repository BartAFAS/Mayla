import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, User, MessageSquare, Trash2, Edit, ArrowRightLeft, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function MomentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { moments, users, signUp, cancelSignUp, deleteMoment, transferMoment } = useData();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const moment = moments.find((m) => m.id === id);
  if (!moment) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center py-12 text-gray-400">
        Moment niet gevonden
      </div>
    );
  }

  const assignedUser = moment.assignedUserId
    ? users.find((u) => u.id === moment.assignedUserId)
    : null;
  const isOpen = !moment.assignedUserId;
  const isMySignUp = moment.assignedUserId === user?.id;

  const handleSignUp = async () => {
    if (user) {
      await signUp(moment.id, user.id, user.name);
      showToast('Aangemeld!');
    }
  };

  const handleCancel = async () => {
    if (user) {
      await cancelSignUp(moment.id, user.id, user.name);
      showToast('Afgemeld', 'info');
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Moment verwijderen',
      message: 'Weet je zeker dat je dit moment wilt verwijderen? Dit kan niet ongedaan worden.',
      confirmText: 'Verwijderen',
      danger: true,
    });
    if (ok) {
      await deleteMoment(moment.id);
      showToast('Moment verwijderd');
      navigate(-1);
    }
  };

  const [assignUserId, setAssignUserId] = useState('');
  const [transferUserId, setTransferUserId] = useState('');

  const handleAdminAssign = async () => {
    if (!assignUserId) return;
    const assignedUser = users.find((u) => u.id === assignUserId);
    if (assignedUser) {
      await signUp(moment.id, assignedUser.id, assignedUser.name);
      setAssignUserId('');
      showToast(`${assignedUser.name} toegewezen`);
    }
  };

  const handleAdminUnassign = async () => {
    if (assignedUser) {
      await cancelSignUp(moment.id, assignedUser.id, assignedUser.name);
      showToast('Toewijzing verwijderd', 'info');
    }
  };

  const handleTransfer = async () => {
    if (!transferUserId || !moment.assignedUserId) return;
    const toUser = users.find((u) => u.id === transferUserId);
    if (!toUser) return;
    await transferMoment(moment.id, moment.assignedUserId, toUser.id);
    setTransferUserId('');
    showToast(`Overgedragen aan ${toUser.name}`);
  };

  const handleTakeOver = async () => {
    if (!user || !moment.assignedUserId) return;
    const ok = await confirm({
      title: 'Moment overnemen',
      message: `Wil je dit uitlaatmoment overnemen van ${assignedUser?.name}? ${assignedUser?.name} krijgt hiervan een melding.`,
      confirmText: 'Overnemen',
    });
    if (ok) {
      await transferMoment(moment.id, moment.assignedUserId, user.id);
      showToast('Overgenomen!');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Status banner */}
        <div className={`px-4 py-3 ${isOpen ? 'bg-orange-50 border-b border-orange-100' : 'bg-green-50 border-b border-green-100'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isOpen ? 'bg-orange-400' : 'bg-green-400'}`} />
            <span className={`font-semibold text-sm ${isOpen ? 'text-orange-700' : 'text-green-700'}`}>
              {isOpen ? '⏳ Open – hulp nodig!' : '✅ Ingevuld'}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Date */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Datum</p>
              <p className="font-semibold text-gray-800 capitalize">
                {format(parseISO(moment.date), 'EEEE d MMMM yyyy', { locale: nl })}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Tijdstip</p>
              <p className="font-semibold text-gray-800">
                {moment.time}u
              </p>
            </div>
          </div>

          {/* Assigned user */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Uitlater</p>
              <p className="font-semibold text-gray-800">
                {assignedUser ? assignedUser.name : 'Nog niemand'}
              </p>
            </div>
          </div>

          {/* Notes */}
          {moment.notes && (
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Opmerkingen</p>
                <p className="text-gray-800">{moment.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          {/* Admin: assign user */}
          {isAdmin && isOpen && (
            <div className="bg-purple-50 rounded-xl p-3 space-y-2">
              <p className="text-sm font-medium text-purple-700">Gebruiker toewijzen</p>
              <div className="flex gap-2">
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="flex-1 border border-purple-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Kies een gebruiker...</option>
                  {users.filter((u) => !['Robin', 'Bart', 'Anny'].includes(u.name)).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAdminAssign}
                  disabled={!assignUserId}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Toewijzen
                </button>
              </div>
            </div>
          )}

          {/* Admin: unassign user */}
          {isAdmin && !isOpen && (
            <button
              onClick={handleAdminUnassign}
              className="w-full bg-orange-100 text-orange-700 py-3 rounded-xl font-semibold hover:bg-orange-200 transition-colors"
            >
              Toewijzing verwijderen
            </button>
          )}

          {/* Transfer: assigned user or admin can transfer to someone else */}
          {!isOpen && (isMySignUp || isAdmin) && (
            <div className="bg-blue-50 rounded-xl p-3 space-y-2">
              <p className="text-sm font-medium text-blue-700 flex items-center gap-1">
                <ArrowRightLeft className="w-4 h-4" /> Overdragen aan
              </p>
              <div className="flex gap-2">
                <select
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                  className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Kies een gebruiker...</option>
                  {users.filter((u) => u.id !== moment.assignedUserId && !['Robin', 'Bart', 'Anny'].includes(u.name)).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleTransfer}
                  disabled={!transferUserId}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Overdragen
                </button>
              </div>
            </div>
          )}

          {/* Takeover: non-assigned user can take over from current user */}
          {!isOpen && !isMySignUp && !isAdmin && (
            <button
              onClick={handleTakeOver}
              className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-200 transition-colors"
            >
              <UserCheck className="w-4 h-4" /> Overnemen van {assignedUser?.name}
            </button>
          )}

          {/* Self sign-up (non-admin) */}
          {!isAdmin && isOpen && (
            <button
              onClick={handleSignUp}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Inschrijven
            </button>
          )}

          {isMySignUp && !isAdmin && (
            <button
              onClick={handleCancel}
              className="w-full bg-orange-100 text-orange-700 py-3 rounded-xl font-semibold hover:bg-orange-200 transition-colors"
            >
              Inschrijving annuleren
            </button>
          )}

          {isAdmin && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => navigate(`/bewerken/${moment.id}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <Edit className="w-4 h-4" /> Bewerken
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 px-4 rounded-xl font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
