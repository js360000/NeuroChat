export interface PlanLimits {
  dailyLikes: number;        // -1 = unlimited
  dailySuperLikes: number;
  monthlyBoosts: number;
  canSeeWhoLikedYou: boolean;
  canRewind: boolean;
  advancedFilters: boolean;
  priorityInbox: boolean;
  incognitoMode: boolean;
  queueSize: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    dailyLikes: 10,
    dailySuperLikes: 0,
    monthlyBoosts: 0,
    canSeeWhoLikedYou: false,
    canRewind: false,
    advancedFilters: false,
    priorityInbox: false,
    incognitoMode: false,
    queueSize: 3,
  },
  premium: {
    dailyLikes: 50,
    dailySuperLikes: 3,
    monthlyBoosts: 2,
    canSeeWhoLikedYou: true,
    canRewind: true,
    advancedFilters: true,
    priorityInbox: true,
    incognitoMode: false,
    queueSize: 10,
  },
  pro: {
    dailyLikes: -1,
    dailySuperLikes: 10,
    monthlyBoosts: 4,
    canSeeWhoLikedYou: true,
    canRewind: true,
    advancedFilters: true,
    priorityInbox: true,
    incognitoMode: true,
    queueSize: 25,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

// In-memory daily usage tracking
interface DailyUsage {
  likes: number;
  superLikes: number;
  lastReset: string; // ISO date string YYYY-MM-DD
}

const dailyUsageMap = new Map<string, DailyUsage>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOrCreateUsage(userId: string): DailyUsage {
  const today = todayKey();
  const existing = dailyUsageMap.get(userId);
  if (existing && existing.lastReset === today) {
    return existing;
  }
  const fresh: DailyUsage = { likes: 0, superLikes: 0, lastReset: today };
  dailyUsageMap.set(userId, fresh);
  return fresh;
}

export function getDailyUsage(userId: string): DailyUsage {
  return getOrCreateUsage(userId);
}

export function incrementLike(userId: string, isSuper: boolean): void {
  const usage = getOrCreateUsage(userId);
  if (isSuper) {
    usage.superLikes += 1;
  } else {
    usage.likes += 1;
  }
}

export function canLike(userId: string, plan: string, isSuper: boolean): { allowed: boolean; remaining: number; limit: number } {
  const limits = getPlanLimits(plan);
  const usage = getOrCreateUsage(userId);

  if (isSuper) {
    const limit = limits.dailySuperLikes;
    if (limit <= 0) return { allowed: false, remaining: 0, limit: 0 };
    const remaining = Math.max(0, limit - usage.superLikes);
    return { allowed: remaining > 0, remaining, limit };
  }

  const limit = limits.dailyLikes;
  if (limit === -1) return { allowed: true, remaining: -1, limit: -1 };
  const remaining = Math.max(0, limit - usage.likes);
  return { allowed: remaining > 0, remaining, limit };
}

// Rewind tracking - stores last liked user ID per user
const lastLikeMap = new Map<string, string>();

export function setLastLike(userId: string, targetId: string): void {
  lastLikeMap.set(userId, targetId);
}

export function getLastLike(userId: string): string | null {
  return lastLikeMap.get(userId) || null;
}

export function clearLastLike(userId: string): void {
  lastLikeMap.delete(userId);
}
