import { describe, it, expect } from 'vitest';
import { plans } from '@/Plans/Plans';

describe('Plans data', () => {
  it('defines exactly 3 plans: Free, Practice, Fluent', () => {
    expect(plans.map((p) => p.name)).toEqual(['Free', 'Practice', 'Fluent']);
  });

  it('the Free plan does not require payment (type "free")', () => {
    const free = plans.find((p) => p.name === 'Free')!;
    expect(free.type).toBe('free');
  });

  it('Practice and Fluent have distinct monthly/yearly price types for Stripe', () => {
    const practice = plans.find((p) => p.name === 'Practice')! as any;
    const fluent = plans.find((p) => p.name === 'Fluent')! as any;

    expect(practice.type).toEqual({ monthly: 'practice_monthly', yearly: 'practice_yearly' });
    expect(fluent.type).toEqual({ monthly: 'fluent_monthly', yearly: 'fluent_yearly' });
  });

  it('only the Fluent plan is highlighted', () => {
    const highlighted = plans.filter((p) => p.highlight);
    expect(highlighted.map((p) => p.name)).toEqual(['Fluent']);
  });
});
