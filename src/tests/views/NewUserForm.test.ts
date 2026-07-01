import { describe, it, expect, vi, beforeEach } from 'vitest';
import Antd from 'ant-design-vue';
import { mount, flushPromises } from '@vue/test-utils';
import NewUserForm from '@/views/NewUserForm.vue';

const { mockRouterPush } = vi.hoisted(() => ({ mockRouterPush: vi.fn() }));
vi.mock('@/router', () => ({ default: { push: mockRouterPush } }));

const mockRegister = vi.fn();
const mockAuthState: any = { loading: false, error: '', register: mockRegister };
vi.mock('@/stores/auth', () => ({ useAuthStore: () => mockAuthState }));

async function fillForm(wrapper: any, { name = '', email = '', password = '', confirmPassword = '' }) {
  const inputs = wrapper.findAll('input');
  await inputs[0].setValue(name);
  await inputs[1].setValue(email);
  await inputs[2].setValue(password);
  await inputs[3].setValue(confirmPassword);
}

describe('NewUserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.error = '';
  });

  it('validates that the name is required', async () => {
    const wrapper = mount(NewUserForm, { global: { plugins: [Antd] } });

    await fillForm(wrapper, { email: 'a@b.com', password: '123456', confirmPassword: '123456' });
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Nome é obrigatório');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates that the email is required', async () => {
    const wrapper = mount(NewUserForm, { global: { plugins: [Antd] } });

    await fillForm(wrapper, { name: 'Fulano', password: '123456', confirmPassword: '123456' });
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Email é obrigatório');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates that the password is required', async () => {
    const wrapper = mount(NewUserForm, { global: { plugins: [Antd] } });

    await fillForm(wrapper, { name: 'Fulano', email: 'a@b.com' });
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Senha é obrigatória');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('validates that the passwords must match', async () => {
    const wrapper = mount(NewUserForm, { global: { plugins: [Antd] } });

    await fillForm(wrapper, { name: 'Fulano', email: 'a@b.com', password: '123456', confirmPassword: 'diferente' });
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('As senhas não coincidem');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('registers the user and navigates to / on success', async () => {
    mockRegister.mockImplementation(async () => {
      mockAuthState.error = '';
    });
    const wrapper = mount(NewUserForm, { global: { plugins: [Antd] } });

    await fillForm(wrapper, { name: 'Fulano', email: 'a@b.com', password: '123456', confirmPassword: '123456' });
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(mockRegister).toHaveBeenCalledWith('a@b.com', '123456', 'Fulano');
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });

  it('shows the server error when registration fails (e.g. email already registered)', async () => {
    mockRegister.mockImplementation(async () => {
      mockAuthState.error = 'E-mail já cadastrado';
    });
    const wrapper = mount(NewUserForm, { global: { plugins: [Antd] } });

    await fillForm(wrapper, { name: 'Fulano', email: 'dup@b.com', password: '123456', confirmPassword: '123456' });
    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('E-mail já cadastrado');
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
