import type { User, WalkMoment, AppNotification, ChatMessage, VacationMoment } from '../types';

type Unsubscribe = () => void;

const STORAGE_KEYS = {
  users: 'mayla_users',
  moments: 'mayla_moments',
  notifications: 'mayla_notifications',
  currentUser: 'mayla_current_user',
  chat: 'mayla_chat',
  vacations: 'mayla_vacations',
  maylaPhoto: 'mayla_photo',
};

const DEFAULT_USERS: User[] = [
  { id: '10', name: 'Anny', role: 'user' },
  { id: '5', name: 'Arno', role: 'user' },
  { id: '1', name: 'Bart', role: 'admin' },
  { id: '8', name: 'Erik', role: 'user' },
  { id: '6', name: 'Iris', role: 'user' },
  { id: '4', name: 'Lana', role: 'user' },
  { id: '9', name: 'Marco', role: 'user' },
  { id: '2', name: 'Robin', role: 'admin' },
  { id: '3', name: 'Victor', role: 'user' },
  { id: '7', name: 'Wessel', role: 'user' },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Init default users if not yet present
export function initLocalData() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    save(STORAGE_KEYS.users, DEFAULT_USERS);
  }

  // One-time cleanup: remove email field and sort alphabetically
  if (!localStorage.getItem('mayla_cleanup_emails')) {
    const users = load<(User & { email?: string })[]>(STORAGE_KEYS.users, []);
    const cleaned = users
      .map(({ email: _email, ...rest }) => rest as User)
      .sort((a, b) => a.name.localeCompare(b.name));
    save(STORAGE_KEYS.users, cleaned);
    localStorage.setItem('mayla_cleanup_emails', 'done');
  }

  // One-time cleanup: remove walk moments from 2026-07-23 onwards
  if (!localStorage.getItem('mayla_cleanup_jul23')) {
    const moments = load<WalkMoment[]>(STORAGE_KEYS.moments, []);
    const filtered = moments.filter((m) => m.date < '2026-07-23');
    save(STORAGE_KEYS.moments, filtered);
    localStorage.setItem('mayla_cleanup_jul23', 'done');
  }
}

// --- Current User (Demo auth) ---
export function getLocalCurrentUser(): User | null {
  return load<User | null>(STORAGE_KEYS.currentUser, null);
}

export function setLocalCurrentUser(user: User | null) {
  save(STORAGE_KEYS.currentUser, user);
}

// --- Mayla Photo ---
export function getMaylaPhoto(): string | null {
  return localStorage.getItem(STORAGE_KEYS.maylaPhoto);
}

export function setMaylaPhoto(dataUrl: string | null) {
  if (dataUrl) {
    localStorage.setItem(STORAGE_KEYS.maylaPhoto, dataUrl);
  } else {
    localStorage.removeItem(STORAGE_KEYS.maylaPhoto);
  }
}

