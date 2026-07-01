import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Loading from '@/components/Loading/Loading.vue';

describe('Loading', () => {
  it('renders the overlay with the spinner', () => {
    const wrapper = mount(Loading);

    expect(wrapper.find('.overlay').exists()).toBe(true);
    expect(wrapper.find('.spinner').exists()).toBe(true);
  });
});
