import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import NavMenu from '@/components/NavMenu/NavMenu.vue';

const items = [
  { path: '/', label: 'Início' },
  { path: '/interview', label: 'Treino' },
  { path: '/tutor', label: 'Tutor' },
  { path: '/lessons', label: 'Aulas' },
  { path: '/quiz', label: 'Quiz' },
  { path: '/news', label: 'Notícias' },
  { path: '/pricing', label: 'Planos' },
];

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: items.map((item) => ({ path: item.path, component: { template: '<div />' } })),
  });
}

async function mountNavMenu() {
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(NavMenu, { global: { plugins: [router] } });
  return { wrapper, router };
}

describe('NavMenu', () => {
  it('renders all menu items with their icons', async () => {
    const { wrapper } = await mountNavMenu();

    const navItems = wrapper.findAll('.nav-item');
    const icons = wrapper.findAll('.nav-icon');

    expect(navItems).toHaveLength(items.length);
    expect(icons).toHaveLength(items.length);
    items.forEach((item) => {
      expect(wrapper.text()).toContain(item.label);
    });
  });

  it('marks only the current route item as active', async () => {
    const { wrapper, router } = await mountNavMenu();
    await router.push('/quiz');
    await wrapper.vm.$nextTick();

    const activeItems = wrapper.findAll('.nav-item--active');
    expect(activeItems).toHaveLength(1);
    expect(activeItems[0].text()).toContain('Quiz');
  });

  it.each(items)('clicking item "$label" navigates to route $path', async ({ path, label }) => {
    const { wrapper, router } = await mountNavMenu();

    const link = wrapper.findAll('.nav-item').find((item) => item.text().includes(label));
    expect(link).toBeTruthy();

    await link!.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe(path);
  });
});
