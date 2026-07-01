import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import Antd from 'ant-design-vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import { signInWithGoogle } from '@/services/auth';

vi.mock('@/services/auth', () => ({ signInWithGoogle: vi.fn() }));

const mockLoading = ref(false);
const mockError = ref('');
const mockLogin = vi.fn();
// Real Pinia's `storeToRefs` does a `for...in` over every ENUMERABLE key of
// the object and reads `value.effect` on each — if any is null/undefined
// that throws ("Cannot read properties of null"). Since LoginView reads
// `auth.user` directly (not via storeToRefs), we define `user` as a
// non-enumerable property so Pinia's `for...in` skips it.
const mockAuthState: any = { loading: mockLoading, error: mockError, login: mockLogin };
Object.defineProperty(mockAuthState, 'user', {
  value: null,
  writable: true,
  enumerable: false,
  configurable: true,
});
vi.mock('@/stores/auth', () => ({ useAuthStore: () => mockAuthState }));

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/signup', component: { template: '<div />' } },
    ],
  });
}

async function mountLoginView() {
  const router = createTestRouter();
  router.push('/');
  await router.isReady();
  const wrapper = mount(LoginView, { global: { plugins: [router, Antd] } });
  return { wrapper, router };
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading.value = false;
    mockError.value = '';
    mockAuthState.user = null;
  });

  it('logs in with email/password and navigates to / on success', async () => {
    mockLogin.mockImplementation(async () => {
      mockAuthState.user = { id: 'user-1' };
    });
    const { wrapper, router } = await mountLoginView();

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('a@b.com');
    await inputs[1].setValue('123456');
    await wrapper.find('button').trigger('click'); // Login (first button)
    await flushPromises();

    expect(mockLogin).toHaveBeenCalledWith('a@b.com', '123456');
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('shows an error alert when the login fails', async () => {
    mockLogin.mockImplementation(async () => {
      mockError.value = 'Credenciais inválidas';
    });
    const { wrapper, router } = await mountLoginView();

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Credenciais inválidas');
    expect(router.currentRoute.value.path).toBe('/'); // does not navigate on error
  });

  it('Google login calls signInWithGoogle', async () => {
    vi.mocked(signInWithGoogle).mockResolvedValue(undefined);
    const { wrapper } = await mountLoginView();

    const googleButton = wrapper.findAll('button').find((b) => b.text().includes('Google'))!;
    await googleButton.trigger('click');
    await flushPromises();

    expect(signInWithGoogle).toHaveBeenCalled();
  });

  it('shows an error when Google login fails', async () => {
    vi.mocked(signInWithGoogle).mockRejectedValue(new Error('OAuth cancelado'));
    const { wrapper } = await mountLoginView();

    const googleButton = wrapper.findAll('button').find((b) => b.text().includes('Google'))!;
    await googleButton.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('OAuth cancelado');
  });

  it('navigates to /signup when clicking "Criar uma conta"', async () => {
    const { wrapper, router } = await mountLoginView();

    const signupButton = wrapper.findAll('button').find((b) => b.text().includes('Criar uma conta'))!;
    await signupButton.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/signup');
  });
});
