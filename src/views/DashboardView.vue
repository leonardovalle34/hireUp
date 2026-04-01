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
  import { ExclamationCircleOutlined } from '@ant-design/icons-vue';

  const auth = useAuthStore();
  const { dashboardUser } = storeToRefs(auth);
  const typeOfQuestion = ref('behavioral');
  const level = ref('junior');

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
      v-if="dashboardUser?.plan === 'free'"
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
        <div class="card">
          <p class="label">Plano</p>
          <h2>{{ dashboardUser?.plan.toUpperCase() }}</h2>
        </div>

        <div class="card">
          <p class="label">Status</p>
          <h2>Ativo</h2>
        </div>

        <div class="card">
          <p class="label">Membro desde</p>
          <h2>
            {{
              new Date(dashboardUser?.created_at || '').toLocaleDateString(
                'pt-BR',
              )
            }}
          </h2>
        </div>
        <div class="card">
          <p class="label">Treinos realizados hoje</p>
          <h2>
            {{ dashboardUser?.lessons_today || 0 }}
          </h2>
        </div>
        <div class="card">
          <p class="label">Treinos restantes</p>
          <h2>
            {{
              dashboardUser?.remaining === null
                ? 'Ilimitados'
                : dashboardUser?.remaining
            }}
          </h2>
        </div>
        <div class="card">
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
        </div>

        <div class="card">
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
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .dashboard-container {
    padding: 20px;
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
    transition: box-shadow 0.3s ease;
  }

  .dashboard-card:hover {
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.07),
      0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .header h1 {
    font-size: 24px;
    margin-bottom: 8px;
    color: #1a1a1a;
    font-weight: 600;
  }

  .email {
    font-size: 14px;
    color: #8c8c8c;
    margin: 0;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .card {
    background: #fafafa;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    transition: all 0.2s ease;
  }

  .card:hover {
    background: #ffffff;
    border-color: #d9d9d9;
    transform: translateY(-2px);
  }

  .card .label {
    font-size: 13px;
    color: #8c8c8c;
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #262626;
  }

  .card-dropdown {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .select {
    width: 100%;
  }

  /* Tablet */
  @media (min-width: 768px) {
    .dashboard-container {
      padding: 24px;
    }

    .dashboard-card {
      padding: 32px;
    }

    .cards {
      flex-direction: row;
    }

    .card {
      flex: 1;
    }

    .card h2 {
      font-size: 32px;
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .dashboard-container {
      padding: 32px;
    }

    .dashboard-card {
      padding: 10px;
    }

    .header h1 {
      font-size: 28px;
    }

    .card h2 {
      font-size: 36px;
    }
  }
</style>
