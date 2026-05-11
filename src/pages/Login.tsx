import { Dog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMaylaPhoto } from '../services/storage';

export default function Login() {
  const { loginAsUser, users } = useAuth();
  const navigate = useNavigate();
  const maylaPhoto = getMaylaPhoto();

  const handleLogin = (userId: string) => {
    loginAsUser(userId);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-600 to-primary-800 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        {maylaPhoto ? (
          <img src={maylaPhoto} alt="Mayla" className="w-24 h-24 rounded-full object-cover border-4 border-white/30 mx-auto mb-4 shadow-lg" />
        ) : (
          <div className="bg-white/20 rounded-full p-4 inline-block mb-4">
            <Dog className="w-16 h-16 text-white" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-white mb-1">Mayla</h1>
        <p className="text-primary-200 text-sm">Uitlaat planner</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Wie ben jij?</h2>
        <div className="grid grid-cols-2 gap-2">
          {[...users].sort((a, b) => a.name.localeCompare(b.name)).map((user) => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.id)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                {user.name[0]}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                <p className="text-[10px] text-gray-400">{user.role === 'admin' ? 'Beheerder' : 'Gebruiker'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
