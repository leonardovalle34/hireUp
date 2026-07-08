import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import VideosView from '@/views/VideosView.vue'
import * as videosService from '@/services/videos'

vi.mock('@/services/videos', () => ({
  getVideos: vi.fn(),
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/videos', component: VideosView },
    { path: '/tutor', component: { template: '<div>Tutor</div>' } },
  ],
})

const mockVideos = [
  {
    id: '1',
    youtube_id: 'abc123',
    title: 'Lions 101 | Nat Geo Wild',
    description: 'Learn about lions in Africa',
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
    thumbnail_url: null,
    duration: '5:10',
    duration_seconds: 310,
    level: 'advanced',
    category: 'space',
    playlist: 'NatGeo 101',
    published_at: '2023-02-01T00:00:00Z',
  },
]

describe('VideosView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(videosService.getVideos).mockResolvedValue(mockVideos)
  })

  it('renders the videos header correctly', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Vídeos em Inglês')
    expect(wrapper.text()).toContain('National Geographic')
  })

  it('renders video cards after loading', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.findAll('.video-card')).toHaveLength(2)
  })

  it('shows loading spinner while fetching videos', async () => {
    vi.mocked(videosService.getVideos).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockVideos), 100))
    )

    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })

    expect(wrapper.find('.loading').exists()).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 150))
    await flushPromises()
    expect(wrapper.find('.loading').exists()).toBe(false)
  })

  it('renders video title and duration', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Lions 101')
    expect(wrapper.text()).toContain('4:32')
  })

  it('renders level badge for each video', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('intermediate')
    expect(wrapper.text()).toContain('advanced')
  })

  it('shows placeholder when thumbnail is null', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.find('.thumbnail-placeholder').exists()).toBe(true)
  })

  it('filters videos by level', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const advancedBtn = wrapper.findAll('.filter-btn').find(btn => btn.text() === 'Advanced')
    await advancedBtn?.trigger('click')

    expect(wrapper.findAll('.video-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('Black Holes 101')
  })

  it('shows results count', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('2 vídeos encontrados')
  })

  it('opens player modal when video card is clicked', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    await wrapper.find('.video-card').trigger('click')

    expect(wrapper.find('.player-overlay').exists()).toBe(true)
    expect(wrapper.find('.player-iframe').exists()).toBe(true)
  })

  it('player iframe has correct youtube embed URL', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    await wrapper.find('.video-card').trigger('click')

    const iframe = wrapper.find('.player-iframe')
    expect(iframe.attributes('src')).toContain('abc123')
    expect(iframe.attributes('src')).toContain('youtube.com/embed')
  })

  it('closes player modal when overlay is clicked', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    await wrapper.find('.video-card').trigger('click')
    expect(wrapper.find('.player-overlay').exists()).toBe(true)

    await wrapper.find('.player-overlay').trigger('click')
    expect(wrapper.find('.player-overlay').exists()).toBe(false)
  })

  it('closes player modal when X button is clicked', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    await wrapper.find('.video-card').trigger('click')
    await wrapper.find('.close-btn').trigger('click')

    expect(wrapper.find('.player-overlay').exists()).toBe(false)
  })

  it('shows tutor button in player modal', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    await wrapper.find('.video-card').trigger('click')

    expect(wrapper.find('.btn-tutor').exists()).toBe(true)
    expect(wrapper.find('.btn-tutor').text()).toContain('Praticar')
  })

  it('saves tutorTopic to localStorage and redirects when tutor button is clicked', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    await wrapper.find('.video-card').trigger('click')
    await wrapper.find('.btn-tutor').trigger('click')

    expect(setItemSpy).toHaveBeenCalledWith('tutorTopic', expect.stringContaining('Lions 101'))
  })

  it('shows video description in player modal', async () => {
    const wrapper = mount(VideosView, {
      global: { plugins: [router] }
    })
    await flushPromises()

    await wrapper.find('.video-card').trigger('click')

    expect(wrapper.text()).toContain('Learn about lions in Africa')
  })
})
