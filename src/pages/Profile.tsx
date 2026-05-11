import { useNavigate } from 'react-router-dom';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LogOut, Dog, ChevronRight, Camera, ChevronUp, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getMaylaPhoto, setMaylaPhoto, getNavOrder, setNavOrder, getUserAvatar, setUserAvatar, AVATAR_EMOJIS } from '../services/storage';
import { useState, useRef, useMemo, useCallback } from 'react';
import { CalendarDays, MessageCircle, BarChart3, Palmtree, Plus, Users } from 'lucide-react';

export default function Profile() {
  const { user, isAdmin, logout } = useAuth();
  const { moments } = useData();
  const navigate = useNavigate();
  const [maylaPhoto, setMaylaPhotoState] = useState(getMaylaPhoto());
  const [myAvatar, setMyAvatar] = useState(getUserAvatar(user!.id));
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Foto mag maximaal 2MB zijn');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setMaylaPhoto(dataUrl);
      setMaylaPhotoState(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectEmoji = (emoji: string) => {
    setUserAvatar(user.id, emoji);
    setMyAvatar(emoji);
    setShowEmojiPicker(false);
  };

  const today = startOfDay(new Date());
  const myMoments = moments
    .filter((m) => m.assignedUserId === user.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcoming = myMoments.filter((m) => !isBefore(parseISO(m.date), today));
  const past = myMoments.filter((m) => isBefore(parseISO(m.date), today));

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center mb-6">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-4xl mx-auto mb-3 hover:bg-primary-100 transition-colors ring-2 ring-primary-200"
        >
          {myAvatar || user.name[0]}
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mb-3 animate-scale-in">
            <p className="text-xs text-gray-500 mb-2 font-medium">Kies je avatar</p>
            <div className="grid grid-cols-8 gap-1.5">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => selectEmoji(emoji)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl hover:bg-primary-100 transition-colors ${
                    myAvatar === emoji ? 'bg-primary-200 ring-2 ring-primary-400' : 'bg-white'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {myAvatar && (
              <button
                onClick={() => { setUserAvatar(user.id, null); setMyAvatar(null); setShowEmojiPicker(false); }}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Avatar verwijderen
              </button>
            )}
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
        <span
          className={`inline-block text-xs px-3 py-1 rounded-full mt-2 font-medium ${
            user.role === 'admin'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {user.role === 'admin' ? 'Beheerder' : 'Gebruiker'}
        </span>
      </div>

      {/* Mayla photo (admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Foto van Mayla</h3>
          <div className="flex items-center gap-4">
            {maylaPhoto ? (
              <img src={maylaPhoto} alt="Mayla" className="w-16 h-16 rounded-full object-cover border-2 border-primary-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Dog className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <button
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700"
              >
                <Camera className="w-4 h-4" /> {maylaPhoto ? 'Andere foto kiezen' : 'Foto uploaden'}
              </button>
              {maylaPhoto && (
                <button
                  onClick={() => { setMaylaPhoto(null); setMaylaPhotoState(null); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Foto verwijderen
                </button>
              )}
            </div>
          </div>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-primary-600">{myMoments.length}</p>
          <p className="text-[10px] text-gray-400 font-medium">Totaal</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-green-600">{upcoming.length}</p>
          <p className="text-[10px] text-gray-400 font-medium">Gepland</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-bold text-gray-400">{past.length}</p>
          <p className="text-[10px] text-gray-400 font-medium">Gedaan</p>
        </div>
      </div>

      {/* Upcoming walks */}
      {upcoming.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-800 mb-2">Mijn geplande wandelingen</h3>
          <div className="space-y-2 mb-6">
            {upcoming.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/moment/${m.id}`)}
                className="w-full bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 text-left"
              >
                <Dog className="w-5 h-5 text-primary-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {format(parseISO(m.date), 'EEE d MMM', { locale: nl })}
                  </p>
                  <p className="text-xs text-gray-400">{m.time}u</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Past walks */}
      {past.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-800 mb-2">Historie</h3>
          <div className="space-y-2 mb-6">
            {past.slice(0, 10).map((m) => (
              <div
                key={m.id}
                className="bg-gray-50 rounded-xl border border-gray-100 p-3 flex items-center gap-3"
              >
                <Dog className="w-5 h-5 text-gray-300" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 capitalize">
                    {format(parseISO(m.date), 'EEE d MMM', { locale: nl })}
                  </p>
                  <p className="text-xs text-gray-400">{m.time}u</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Nav order customization */}
      <NavOrderEditor userId={user.id} isAdmin={isAdmin} />

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Uitloggen
      </button>
    </div>
  );
}

const ALL_MIDDLE_ITEMS = [
  { path: '/kalender', icon: CalendarDays, label: 'Kalender', adminOnly: false },
  { path: '/chat', icon: MessageCircle, label: 'Chat', adminOnly: false },
  { path: '/statistieken', icon: BarChart3, label: 'Stats', adminOnly: false },
  { path: '/vakantie', icon: Palmtree, label: 'Vakantie', adminOnly: false },
  { path: '/nieuw', icon: Plus, label: 'Nieuw', adminOnly: true },
  { path: '/gebruikers', icon: Users, label: 'Gebruikers', adminOnly: true },
];

function NavOrderEditor({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const availableItems = useMemo(
    () => ALL_MIDDLE_ITEMS.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin],
  );

  const getOrderedItems = useCallback(() => {
    const savedOrder = getNavOrder(userId);
    if (!savedOrder) return availableItems;
    return [...availableItems].sort((a, b) => {
      const idxA = savedOrder.indexOf(a.path);
      const idxB = savedOrder.indexOf(b.path);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [userId, availableItems]);

  const [items, setItems] = useState(getOrderedItems);

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
    setNavOrder(userId, newItems.map((i) => i.path));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Menu className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-800">Menu indelen</h3>
      </div>
      <p className="text-xs text-gray-400 mb-3">Verplaats items om je navigatiebalk in te delen.</p>
      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={item.path}
            className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5"
          >
            <item.icon className="w-4 h-4 text-primary-500 shrink-0" />
            <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
            <div className="flex gap-1">
              <button
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="p-1 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-20 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                className="p-1 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-20 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
