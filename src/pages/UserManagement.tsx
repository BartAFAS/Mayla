import { useState } from 'react';
import { UserPlus, Trash2, Shield, ShieldOff } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import type { Role } from '../types';

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useData();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('user');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addUser({ name, role });
    showToast(`${name} toegevoegd`);
    setName('');
    setRole('user');
    setShowForm(false);
  };

  const handleDelete = async (id: string, userName: string) => {
    const ok = await confirm({
      title: 'Gebruiker verwijderen',
      message: `Weet je zeker dat je ${userName} wilt verwijderen?`,
      confirmText: 'Verwijderen',
      danger: true,
    });
    if (ok) {
      await deleteUser(id);
      showToast(`${userName} verwijderd`);
    }
  };

  const toggleRole = async (id: string, currentRole: Role) => {
    await updateUser(id, { role: currentRole === 'admin' ? 'user' : 'admin' });
    showToast('Rol gewijzigd');
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Gebruikers</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-primary-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Toevoegen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Naam"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="user">Gebruiker</option>
            <option value="admin">Beheerder</option>
          </select>
          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-700"
          >
            Toevoegen
          </button>
        </form>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
              {u.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800">{u.name}</p>
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 font-medium ${
                  u.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {u.role === 'admin' ? 'Beheerder' : 'Gebruiker'}
              </span>
            </div>
            <button
              onClick={() => toggleRole(u.id, u.role)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={u.role === 'admin' ? 'Maak gebruiker' : 'Maak beheerder'}
            >
              {u.role === 'admin' ? (
                <ShieldOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Shield className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => handleDelete(u.id, u.name)}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
