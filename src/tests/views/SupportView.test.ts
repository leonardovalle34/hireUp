import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SupportView from '@/views/SupportView.vue';

describe('SupportView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the 5 frequently asked questions', () => {
    const wrapper = mount(SupportView);

    expect(wrapper.findAll('.faq-item')).toHaveLength(5);
  });

  it('expands the answer when clicking a question and collapses it on a second click', async () => {
    const wrapper = mount(SupportView);

    const firstQuestion = wrapper.findAll('.faq-question')[0];
    expect(wrapper.findAll('.faq-answer')).toHaveLength(0);

    await firstQuestion.trigger('click');
    expect(wrapper.findAll('.faq-answer')).toHaveLength(1);
    expect(wrapper.findAll('.faq-item')[0].classes()).toContain('active');

    await firstQuestion.trigger('click');
    expect(wrapper.findAll('.faq-answer')).toHaveLength(0);
  });

  it('shows only one expanded answer at a time', async () => {
    const wrapper = mount(SupportView);
    const questions = wrapper.findAll('.faq-question');

    await questions[0].trigger('click');
    await questions[1].trigger('click');

    expect(wrapper.findAll('.faq-answer')).toHaveLength(1);
    expect(wrapper.findAll('.faq-item')[1].classes()).toContain('active');
  });

  it('opens WhatsApp with the correct number when clicking "Falar agora"', async () => {
    const wrapper = mount(SupportView);

    await wrapper.find('.btn-whatsapp').trigger('click');

    expect(window.open).toHaveBeenCalledWith('https://wa.me/5547997537883', '_blank');
  });
});
