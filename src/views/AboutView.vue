<script lang="ts">
  export default {
    name: 'AboutView',
  };
</script>

<script setup lang="ts">
  import BaseCard from '@/components/UI/BaseCard.vue';
  import { RocketOutlined } from '@ant-design/icons-vue';
</script>

<template>
  <div class="container">
    <div class="main-card">
      <!-- Header -->
      <div class="header">
        <RocketOutlined class="icon" />
        <h1>Preparando Devs para o Sucesso</h1>
        <p>
          Plataforma dedicada a transformar desenvolvedores em profissionais
          prontos para qualquer entrevista técnica.
        </p>
      </div>

      <!-- Cards -->
      <div class="cards">
        <BaseCard title="Nossa Missão">
          <p>
            Ajudar desenvolvedores a se prepararem para entrevistas técnicas com
            simulações realistas e feedback imediato.
          </p>

          <ul class="list">
            <li>Simulações reais de entrevistas</li>
            <li>Feedback detalhado</li>
            <li>Português e inglês</li>
          </ul>
        </BaseCard>

        <BaseCard title="Nossos Valores">
          <ul class="list">
            <li>
              <strong>Excelência Técnica:</strong> foco no que o mercado pede
            </li>
            <li>
              <strong>Inglês Profissional:</strong> prática real de entrevistas
            </li>
            <li><strong>Comunidade:</strong> crescer junto com outros devs</li>
          </ul>
        </BaseCard>

        <BaseCard title="Inglês na Prática" center>
          <p>
            Treine entrevistas em inglês e ganhe confiança para oportunidades
            internacionais.
          </p>

          <ul class="list">
            <li>Perguntas técnicas em inglês</li>
            <li>Feedback de vocabulário</li>
            <li>Prática de respostas</li>
          </ul>
        </BaseCard>

        <BaseCard title="Quem Faz Acontecer" center>
          <p><strong>Equipe Full Stack</strong></p>
          <p>Profissionais apaixonados por tecnologia e educação</p>
        </BaseCard>

        <BaseCard center>
          <h2>Pronto para começar?</h2>
          <p>
            Junte-se a desenvolvedores que já estão se preparando para suas
            próximas entrevistas.
          </p>

          <a-button type="primary" @click="$router.push('/lessons')">
            Começar Agora
          </a-button>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .container {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .main-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .header {
    text-align: center;
    margin-bottom: 24px;
  }

  .icon {
    font-size: 40px;
    color: #001633;
    margin-bottom: 12px;
  }

  .header h1 {
    font-size: 24px;
    margin-bottom: 8px;
  }

  .header p {
    font-size: 14px;
    color: #8c8c8c;
  }

  /* Cards layout */
  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* List padrão */
  .list {
    margin-top: 10px;
    padding-left: 16px;
  }

  .list li {
    margin-bottom: 6px;
    font-size: 14px;
    color: #4a5568;
  }

  /* Tablet */
  @media (min-width: 768px) {
    .cards {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .cards > * {
      flex: 1 1 calc(50% - 8px);
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .cards > * {
      flex: 1 1 calc(33.333% - 10px);
    }

    .header h1 {
      font-size: 28px;
    }
  }
</style>
