import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseCard from '@/components/UI/BaseCard.vue';

describe('BaseCard', () => {
  it('renders the slot content', () => {
    const wrapper = mount(BaseCard, {
      slots: { default: '<p>Conteúdo do card</p>' },
    });

    expect(wrapper.text()).toContain('Conteúdo do card');
  });

  it('renders title and subtitle when provided', () => {
    const wrapper = mount(BaseCard, {
      props: { title: 'Meu Título', subtitle: 'Meu Subtítulo' },
    });

    expect(wrapper.find('h2').text()).toBe('Meu Título');
    expect(wrapper.find('.subtitle').text()).toBe('Meu Subtítulo');
  });

  it('does not render the header when there is no title', () => {
    const wrapper = mount(BaseCard);

    expect(wrapper.find('.header').exists()).toBe(false);
  });

  it('applies the "center" class when the center prop is true', () => {
    const wrapper = mount(BaseCard, { props: { center: true } });

    expect(wrapper.classes()).toContain('center');
  });
});
