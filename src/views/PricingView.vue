<script lang="ts">
export default {
  name: 'PricingView',
}
</script>
<script lang="ts" setup>
import { plans } from '@/Plans/Plans'
</script>
<template>
  <div class="pricing">
    <h1>Pricing</h1>

    <a-row :gutter="16">
      <a-col v-for="plan in plans" :key="plan.name" :span="8">
        <a-card :title="plan.name">
          <h2>R$ {{ plan.price }}</h2>

          <ul>
            <li v-for="f in plan.features" :key="f">
              {{ f }}
            </li>
          </ul>

          <a-button type="primary" block> Choose Plan </a-button>
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
}

h1 {
  text-align: center;
  margin-bottom: 40px;
}
</style>
