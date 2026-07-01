import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkCanStartInterview } from '@/services/interview';
import { useInterviewStore } from '@/stores/interview';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { supabase } from '@/lib/supabase';

// The per-plan interview limit is NOT implemented in this repository's
// source code — the real check happens entirely on the server, via the
// Postgres RPC `can_user_take_lesson` (not versioned under
// supabase/migrations). So, unlike the original spec (which assumed fixed
// numbers like free=1/practice=1/fluent=3), these tests validate the real
// CONTRACT between the frontend and that RPC: how the app calls the RPC and
// how it reacts to the boolean result it returns.

describe('Interview — Session limit (contract with the can_user_take_lesson RPC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createTestingPinia({ stubActions: false }));
  });

  describe('checkCanStartInterview (service)', () => {
    it('queries the RPC with the correct userId and returns true when allowed', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const result = await checkCanStartInterview('user-1');

      expect(result).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('can_user_take_lesson', { uid: 'user-1' });
    });

    it('returns false when the RPC indicates the plan limit was reached', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null } as any);

      const result = await checkCanStartInterview('user-1');

      expect(result).toBe(false);
    });

    it('throws an error when the RPC fails', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Erro na RPC' },
      } as any);

      await expect(checkCanStartInterview('user-1')).rejects.toThrow('Erro na RPC');
    });
  });

  describe('useInterviewStore.canStart (store)', () => {
    it('propagates the RPC result through the store', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const store = useInterviewStore();
      const result = await store.canStart('user-1');

      expect(result).toBe(true);
      expect(store.error).toBeNull();
    });

    it('records the error in the store and returns false when the RPC fails, without crashing the app', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Erro na RPC' },
      } as any);

      const store = useInterviewStore();
      const result = await store.canStart('user-1');

      expect(result).toBe(false);
      expect(store.error).toBe('Erro na RPC');
    });
  });
});
