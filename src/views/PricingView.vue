<script lang="ts">
  export default { name: 'PricingView' };
</script>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { storeToRefs } from 'pinia';
  import { checkout } from '@/services/checkout';
  import { plans } from '@/Plans/Plans';

  const auth = useAuthStore();
  const { dashboardUser } = storeToRefs(auth);
  const billing = ref<'monthly' | 'yearly'>('monthly');

  const getType = (plan: any) => {
    if (plan.type === 'free') return 'free';
    return billing.value === 'monthly' ? plan.type.monthly : plan.type.yearly;
  };

  const getPrice = (plan: any) => {
    if (plan.type === 'free') return plan.price.monthly;
    return billing.value === 'monthly' ? plan.price.monthly : plan.price.yearly;
  };

  const getPriceDetail = (plan: any) => {
    if (plan.type === 'free') return plan.priceDetail;
    return billing.value === 'monthly'
      ? plan.priceDetail.monthly
      : plan.priceDetail.yearly;
  };

  const isCurrentPlan = (plan: any) => {
    const userPlan = dashboardUser.value?.plan;
    if (plan.type === 'free' && (!userPlan || userPlan === 'free')) return true;
    if (typeof plan.type === 'object') {
      if (plan.name === 'Practice' && userPlan === 'practice') return true;
      if (
        plan.name === 'Fluent' &&
        (userPlan === 'fluent' || userPlan === 'pro')
      )
        return true;
    }
    return false;
  };

  const handleUpgrade = async (plan: any) => {
    const type = getType(plan);
    if (type === 'free') return;
    await checkout(auth, type as any);
  };
</script>

<template>
  <div class="pricing-container">
    <div class="pricing-header">
      <h1>Escolha seu plano</h1>
      <p>Invista na sua fluência em inglês</p>
    </div>

    <!-- Toggle mensal/anual -->
    <div class="billing-toggle">
      <button
        class="toggle-btn"
        :class="{ active: billing === 'monthly' }"
        @click="billing = 'monthly'"
      >
        Mensal
      </button>
      <button
        class="toggle-btn"
        :class="{ active: billing === 'yearly' }"
        @click="billing = 'yearly'"
      >
        Anual <span class="save-badge">-17%</span>
      </button>
    </div>

    <div class="plans-grid">
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="plan-card"
        :class="{ highlighted: plan.highlight }"
      >
        <div v-if="plan.highlight" class="badge">Mais popular</div>

        <div class="plan-header">
          <h2 class="plan-name" :style="{ color: plan.color }">
            {{ plan.name }}
          </h2>
          <div class="plan-price">
            <span class="price">{{ getPrice(plan) }}</span>
            <span class="price-detail">{{ getPriceDetail(plan) }}</span>
          </div>
        </div>

        <ul class="features">
          <li v-for="f in plan.features" :key="f">
            <span class="check" :style="{ color: plan.color }">✓</span>
            {{ f }}
          </li>
        </ul>

        <button
          class="btn-plan"
          :style="{
            background: isCurrentPlan(plan) ? '#e5e7eb' : plan.color,
            color: isCurrentPlan(plan) ? '#9ca3af' : 'white',
          }"
          :disabled="isCurrentPlan(plan)"
          @click="handleUpgrade(plan)"
        >
          {{ isCurrentPlan(plan) ? 'Plano atual' : plan.cta }}
        </button>
      </div>
    </div>

    <p class="disclaimer">
      Pagamentos processados com segurança pelo Stripe. Cancele quando quiser.
    </p>
  </div>
</template>

<style scoped>
  .pricing-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 20px 80px;
  }
  .pricing-header {
    text-align: center;
    margin-bottom: 24px;
  }
  .pricing-header h1 {
    font-size: 24px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
  }
  .pricing-header p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }

  .billing-toggle {
    display: flex;
    justify-content: center;
    gap: 4px;
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 4px;
    width: fit-content;
    margin: 0 auto 32px;
  }
  .toggle-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    background: transparent;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }
  .toggle-btn.active {
    background: var(--card-bg);
    color: var(--text-primary);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
  .save-badge {
    background: #d1fae5;
    color: #065f46;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .plans-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  @media (min-width: 768px) {
    .plans-grid {
      flex-direction: row;
      align-items: flex-start;
    }
  }
  .plan-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--card-shadow);
    flex: 1;
    position: relative;
    border: 2px solid transparent;
  }
  .plan-card.highlighted {
    border-color: var(--success);
    box-shadow: 0 4px 20px rgba(5, 150, 105, 0.15);
  }
  .badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--success);
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 14px;
    border-radius: 20px;
    white-space: nowrap;
  }
  .plan-header {
    margin-bottom: 20px;
  }
  .plan-name {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .plan-price {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
  }
  .price {
    font-size: 32px;
    font-weight: 800;
    color: var(--text-primary);
  }
  .price-detail {
    font-size: 12px;
    color: var(--text-tertiary);
  }
  .features {
    list-style: none;
    padding: 0;
    margin: 0 0 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .features li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  .check {
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .btn-plan {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .btn-plan:hover:not(:disabled) {
    opacity: 0.9;
  }
  .btn-plan:disabled {
    cursor: not-allowed;
  }
  .disclaimer {
    text-align: center;
    font-size: 12px;
    color: var(--text-tertiary);
    margin-top: 24px;
  }
</style>
