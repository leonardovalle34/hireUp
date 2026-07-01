import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkout } from '@/services/checkout';

const mockAuth = { user: { id: 'user-1', email: 'user@example.com' } };

describe('checkout service', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // window.location.href can't be assigned directly in jsdom
    // (triggers real navigation), so we replace it with a controllable object.
    originalLocation = window.location;
    // @ts-expect-error - removing to allow replacement
    delete window.location;
    window.location = { href: '' } as any;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('builds the request with the correct email, userId and planType', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test_123' }),
    } as any);

    await checkout(mockAuth, 'yearly');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/checkout',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          userId: 'user-1',
          planType: 'yearly',
        }),
      },
    );
  });

  it('uses "monthly" as the default planType when not provided', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test_123' }),
    } as any);

    await checkout(mockAuth);

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(JSON.parse(options!.body as string).planType).toBe('monthly');
  });

  it('redirects window.location.href when the response contains a url', async () => {
    const stripeUrl = 'https://checkout.stripe.com/pay/cs_test_abc';
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ url: stripeUrl }),
    } as any);

    await checkout(mockAuth, 'monthly');

    expect(window.location.href).toBe(stripeUrl);
  });

  it('does NOT redirect when the response has no url', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    } as any);

    await checkout(mockAuth, 'monthly');

    expect(window.location.href).toBe('');
  });
});
