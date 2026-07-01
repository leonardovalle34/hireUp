import { describe, it, expect } from 'vitest';
import Antd from 'ant-design-vue';
import { mount } from '@vue/test-utils';
import AlertComponent from '@/components/AlertComponent/AlertComponent.vue';

describe('AlertComponent', () => {
  it('renders the given message and type', () => {
    const wrapper = mount(AlertComponent, {
      props: { message: 'Algo deu errado', type: 'error' },
      global: { plugins: [Antd] },
    });

    expect(wrapper.text()).toContain('Algo deu errado');
    expect(wrapper.find('.ant-alert-error').exists()).toBe(true);
  });

  it('renders as success when type="success"', () => {
    const wrapper = mount(AlertComponent, {
      props: { message: 'Salvo com sucesso', type: 'success' },
      global: { plugins: [Antd] },
    });

    expect(wrapper.find('.ant-alert-success').exists()).toBe(true);
  });
});