// --- Nav Order (per user) ---
export function getNavOrder(userId: string): string[] | null {
  const raw = localStorage.getItem(`mayla_nav_order_${userId}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setNavOrder(userId: string, paths: string[]) {
  localStorage.setItem(`mayla_nav_order_${userId}`, JSON.stringify(paths));
}

// --- User Avatars (emoji) ---
export function getUserAvatar(userId: string): string | null {
  return localStorage.getItem(`mayla_avatar_${userId}`);
}

export function setUserAvatar(userId: string, emoji: string | null) {
  if (emoji) {
    localStorage.setItem(`mayla_avatar_${userId}`, emoji);
  } else {
    localStorage.removeItem(`mayla_avatar_${userId}`);
  }
}

export const AVATAR_EMOJIS = [
  '🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁',
  '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦅',
  '🦉', '🦋', '🐢', '🐬', '🐙', '🦀', '🐝', '🐞',
  '🌸', '🌻', '🌈', '⭐', '🌙', '☀️', '🔥', '💧',
  '🎸', '🎨', '⚽', '🏀', '🎯', '🚀', '✈️', '🏔️',
  '🌊', '🍀', '🌵', '🎭', '👑', '💎', '🎪', '🎃',
];

// --- Users ---
export async function getUsers(): Promise<User[]> {
  return load(STORAGE_KEYS.users, DEFAULT_USERS);
}

export async function addUser(user: Omit<User, 'id'>): Promise<User> {
  const users = load<User[]>(STORAGE_KEYS.users, DEFAULT_USERS);
  const newUser: User = { ...user, id: crypto.randomUUID() };
  users.push(newUser);
  save(STORAGE_KEYS.users, users);
  return newUser;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const users = load<User[]>(STORAGE_KEYS.users, DEFAULT_USERS);
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    save(STORAGE_KEYS.users, users);
  }
}

export async function deleteUser(id: string) {
  const users = load<User[]>(STORAGE_KEYS.users, DEFAULT_USERS).filter((u) => u.id !== id);
  save(STORAGE_KEYS.users, users);
}

// --- Walk Moments ---
export async function getMoments(): Promise<WalkMoment[]> {
  return load<WalkMoment[]>(STORAGE_KEYS.moments, []);
}

// Listeners for local mode (poll-based simulation)
type MomentsCallback = (moments: WalkMoment[]) => void;
const momentListeners = new Set<MomentsCallback>();

function notifyMomentListeners() {
  const moments = load<WalkMoment[]>(STORAGE_KEYS.moments, []);
  momentListeners.forEach((cb) => cb(moments));
}

export function onMomentsSnapshot(callback: MomentsCallback): Unsubscribe {
  // Immediately call with current data
  callback(load<WalkMoment[]>(STORAGE_KEYS.moments, []));
  momentListeners.add(callback);
  return () => { momentListeners.delete(callback); };
}

export async function addMoment(moment: Omit<WalkMoment, 'id' | 'createdAt'>): Promise<WalkMoment> {
  const moments = load<WalkMoment[]>(STORAGE_KEYS.moments, []);
  const newMoment: WalkMoment = {
    ...moment,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  moments.push(newMoment);
  save(STORAGE_KEYS.moments, moments);
  notifyMomentListeners();
  return newMoment;
}

export async function updateMoment(id: string, updates: Partial<WalkMoment>) {
  const moments = load<WalkMoment[]>(STORAGE_KEYS.moments, []);
  const idx = moments.findIndex((m) => m.id === id);
  if (idx !== -1) {
    moments[idx] = { ...moments[idx], ...updates };
    save(STORAGE_KEYS.moments, moments);
    notifyMomentListeners();
  }
}

export async function deleteMoment(id: string) {
  const moments = load<WalkMoment[]>(STORAGE_KEYS.moments, []).filter((m) => m.id !== id);
  save(STORAGE_KEYS.moments, moments);
  notifyMomentListeners();
}

// --- Notifications ---
type NotifCallback = (notifications: AppNotification[]) => void;
const notifListeners = new Map<string, Set<NotifCallback>>();

function getNotifKey(userId: string) {
  return `${STORAGE_KEYS.notifications}_${userId}`;
}

function loadNotifications(userId: string): AppNotification[] {
  return load<AppNotification[]>(getNotifKey(userId), []);
}

function saveNotifications(userId: string, notifications: AppNotification[]) {
  save(getNotifKey(userId), notifications);
  const listeners = notifListeners.get(userId);
  if (listeners) listeners.forEach((cb) => cb(notifications));
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  return loadNotifications(userId);
}

export function onNotificationsSnapshot(userId: string, callback: NotifCallback): Unsubscribe {
  callback(loadNotifications(userId));
  if (!notifListeners.has(userId)) notifListeners.set(userId, new Set());
  notifListeners.get(userId)!.add(callback);
  return () => { notifListeners.get(userId)?.delete(callback); };
}

export async function addNotification(userId: string, notification: Omit<AppNotification, 'id' | 'userId' | 'timestamp' | 'read'>) {
  const notifications = loadNotifications(userId);
  notifications.unshift({
    ...notification,
    id: crypto.randomUUID(),
    userId,
    timestamp: new Date().toISOString(),
    read: false,
  });
  saveNotifications(userId, notifications);
}

export async function broadcastNotification(
  notification: Omit<AppNotification, 'id' | 'userId' | 'timestamp' | 'read'>,
  excludeUserId?: string
) {
  const users = await getUsers();
  for (const u of users) {
    if (u.id !== excludeUserId) {
      await addNotification(u.id, notification);
    }
  }
}

export async function markNotificationRead(notificationId: string) {
  // We need to find which user this belongs to - search all
  const users = await getUsers();
  for (const u of users) {
    const notifs = loadNotifications(u.id);
    const idx = notifs.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      notifs[idx].read = true;
      saveNotifications(u.id, notifs);
      break;
    }
  }
}

export async function markAllNotificationsRead(userId: string) {
  const notifs = loadNotifications(userId).map((n) => ({ ...n, read: true }));
  saveNotifications(userId, notifs);
}

// --- Chat ---
type ChatCallback = (messages: ChatMessage[]) => void;
const chatListeners = new Set<ChatCallback>();

function loadChat(): ChatMessage[] {
  return load<ChatMessage[]>(STORAGE_KEYS.chat, []);
}

function saveChat(messages: ChatMessage[]) {
  save(STORAGE_KEYS.chat, messages);
  chatListeners.forEach((cb) => cb(messages));
}

export function onChatSnapshot(callback: ChatCallback): Unsubscribe {
  callback(loadChat());
  chatListeners.add(callback);
  return () => { chatListeners.delete(callback); };
}

export async function sendChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
  const messages = loadChat();
  const newMsg: ChatMessage = {
    ...msg,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  messages.push(newMsg);
  saveChat(messages);
  return newMsg;
}

// --- Vacations ---
type VacationCallback = (vacations: VacationMoment[]) => void;
const vacationListeners = new Set<VacationCallback>();

function notifyVacationListeners() {
  const vacations = load<VacationMoment[]>(STORAGE_KEYS.vacations, []);
  vacationListeners.forEach((cb) => cb(vacations));
}

export async function getVacations(): Promise<VacationMoment[]> {
  return load<VacationMoment[]>(STORAGE_KEYS.vacations, []);
}

export function onVacationsSnapshot(callback: VacationCallback): Unsubscribe {
  callback(load<VacationMoment[]>(STORAGE_KEYS.vacations, []));
  vacationListeners.add(callback);
  return () => { vacationListeners.delete(callback); };
}

export async function addVacation(vacation: Omit<VacationMoment, 'id' | 'createdAt'>): Promise<VacationMoment> {
  const vacations = load<VacationMoment[]>(STORAGE_KEYS.vacations, []);
  const newVacation: VacationMoment = {
    ...vacation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  vacations.push(newVacation);
  save(STORAGE_KEYS.vacations, vacations);
  notifyVacationListeners();
  return newVacation;
}

export async function updateVacation(id: string, updates: Partial<VacationMoment>) {
  const vacations = load<VacationMoment[]>(STORAGE_KEYS.vacations, []);
  const idx = vacations.findIndex((v) => v.id === id);
  if (idx !== -1) {
    vacations[idx] = { ...vacations[idx], ...updates };
    save(STORAGE_KEYS.vacations, vacations);
    notifyVacationListeners();
  }
}

export async function deleteVacation(id: string) {
  const vacations = load<VacationMoment[]>(STORAGE_KEYS.vacations, []).filter((v) => v.id !== id);
  save(STORAGE_KEYS.vacations, vacations);
  notifyVacationListeners();
}
