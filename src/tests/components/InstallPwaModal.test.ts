import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import InstallPwaModal from '@/components/InstallPwaModal/InstallPwaModal.vue';

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
}

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';

describe('InstallPwaModal', () => {
  const originalUA = window.navigator.userAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.matchMedia).mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as any);
  });

  afterEach(() => {
    setUserAgent(originalUA);
  });

  it('does NOT show the modal on desktop', async () => {
    setUserAgent(DESKTOP_UA);
    const wrapper = mount(InstallPwaModal);
    await flushPromises();

    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('shows the modal with instructions for iOS', async () => {
    setUserAgent(IOS_UA);
    const wrapper = mount(InstallPwaModal);
    await flushPromises();

    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.text()).toContain('No iPhone:');
    expect(wrapper.text()).toContain('Adicionar à Tela de Início');
  });

  it('shows the modal with instructions for Android', async () => {
    setUserAgent(ANDROID_UA);
    const wrapper = mount(InstallPwaModal);
    await flushPromises();

    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.text()).toContain('No Android:');
    expect(wrapper.text()).toContain('Adicionar à tela inicial');
  });

  it('does NOT show the modal when already in standalone mode (installed)', async () => {
    setUserAgent(IOS_UA);
    vi.mocked(global.matchMedia).mockReturnValue({ matches: true } as any);

    const wrapper = mount(InstallPwaModal);
    await flushPromises();

    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('closes the modal when clicking the close button', async () => {
    setUserAgent(ANDROID_UA);
    const wrapper = mount(InstallPwaModal);
    await flushPromises();

    await wrapper.find('.close-btn').trigger('click');

    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('closes the modal when clicking "Entendi, continuar no navegador"', async () => {
    setUserAgent(IOS_UA);
    const wrapper = mount(InstallPwaModal);
    await flushPromises();

    await wrapper.find('.btn-close').trigger('click');

    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });
});
