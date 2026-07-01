import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkout } from '@/services/checkout';

// The real function is `checkout(auth, planType)` (src/services/checkout.ts) —
// not `createCheckoutSession(priceId, userId)`. It does not return `{ url }`:
// it redirects the browser directly via `window.location.href`. There is no
// priceId concept on the client (the plan → Stripe price mapping happens in
// the `checkout` Edge Function, which is not part of this repository).
// Scenarios here focus on plans/billing not already covered in
// src/tests/services/checkout.test.ts.

describe('Checkout — Stripe (per-plan scenarios)', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    originalLocation = window.location;
    // @ts-expect-error - replacing with a controllable object (avoids real navigation in jsdom)
    delete window.location;
    window.location = { href: '' } as any;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('creates a Practice monthly checkout with the correct user data', async () => {
    const auth = { user: { id: 'user-practice', email: 'practice@example.com' } };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_practice' }),
    } as any);

    await checkout(auth, 'monthly');

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse(options!.body as string)).toEqual({
      email: 'practice@example.com',
      userId: 'user-practice',
      planType: 'monthly',
    });
    expect(window.location.href).toBe('https://checkout.stripe.com/pay/cs_practice');
  });

  it('creates a Fluent yearly checkout with the correct user data', async () => {
    const auth = { user: { id: 'user-fluent', email: 'fluent@example.com' } };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_fluent' }),
    } as any);

    await checkout(auth, 'yearly');

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse(options!.body as string).planType).toBe('yearly');
    expect(window.location.href).toBe('https://checkout.stripe.com/pay/cs_fluent');
  });

  it('real behavior: a non-ok HTTP response neither throws nor redirects (silent failure)', async () => {
    const auth = { user: { id: 'user-1', email: 'user@example.com' } };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Payment failed' }),
    } as any);

    await expect(checkout(auth, 'monthly')).resolves.toBeUndefined();
    expect(window.location.href).toBe('');
  });
});
