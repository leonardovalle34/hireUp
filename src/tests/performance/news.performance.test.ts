import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNews } from '@/services/news';
import { supabase } from '@/lib/supabase';

describe('News Feed — Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads 30 articles quickly even at the default max volume', async () => {
    const mockNews = Array.from({ length: 30 }, (_, i) => ({
      id: `${i}`,
      title: `News ${i}`,
      summary: '',
      url: 'https://example.com',
      image_url: null,
      source: 'Test',
      category: 'technology',
      published_at: new Date().toISOString(),
    }));

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: mockNews, error: null }),
        }),
      }),
    } as any);

    const start = performance.now();
    const news = await getNews(30);
    const elapsed = performance.now() - start;

    expect(news).toHaveLength(30);
    expect(elapsed).toBeLessThan(2000);
  });
});
