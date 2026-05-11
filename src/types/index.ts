export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export type MomentStatus = 'open' | 'filled';

export interface WalkMoment {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // HH:mm
  notes: string;
  assignedUserId: string | null;
  createdBy: string;
  createdAt: string; // ISO datetime
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'new_moment' | 'moment_changed' | 'signup' | 'cancellation' | 'reminder';
  momentId?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  imageData?: string; // base64 data URL
  timestamp: string;
}

export interface VacationMoment {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  notes: string;
  assignedUserIds: string[];
  createdBy: string;
  createdAt: string;
}
