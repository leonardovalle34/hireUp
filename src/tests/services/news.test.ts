import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNews } from '@/services/news';
import { supabase } from '@/lib/supabase';

describe('news service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns articles ordered by published_at DESC', async () => {
    const mockArticles = [
      { id: '1', title: 'Notícia A', published_at: '2026-06-30' },
      { id: '2', title: 'Notícia B', published_at: '2026-06-29' },
    ];
    const limitMock = vi.fn().mockResolvedValue({ data: mockArticles, error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ order: orderMock }),
    } as any);

    const result = await getNews();

    expect(result).toEqual(mockArticles);
    expect(supabase.from).toHaveBeenCalledWith('news_articles');
    expect(orderMock).toHaveBeenCalledWith('published_at', { ascending: false });
  });

  it('applies the given limit', async () => {
    const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({ limit: limitMock }),
      }),
    } as any);

    await getNews(5);

    expect(limitMock).toHaveBeenCalledWith(5);
  });

  it('uses 30 as the default limit when not provided', async () => {
    const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({ limit: limitMock }),
      }),
    } as any);

    await getNews();

    expect(limitMock).toHaveBeenCalledWith(30);
  });

  it('returns an empty array when data is null', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    } as any);

    const result = await getNews();

    expect(result).toEqual([]);
  });

  it('throws an error when Supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      }),
    } as any);

    await expect(getNews()).rejects.toThrow('DB error');
  });
});
