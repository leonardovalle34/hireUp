<script lang="ts">
  export default {
    name: 'PricingView',
  };
</script>
<script lang="ts" setup>
  import { plans } from '@/Plans/Plans';
  import { useAuthStore } from '@/stores/auth';
  import { checkout } from '@/services/checkout';

  const auth = useAuthStore();

  const handleUpgrade = async () => {
    await checkout(auth);
  };
</script>
<template>
  <div class="pricing">
    <h1>Planos</h1>

    <a-row :gutter="16" class="pricing-box">
      <a-col v-for="plan in plans" :key="plan.name">
        <a-card>
          <template #title>
            <h2>{{ plan.name }}</h2>
          </template>
          <h2>US$ {{ plan.price }}</h2>

          <ul class="features">
            <li v-for="f in plan.features" :key="f" class="list">
              {{ f }}
            </li>
          </ul>

          <a-button
            type="primary"
            block
            @click="handleUpgrade"
            class="checkout-btn"
          >
            Choose Plan
          </a-button>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
  .pricing {
    max-width: 1000px;
    margin: auto;
    padding: 40px;
    gap: 10px;
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
  .checkout-btn {
    margin-top: 30px;
  }

  .list {
    margin: 10px 0;
  }
</style>
