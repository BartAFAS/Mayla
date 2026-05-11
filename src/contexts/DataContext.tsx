import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { WalkMoment, User } from '../types';
import * as storage from '../services/storage';

interface DataContextType {
  moments: WalkMoment[];
  users: User[];
  refreshUsers: () => Promise<void>;
  createMoment: (moment: Omit<WalkMoment, 'id' | 'createdAt'>) => Promise<WalkMoment>;
  updateMoment: (id: string, updates: Partial<WalkMoment>) => Promise<void>;
  deleteMoment: (id: string) => Promise<void>;
  signUp: (momentId: string, userId: string, userName: string) => Promise<void>;
  cancelSignUp: (momentId: string, userId: string, userName: string) => Promise<void>;
  transferMoment: (momentId: string, fromUserId: string, toUserId: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [moments, setMoments] = useState<WalkMoment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Real-time listener for moments
  useEffect(() => {
    const unsubscribe = storage.onMomentsSnapshot((newMoments) => {
      setMoments(newMoments);
    });
    return unsubscribe;
  }, []);

  // Load users initially
  useEffect(() => {
    storage.getUsers().then(setUsers);
  }, []);

  const refreshUsers = useCallback(async () => {
    const loaded = await storage.getUsers();
    setUsers(loaded);
  }, []);

  const createMoment = useCallback(
    async (moment: Omit<WalkMoment, 'id' | 'createdAt'>) => {
      const created = await storage.addMoment(moment);
      await storage.broadcastNotification(
        { message: `Nieuw uitlaatmoment op ${moment.date} om ${moment.time}u`, type: 'new_moment', momentId: created.id },
        moment.createdBy,
      );
      return created;
    },
    [],
  );

  const updateMomentAction = useCallback(
    async (id: string, updates: Partial<WalkMoment>) => {
      await storage.updateMoment(id, updates);
      const allMoments = await storage.getMoments();
      const m = allMoments.find((m) => m.id === id);
      if (m) {
        await storage.broadcastNotification(
          { message: `Uitlaatmoment op ${m.date} is gewijzigd`, type: 'moment_changed', momentId: id },
        );
      }
    },
    [],
  );

  const deleteMomentAction = useCallback(
    async (id: string) => {
      await storage.deleteMoment(id);
    },
    [],
  );

  const signUp = useCallback(
    async (momentId: string, userId: string, userName: string) => {
      await storage.updateMoment(momentId, { assignedUserId: userId });
      const allMoments = await storage.getMoments();
      const m = allMoments.find((m) => m.id === momentId);
      if (m) {
        await storage.broadcastNotification(
          { message: `${userName} heeft zich ingeschreven voor ${m.date} om ${m.time}u`, type: 'signup', momentId },
          userId,
        );
      }
    },
    [],
  );

  const cancelSignUp = useCallback(
    async (momentId: string, _userId: string, userName: string) => {
      await storage.updateMoment(momentId, { assignedUserId: null });
      const allMoments = await storage.getMoments();
      const m = allMoments.find((m) => m.id === momentId);
      if (m) {
        // Notify admins
        const allUsers = await storage.getUsers();
        const admins = allUsers.filter((u) => u.role === 'admin');
        for (const admin of admins) {
          await storage.addNotification(admin.id, {
            message: `${userName} heeft de inschrijving geannuleerd voor ${m.date} om ${m.time}u`,
            type: 'cancellation',
            momentId,
          });
        }
      }
    },
    [],
  );

  const transferMoment = useCallback(
    async (momentId: string, fromUserId: string, toUserId: string) => {
      await storage.updateMoment(momentId, { assignedUserId: toUserId });
      const allMoments = await storage.getMoments();
      const allUsers = await storage.getUsers();
      const m = allMoments.find((m) => m.id === momentId);
      const toUser = allUsers.find((u) => u.id === toUserId);
      const fromUser = allUsers.find((u) => u.id === fromUserId);
      if (m && toUser) {
        // Notify the original user that their moment was taken over
        await storage.addNotification(fromUserId, {
          message: `${toUser.name} heeft jouw uitlaatmoment van ${m.date} om ${m.time}u overgenomen`,
          type: 'moment_changed',
          momentId,
        });
        // Broadcast to others
        await storage.broadcastNotification(
          { message: `${toUser.name} heeft het uitlaatmoment van ${fromUser?.name || 'iemand'} overgenomen (${m.date} om ${m.time}u)`, type: 'signup', momentId },
          toUserId,
        );
      }
    },
    [],
  );

  const addUserAction = useCallback(
    async (user: Omit<User, 'id'>) => {
      const created = await storage.addUser(user);
      await refreshUsers();
      return created;
    },
    [refreshUsers],
  );

  const updateUserAction = useCallback(
    async (id: string, updates: Partial<User>) => {
      await storage.updateUser(id, updates);
      await refreshUsers();
    },
    [refreshUsers],
  );

  const deleteUserAction = useCallback(
    async (id: string) => {
      await storage.deleteUser(id);
      await refreshUsers();
    },
    [refreshUsers],
  );

  return (
    <DataContext.Provider
      value={{
        moments,
        users,
        refreshUsers,
        createMoment,
        updateMoment: updateMomentAction,
        deleteMoment: deleteMomentAction,
        signUp,
        cancelSignUp,
        transferMoment,
        addUser: addUserAction,
        updateUser: updateUserAction,
        deleteUser: deleteUserAction,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
