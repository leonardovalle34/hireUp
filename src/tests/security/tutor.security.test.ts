import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTutorMessage } from '@/services/tutor';
import { supabase } from '@/lib/supabase';

// These tests validate the REAL contract of the `tutor` Edge Function
// (supabase/functions/tutor/index.ts), exercising the real client
// (src/services/tutor.ts) against mocked HTTP responses that reproduce
// exactly the status/messages the function returns today.
//
// Note: there is NO check anywhere in the repository for an
// "API key with fewer than 20 characters" — so that scenario from the
// original spec was removed instead of testing fictitious behavior.

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

function mockAuthenticatedSession() {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: { access_token: 'valid-token' } },
  } as any);
}

describe('Tutor — Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('blocks a Free user from accessing the tutor (real 403 from the edge function)', async () => {
    mockAuthenticatedSession();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({
        error: 'O Tutor de IA está disponível nos planos Practice e Fluent.',
      }),
    } as any);

    await expect(sendTutorMessage(new FormData())).rejects.toThrow('Practice e Fluent');
  });

  it('blocks a custom model without a valid API key (real 403 from the edge function)', async () => {
    mockAuthenticatedSession();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({
        error:
          'Você selecionou um modelo externo mas não adicionou uma API key. Adicione em Configurações → API Key própria.',
      }),
    } as any);

    const form = new FormData();
    form.append('userModel', 'gpt-4o-mini'); // model != DEFAULT_MODEL, no userApiKey

    await expect(sendTutorMessage(form)).rejects.toThrow('API key');
  });

  it('blocks locally before even calling the edge function when there is no authenticated session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as any);

    await expect(sendTutorMessage(new FormData())).rejects.toThrow('Não autenticado');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('propagates the 401 error returned by the edge function when the token is invalid', async () => {
    mockAuthenticatedSession();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ error: 'Unauthorized' }),
    } as any);

    await expect(sendTutorMessage(new FormData())).rejects.toThrow('Unauthorized');
  });
});
