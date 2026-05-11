import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Plus, Users, User, Bell, LogOut, Dog, MessageCircle, BarChart3, Palmtree } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { onNotificationsSnapshot, getMaylaPhoto, getNavOrder, setNavOrder } from '../../services/storage';

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pageKey, setPageKey] = useState(location.pathname);
  const maylaPhoto = getMaylaPhoto();

  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onNotificationsSnapshot(user.id, (notifications) => {
      setUnreadCount(notifications.filter((n) => !n.read).length);
    });
    return unsubscribe;
  }, [user]);

  // All middle nav items (between Home and Profiel)
  const allMiddleItems = useMemo(() => [
    { path: '/kalender', icon: CalendarDays, label: 'Kalender', adminOnly: false },
    { path: '/chat', icon: MessageCircle, label: 'Chat', adminOnly: false },
    { path: '/statistieken', icon: BarChart3, label: 'Stats', adminOnly: false },
    { path: '/vakantie', icon: Palmtree, label: 'Vakantie', adminOnly: false },
    { path: '/nieuw', icon: Plus, label: 'Nieuw', adminOnly: true },
    { path: '/gebruikers', icon: Users, label: 'Gebruikers', adminOnly: true },
  ], []);

  const middleItems = useMemo(() => {
    const available = allMiddleItems.filter((item) => !item.adminOnly || isAdmin);
    if (!user) return available;
    const savedOrder = getNavOrder(user.id);
    if (!savedOrder) return available;
    // Sort by saved order, keep unsaved items at the end
    const sorted = [...available].sort((a, b) => {
      const idxA = savedOrder.indexOf(a.path);
      const idxB = savedOrder.indexOf(b.path);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return sorted;
  }, [allMiddleItems, isAdmin, user]);

  const homeItem = { path: '/', icon: Home, label: 'Home' };
  const profileItem = { path: '/profiel', icon: User, label: 'Profiel' };

  // Drag state for bottom nav reordering
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [orderedMiddle, setOrderedMiddle] = useState(middleItems);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Sync orderedMiddle when middleItems change (e.g. login as different user)
  useEffect(() => {
    setOrderedMiddle(middleItems);
  }, [middleItems]);

  const getMiddleIndexFromX = useCallback((clientX: number): number | null => {
    // Find which middle item the finger is over (skip index 0 = Home, skip last = Profiel)
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return i;
      }
    }
    return null;
  }, []);

  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartX.current = touch.clientX;
    isDragging.current = false;

    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      setDragIndex(index);
      setDragOverIndex(index);
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(30);
    }, 300);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) {
      // If moved too far before long press, cancel
      const dx = Math.abs(e.touches[0].clientX - dragStartX.current);
      if (dx > 10 && longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      return;
    }
    e.preventDefault();
    const overIdx = getMiddleIndexFromX(e.touches[0].clientX);
    if (overIdx !== null) {
      setDragOverIndex(overIdx);
    }
  }, [getMiddleIndexFromX]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isDragging.current && dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newItems = [...orderedMiddle];
      const [moved] = newItems.splice(dragIndex, 1);
      newItems.splice(dragOverIndex, 0, moved);
      setOrderedMiddle(newItems);
      if (user) {
        setNavOrder(user.id, newItems.map((i) => i.path));
      }
    }
    isDragging.current = false;
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, orderedMiddle, user]);

  const allNavItems = [homeItem, ...orderedMiddle, profileItem];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          {maylaPhoto ? (
            <img src={maylaPhoto} alt="Mayla" className="w-8 h-8 rounded-full object-cover border-2 border-white/40" />
          ) : (
            <Dog className="w-7 h-7" />
          )}
          <h1 className="text-lg font-bold tracking-tight">Mayla</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/meldingen')}
            className="relative p-2 rounded-full hover:bg-primary-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2 rounded-full hover:bg-primary-700 transition-colors"
            title="Uitloggen"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 overflow-auto">
        <div key={pageKey} className="animate-page">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div ref={navRef} className="flex justify-around items-center py-2 max-w-lg mx-auto">
          {allNavItems.map((item, i) => {
            const active = location.pathname === item.path;
            const isFixed = item.path === '/' || item.path === '/profiel';
            // Middle item index (for drag)
            const middleIndex = isFixed ? null : i - 1; // offset for Home at index 0
            const isBeingDragged = middleIndex !== null && middleIndex === dragIndex;
            const isDropTarget = middleIndex !== null && middleIndex === dragOverIndex && dragIndex !== null && dragIndex !== dragOverIndex;

            return (
              <button
                key={item.path}
                ref={(el) => {
                  if (middleIndex !== null) itemRefs.current[middleIndex] = el;
                }}
                onClick={() => {
                  if (!isDragging.current) navigate(item.path);
                }}
                onTouchStart={middleIndex !== null ? (e) => handleTouchStart(middleIndex, e) : undefined}
                onTouchMove={middleIndex !== null ? handleTouchMove : undefined}
                onTouchEnd={middleIndex !== null ? handleTouchEnd : undefined}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                  active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                } ${isBeingDragged ? 'scale-110 opacity-70 bg-primary-50 shadow-lg z-10' : ''} ${
                  isDropTarget ? 'scale-95 bg-gray-100' : ''
                }`}
                style={{ touchAction: 'none' }}
              >
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
