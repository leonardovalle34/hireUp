<script lang="ts">
  export default {
    name: 'PricingView',
  };
</script>

<script lang="ts" setup>
  import BaseCard from '@/components/UI/BaseCard.vue';
  import { plans } from '@/Plans/Plans';
  import { useAuthStore } from '@/stores/auth';
  import { checkout } from '@/services/checkout';

  const auth = useAuthStore();

  const handleUpgrade = async (plan: string) => {
    await checkout(auth, plan as 'monthly' | 'yearly');
  };
</script>

<template>
  <div class="pricing">
    <h1>Planos</h1>

    <div class="pricing-box">
      <BaseCard v-for="plan in plans" :key="plan.name" :title="plan.name">
        <h2>{{ plan.price }}</h2>

        <ul>
          <li v-for="f in plan.features" :key="f">
            {{ f }}
          </li>
        </ul>

        <a-button type="primary" block @click="handleUpgrade(plan.type)">
          Choose Plan
        </a-button>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
  .pricing {
    max-width: 1000px;
    margin: auto;
    padding: 40px;
  }

  .pricing-box {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h1 {
    text-align: center;
    margin-bottom: 40px;
  }
</style>
