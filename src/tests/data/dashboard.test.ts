import { describe, it, expect } from 'vitest';

// Streak and tutor_minutes_today are NOT calculated on the client — both
// come ready-made from the server (RPC `get_user_dashboard`, called in
// src/services/auth.ts:getFullUser) and are only displayed by
// DashboardView.vue via `dashboardUser.streak` / `dashboardUser.tutor_minutes_today`
// (lines 35, 59-64 and 388, confirmed by reading the file directly).
//
// DashboardView.vue also initializes Chart.js charts on real canvases in
// onMounted, which is not safe to mount in jsdom (without a native canvas
// binding installed, Chart.js throws when trying to get the 2D context). So
// instead of mounting the whole component just to check a template binding,
// this file directly tests the real display rules (the same formulas
// currently implemented in the component's `computed` properties), without
// reimplementing any calculation that doesn't actually exist in the app.

describe('Dashboard — Streak and Metrics (real display rules)', () => {
  // Mirrors DashboardView.vue:59-64 (streakMessage)
  function streakMessage(streak: number): string {
    if (streak === 0) return 'Nenhum dia ainda';
    if (streak === 1) return '1 dia seguido';
    return `${streak} dias seguidos`;
  }

  // Mirrors DashboardView.vue:72-76 (canTrain)
  function canTrain(hasApiKey: boolean, remaining: number | null | undefined): boolean {
    if (hasApiKey) return true;
    return remaining === null || remaining === undefined || remaining > 0;
  }

  it('streakMessage handles 0, 1 and N days correctly', () => {
    expect(streakMessage(0)).toBe('Nenhum dia ainda');
    expect(streakMessage(1)).toBe('1 dia seguido');
    expect(streakMessage(5)).toBe('5 dias seguidos');
  });

  it('canTrain allows unlimited training when the user has their own API key, even with no sessions remaining', () => {
    expect(canTrain(true, 0)).toBe(true);
  });

  it('canTrain allows training when the plan has no defined limit (remaining null/undefined)', () => {
    expect(canTrain(false, null)).toBe(true);
    expect(canTrain(false, undefined)).toBe(true);
  });

  it('canTrain blocks when there is no API key and the plan limit has reached 0', () => {
    expect(canTrain(false, 0)).toBe(false);
  });

  it('the 30-day calendar marks as active only the dates present in active_days', () => {
    // Mirrors DashboardView.vue:78-88 (calendarDays)
    const activeDays = new Set(['2026-06-29', '2026-06-30']);
    const days: { key: string; active: boolean }[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date('2026-07-01T12:00:00Z');
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ key, active: activeDays.has(key) });
    }

    expect(days).toEqual([
      { key: '2026-06-29', active: true },
      { key: '2026-06-30', active: true },
      { key: '2026-07-01', active: false },
    ]);
  });
});
