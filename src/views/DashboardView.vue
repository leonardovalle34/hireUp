<script lang="ts">
  export default {
    name: 'DashboardView',
  };
</script>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { storeToRefs } from 'pinia';
  import AlertComponent from '@/components/AlertComponent/AlertComponent.vue';
  import BaseCard from '@/components/UI/BaseCard.vue';
  import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

  const auth = useAuthStore();
  const { dashboardUser } = storeToRefs(auth);
  const typeOfQuestion = ref('behavioral');
  const level = ref('junior');
  const showAlert = ref(false);

  const onSubjectChange = (value: string) => {
    typeOfQuestion.value = value;
    localStorage.setItem('subject', value);
  };

  const onLevelChange = (value: string) => {
    level.value = value;
    localStorage.setItem('level', value);
  };

  onMounted(() => {
    auth.fetchUser();
    const storedSubject = localStorage.getItem('subject');
    const storedLevel = localStorage.getItem('level');

    if (dashboardUser.value?.plan === 'free') {
      showAlert.value = true;
      setTimeout(() => {
        showAlert.value = false;
      }, 10000);
    }

    if (storedSubject) {
      typeOfQuestion.value = storedSubject;
    } else {
      localStorage.setItem('subject', typeOfQuestion.value);
    }

    if (storedLevel) {
      level.value = storedLevel;
    } else {
      localStorage.setItem('level', level.value);
    }
  });
</script>

<template>
  <div class="dashboard-container">
    <AlertComponent
      v-if="showAlert"
      :message="'Você está no plano Free. Faça upgrade para liberar todas as lições.'"
      type="info"
      :show-icon="true"
      position="bottom"
    >
      <template #icon>
        <ExclamationCircleOutlined />
      </template>
    </AlertComponent>

    <div class="dashboard-card">
      <div class="header">
        <h1>👋 Olá, {{ dashboardUser?.name || dashboardUser?.email }}</h1>
        <p class="email">{{ dashboardUser?.email }}</p>
      </div>

      <div class="cards">
        <BaseCard>
          <p class="label">Plano</p>
          <h2>{{ dashboardUser?.plan.toUpperCase() }}</h2>
        </BaseCard>

        <BaseCard>
          <p class="label">Membro desde</p>
          <h2>
            {{
              new Date(dashboardUser?.created_at || '').toLocaleDateString(
                'pt-BR',
              )
            }}
          </h2>
        </BaseCard>

        <BaseCard>
          <p class="label">Treinos realizados hoje</p>
          <h2>{{ dashboardUser?.lessons_today || 0 }}</h2>
        </BaseCard>

        <BaseCard>
          <p class="label">Treinos restantes</p>
          <h2>
            {{
              dashboardUser?.remaining === null
                ? 'Ilimitados'
                : dashboardUser?.remaining
            }}
          </h2>
        </BaseCard>

        <BaseCard>
          <p class="label">Tech</p>
          <a-select
            v-model:value="typeOfQuestion"
            @change="onSubjectChange"
            class="select"
            placeholder="Selecione uma tecnologia"
          >
            <a-select-option value="opinion">Opinião</a-select-option>
            <a-select-option value="behavioral">Comportamental</a-select-option>
            <a-select-option value="react">React</a-select-option>
            <a-select-option value="next">Next.js</a-select-option>
            <a-select-option value="javascript">JavaScript</a-select-option>
            <a-select-option value="typescript">TypeScript</a-select-option>
            <a-select-option value="python">Python</a-select-option>
            <a-select-option value="node">Node.js/Backend</a-select-option>
            <a-select-option value="java">Java</a-select-option>
            <a-select-option value="devops">DevOps</a-select-option>
            <a-select-option value="architecture">Arquitetura</a-select-option>
            <a-select-option value="php">PHP</a-select-option>
            <a-select-option value="ruby">Ruby</a-select-option>
            <a-select-option value="frontend">Frontend</a-select-option>
          </a-select>
        </BaseCard>

        <BaseCard>
          <p class="label">Senioridade</p>
          <a-select
            v-model:value="level"
            @change="onLevelChange"
            class="select"
            placeholder="Selecione a senioridade"
          >
            <a-select-option value="junior">Júnior</a-select-option>
            <a-select-option value="pleno">Pleno</a-select-option>
            <a-select-option value="senior">Sênior</a-select-option>
          </a-select>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .dashboard-container {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .dashboard-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .header h1 {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .email {
    font-size: 14px;
    color: #8c8c8c;
  }

  /* layout */
  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .label {
    font-size: 13px;
    color: #8c8c8c;
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
  }

  /* responsive */
  @media (min-width: 768px) {
    .cards {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .cards > * {
      flex: 1 1 calc(50% - 8px);
    }
  }

  @media (min-width: 1024px) {
    .cards > * {
      flex: 1 1 calc(33.33% - 10px);
    }
  }
</style>
