import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import NewsView from '@/views/NewsView.vue';
import { getNews } from '@/services/news';

vi.mock('@/services/news', () => ({ getNews: vi.fn() }));

const mockArticles = [
  { id: '1', title: 'Tech News', summary: 'Resumo 1', url: 'https://a.com/1', image_url: null, source: 'A', category: 'business', published_at: '2026-06-30T12:00:00Z' },
  { id: '2', title: 'World News', summary: 'Resumo 2', url: 'https://a.com/2', image_url: 'https://a.com/img.png', source: 'B', category: 'Business ', published_at: '2026-06-29T12:00:00Z' },
  { id: '3', title: 'Tech Update', summary: '', url: 'https://a.com/3', image_url: null, source: 'C', category: 'technology', published_at: '2026-06-28T12:00:00Z' },
];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/tutor', component: { template: '<div />' } },
    ],
  });
}

async function mountNewsView() {
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(NewsView, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('NewsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getNews).mockResolvedValue(mockArticles as any);
  });

  it('loads news on mount and renders the list', async () => {
    const { wrapper } = await mountNewsView();

    expect(getNews).toHaveBeenCalled();
    expect(wrapper.findAll('.news-card')).toHaveLength(3);
  });

  it('deduplicates categories with case/whitespace variation (normalizeCategory)', async () => {
    const { wrapper } = await mountNewsView();

    const filterLabels = wrapper.findAll('.filter-btn').map((b) => b.text());
    // "business" and "Business " (with whitespace/uppercase) collapse into one
    expect(filterLabels).toEqual(['Todas', 'business', 'technology']);
  });

  it('filters news when clicking a category', async () => {
    const { wrapper } = await mountNewsView();

    const businessFilter = wrapper.findAll('.filter-btn').find((b) => b.text() === 'business')!;
    await businessFilter.trigger('click');

    expect(wrapper.findAll('.news-card')).toHaveLength(2);
  });

  it('opens the article in a new tab when clicking "Ler artigo"', async () => {
    const { wrapper } = await mountNewsView();

    await wrapper.findAll('.btn-read')[0].trigger('click');

    expect(window.open).toHaveBeenCalledWith('https://a.com/1', '_blank');
  });

  it('saves the topic to localStorage and navigates to /tutor via "Praticar com Tutor"', async () => {
    const { wrapper, router } = await mountNewsView();

    await wrapper.findAll('.btn-practice')[0].trigger('click');
    await flushPromises();

    expect(localStorage.getItem('tutorTopic')).toBe('Discuss this news topic: "Tech News"');
    expect(router.currentRoute.value.path).toBe('/tutor');
  });

  it('handles a loading error without breaking the screen (empty list)', async () => {
    vi.mocked(getNews).mockRejectedValue(new Error('Falha na rede'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { wrapper } = await mountNewsView();

    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.findAll('.news-card')).toHaveLength(0);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
