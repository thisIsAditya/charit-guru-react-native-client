import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, Plan, Subscription } from './api';

interface SessionState {
  user: User | null;
  plan: Plan | null;
  subscription: Subscription | null;
  isLoading: boolean;

  // Derived trial state
  trialDaysLeft: number;
  isTrialExpired: boolean;
  isPaidPlan: boolean;

  setSession: (user: User, plan: Plan) => void;
  setSubscription: (sub: Subscription | null) => void;
  clearSession: () => void;
  refreshTrialState: () => void;
}

function computeTrialDays(trialExpiresAt: string): number {
  const diff = new Date(trialExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  plan: null,
  subscription: null,
  isLoading: true,
  trialDaysLeft: 30,
  isTrialExpired: false,
  isPaidPlan: false,

  setSession: (user, plan) => {
    const trialDaysLeft = computeTrialDays(user.trial_expires_at);
    const isTrialExpired = trialDaysLeft === 0;
    const isPaidPlan = plan.id !== 'free';
    set({ user, plan, trialDaysLeft, isTrialExpired, isPaidPlan, isLoading: false });
  },

  setSubscription: (subscription) => set({ subscription }),

  clearSession: async () => {
    await SecureStore.deleteItemAsync('session_cookie');
    set({ user: null, plan: null, subscription: null, isLoading: false });
  },

  refreshTrialState: () => {
    const { user, plan } = get();
    if (!user || !plan) return;
    const trialDaysLeft = computeTrialDays(user.trial_expires_at);
    const isTrialExpired = trialDaysLeft === 0;
    const isPaidPlan = plan.id !== 'free';
    set({ trialDaysLeft, isTrialExpired, isPaidPlan });
  },
}));
