import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getVideos } from '@/services/videos'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }
}))

const mockVideos = [
  {
    id: '1',
    youtube_id: 'abc123',
    title: 'Lions 101 | Nat Geo Wild',
    description: 'Learn about lions',
    thumbnail_url: 'https://img.youtube.com/abc123.jpg',
    duration: '4:32',
    duration_seconds: 272,
    level: 'intermediate',
    category: 'animals',
    playlist: 'NatGeo 101',
    published_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    youtube_id: 'def456',
    title: 'Black Holes 101',
    description: 'Learn about black holes',
    thumbnail_url: 'https://img.youtube.com/def456.jpg',
    duration: '5:10',
    duration_seconds: 310,
    level: 'advanced',
    category: 'space',
    playlist: 'NatGeo 101',
    published_at: '2023-02-01T00:00:00Z',
  },
]

describe('Videos Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getVideos', () => {
    it('returns all videos when no filters are provided', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockVideos, error: null })
        })
      } as any)

      const result = await getVideos()

      expect(result).toHaveLength(2)
      expect(supabase.from).toHaveBeenCalledWith('video_lessons')
    })

    it('filters by level when level filter is provided', async () => {
      const filteredMock = [mockVideos[1]]
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: filteredMock, error: null })
          })
        })
      } as any)

      const result = await getVideos({ level: 'advanced' })

      expect(result).toHaveLength(1)
      expect(result[0].level).toBe('advanced')
    })

    it('filters by category when category filter is provided', async () => {
      const filteredMock = [mockVideos[0]]
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: filteredMock, error: null })
          })
        })
      } as any)

      const result = await getVideos({ category: 'animals' })

      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('animals')
    })

    it('does NOT apply level filter when level is all', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockVideos, error: null })
        })
      } as any)

      const result = await getVideos({ level: 'all' })

      expect(result).toHaveLength(2)
    })

    it('does NOT apply category filter when category is all', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockVideos, error: null })
        })
      } as any)

      const result = await getVideos({ category: 'all' })

      expect(result).toHaveLength(2)
    })

    it('throws error when Supabase returns error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
        })
      } as any)

      await expect(getVideos()).rejects.toThrow('DB error')
    })

    it('returns empty array when no videos exist', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      } as any)

      const result = await getVideos()

      expect(result).toEqual([])
    })

    it('returns videos ordered by published_at descending', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockVideos, error: null })
        })
      } as any)

      await getVideos()

      const orderCall = vi.mocked(supabase.from).mock.results[0].value.select().order
      expect(orderCall).toHaveBeenCalledWith('published_at', { ascending: false })
    })
  })
})
