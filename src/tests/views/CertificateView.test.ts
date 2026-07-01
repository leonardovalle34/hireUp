import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import CertificateView from '@/views/CertificateView.vue';
import { downloadCertificate, generateCertificate } from '@/utils/certificate';

vi.mock('@/utils/certificate', () => ({
  downloadCertificate: vi.fn(),
  generateCertificate: vi.fn(),
}));

const mockDashboardUser = ref<any>(null);
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ dashboardUser: mockDashboardUser }),
}));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/badges', component: { template: '<div />' } },
    ],
  });
}

async function mountCertificateView() {
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(CertificateView, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('CertificateView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardUser.value = null;
    vi.mocked(generateCertificate).mockReturnValue({
      output: vi.fn().mockReturnValue('data:application/pdf;base64,FAKE'),
    } as any);
  });

  it('generates the certificate preview with the user name on mount', async () => {
    mockDashboardUser.value = { name: 'Fulano de Tal' };
    const { wrapper } = await mountCertificateView();

    expect(generateCertificate).toHaveBeenCalledWith('Fulano de Tal', expect.any(String));
    expect(wrapper.find('.preview-frame').attributes('src')).toBe('data:application/pdf;base64,FAKE');
  });

  it('uses "Aluno HireUp" as a fallback when the profile has no name', async () => {
    mockDashboardUser.value = {};
    await mountCertificateView();

    expect(generateCertificate).toHaveBeenCalledWith('Aluno HireUp', expect.any(String));
  });

  it('downloads the certificate with the correct name when clicking the button', async () => {
    mockDashboardUser.value = { name: 'Fulano de Tal' };
    const { wrapper } = await mountCertificateView();

    await wrapper.find('.btn-blue').trigger('click');

    expect(downloadCertificate).toHaveBeenCalledWith('Fulano de Tal');
  });

  it('goes back to /badges when clicking "Voltar às Conquistas"', async () => {
    const { wrapper, router } = await mountCertificateView();

    await wrapper.find('.btn-ghost').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/badges');
  });
});
