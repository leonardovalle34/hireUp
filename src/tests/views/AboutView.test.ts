import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AboutView from '@/views/AboutView.vue';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/interview', component: { template: '<div />' } },
    ],
  });
}

async function mountAboutView() {
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(AboutView, { global: { plugins: [router] } });
  return { wrapper, router };
}

describe('AboutView', () => {
  beforeEach(() => {});

  it('renders the 4 institutional cards', async () => {
    const { wrapper } = await mountAboutView();

    expect(wrapper.findAll('.card')).toHaveLength(4);
  });

  it('navigates to /interview when clicking "Iniciar simulação agora"', async () => {
    const { wrapper, router } = await mountAboutView();

    await wrapper.find('.btn-start').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/interview');
  });
});
