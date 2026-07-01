import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import PricingView from '@/views/PricingView.vue';
import { checkout } from '@/services/checkout';

vi.mock('@/services/checkout', () => ({ checkout: vi.fn() }));

const mockDashboardUser = ref<any>(null);
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ dashboardUser: mockDashboardUser }),
}));

function mountPricingView() {
  return mount(PricingView);
}

describe('PricingView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardUser.value = null;
  });

  it('renders the 3 available plans', () => {
    const wrapper = mountPricingView();

    const names = wrapper.findAll('.plan-name').map((n) => n.text());
    expect(names).toEqual(['Free', 'Practice', 'Fluent']);
  });

  it('switches between monthly and yearly billing, updating the price', async () => {
    const wrapper = mountPricingView();

    const practiceCard = wrapper.findAll('.plan-card')[1];
    expect(practiceCard.find('.price').text()).toBe('R$29');

    const yearlyToggle = wrapper.findAll('.toggle-btn').find((b) => b.text().includes('Anual'))!;
    await yearlyToggle.trigger('click');

    expect(practiceCard.find('.price').text()).toBe('R$290');
  });

  it('marks Free as the current plan when the user has no plan set', () => {
    mockDashboardUser.value = null;
    const wrapper = mountPricingView();

    const freeButton = wrapper.findAll('.btn-plan')[0];
    expect(freeButton.text()).toBe('Plano atual');
    expect(freeButton.attributes('disabled')).toBeDefined();
  });

  it('marks Practice as the current plan and disables the button', () => {
    mockDashboardUser.value = { plan: 'practice' };
    const wrapper = mountPricingView();

    const practiceButton = wrapper.findAll('.btn-plan')[1];
    expect(practiceButton.text()).toBe('Plano atual');
    expect(practiceButton.attributes('disabled')).toBeDefined();
  });

  it('marks Fluent as current for the legacy "pro" plan too', () => {
    mockDashboardUser.value = { plan: 'pro' };
    const wrapper = mountPricingView();

    const fluentButton = wrapper.findAll('.btn-plan')[2];
    expect(fluentButton.text()).toBe('Plano atual');
  });

  it('calls checkout with the correct monthly type when subscribing to Practice', async () => {
    mockDashboardUser.value = { plan: 'free' };
    const wrapper = mountPricingView();

    const practiceButton = wrapper.findAll('.btn-plan')[1];
    expect(practiceButton.text()).toBe('Assinar Practice');
    await practiceButton.trigger('click');

    expect(checkout).toHaveBeenCalledWith(expect.anything(), 'practice_monthly');
  });

  it('calls checkout with the correct yearly type when subscribing to Fluent', async () => {
    mockDashboardUser.value = { plan: 'free' };
    const wrapper = mountPricingView();

    await wrapper.findAll('.toggle-btn').find((b) => b.text().includes('Anual'))!.trigger('click');
    const fluentButton = wrapper.findAll('.btn-plan')[2];
    await fluentButton.trigger('click');

    expect(checkout).toHaveBeenCalledWith(expect.anything(), 'fluent_yearly');
  });

  it('does NOT call checkout when clicking the Free plan button (current plan)', async () => {
    const wrapper = mountPricingView();

    await wrapper.findAll('.btn-plan')[0].trigger('click');

    expect(checkout).not.toHaveBeenCalled();
  });
});
