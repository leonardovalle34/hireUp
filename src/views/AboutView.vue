<script lang="ts">
  export default {
    name: 'AboutView',
  };
</script>

<script lang="ts" setup>
  import { ref } from 'vue';
  import {
    TeamOutlined,
    ThunderboltOutlined,
    GlobalOutlined,
    HeartOutlined,
    RocketOutlined,
    CheckCircleOutlined,
    CodeOutlined,
    TranslationOutlined,
  } from '@ant-design/icons-vue';

  const stats = ref([
    { number: '500+', label: 'Questões Técnicas' },
    { number: '50+', label: 'Tecnologias' },
    { number: '1000+', label: 'Alunos Ativos' },
    { number: '95%', label: 'Taxa de Aprovação' },
  ]);

  const values = ref([
    {
      icon: CodeOutlined,
      title: 'Excelência Técnica',
      description:
        'Preparamos você com as melhores práticas e conhecimentos profundos das tecnologias mais requisitadas do mercado.',
    },
    {
      icon: TranslationOutlined,
      title: 'Inglês Profissional',
      description:
        'Simulações de entrevistas em inglês para que você se sinta confiante e preparado para oportunidades internacionais.',
    },
    {
      icon: HeartOutlined,
      title: 'Comunidade Colaborativa',
      description:
        'Acreditamos no poder da comunidade para compartilhar conhecimento e crescer juntos.',
    },
  ]);
</script>

<template>
  <div class="about-container">
    <div class="about-card">
      <div class="header">
        <RocketOutlined class="header-icon" />
        <h1>Preparando Devs para o Sucesso</h1>
        <p class="subtitle">
          Somos uma plataforma dedicada a transformar desenvolvedores em
          profissionais prontos para enfrentar qualquer entrevista técnica.
        </p>
      </div>

      <!-- Mission Section -->
      <div class="mission-section">
        <h2 class="section-title">Nossa Missão</h2>
        <p class="mission-text">
          Somos programadores que entendem os desafios do mercado de tecnologia.
          Nossa missão é ajudar desenvolvedores a se prepararem para entrevistas
          técnicas, oferecendo um ambiente de treinamento realista e feedback
          especializado. Acreditamos que um bom desenvolvedor merece estar
          pronto para aproveitar as melhores oportunidades.
        </p>
        <div class="mission-highlights">
          <div class="highlight">
            <CheckCircleOutlined />
            <span>Simulações Reais de Entrevistas</span>
          </div>
          <div class="highlight">
            <CheckCircleOutlined />
            <span>Feedback Imediato e Detalhado</span>
          </div>
          <div class="highlight">
            <CheckCircleOutlined />
            <span>Preparação em Inglês e Português</span>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="stats-section">
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>

      <!-- Values Section -->
      <div class="values-section">
        <h2 class="section-title">Nossos Valores</h2>
        <div class="values-grid">
          <div v-for="value in values" :key="value.title" class="value-card">
            <component :is="value.icon" class="value-icon" />
            <h3>{{ value.title }}</h3>
            <p>{{ value.description }}</p>
          </div>
        </div>
      </div>

      <!-- Language Section -->
      <div class="language-section">
        <GlobalOutlined class="language-icon" />
        <h2 class="section-title">Aprenda Inglês na Prática</h2>
        <p class="language-text">
          Sabemos que o inglês é essencial para o crescimento na carreira de
          tecnologia. Por isso, nossas simulações incluem perguntas em inglês,
          ajudando você a desenvolver vocabulário técnico e confiança para
          entrevistas internacionais.
        </p>
        <div class="language-features">
          <div class="feature">
            <ThunderboltOutlined />
            <span>Perguntas técnicas em inglês</span>
          </div>
          <div class="feature">
            <ThunderboltOutlined />
            <span>Feedback sobre seu vocabulário técnico</span>
          </div>
          <div class="feature">
            <ThunderboltOutlined />
            <span>Prática de pronúncia e estruturação de respostas</span>
          </div>
        </div>
      </div>

      <!-- Team Section -->
      <div class="team-section">
        <h2 class="section-title">Quem Faz Acontecer</h2>
        <div class="team-card">
          <TeamOutlined class="team-icon" />
          <h3>Equipe de Desenvolvimento</h3>
          <p class="team-role">Desenvolvedores Full Stack</p>
          <p class="team-description">
            Profissionais apaixonados por tecnologia e educação
          </p>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="cta-section">
        <h2 class="cta-title">Pronto para começar sua jornada?</h2>
        <p class="cta-text">
          Junte-se a centenas de desenvolvedores que já estão se preparando para
          suas próximas entrevistas.
        </p>
        <a-button type="primary" size="large" @click="$router.push('/lessons')">
          Começar Agora
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .about-container {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .about-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.3s ease;
  }

  .about-card:hover {
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.07),
      0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .header {
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
    text-align: center;
  }

  .header-icon {
    font-size: 48px;
    color: #001633;
    margin-bottom: 12px;
  }

  .header h1 {
    font-size: 24px;
    margin-bottom: 12px;
    color: #1a1a1a;
    font-weight: 600;
  }

  .subtitle {
    font-size: 14px;
    color: #8c8c8c;
    margin: 0;
    line-height: 1.5;
  }

  .section-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #262626;
    text-align: center;
  }

  /* Mission Section */
  .mission-section {
    background: #fafafa;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 24px;
    text-align: center;
  }

  .mission-text {
    font-size: 14px;
    line-height: 1.6;
    color: #4a5568;
    margin-bottom: 20px;
  }

  .mission-highlights {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .highlight {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #2d3748;
  }

  .highlight svg {
    color: #001633;
  }

  /* Stats Section */
  .stats-section {
    background: linear-gradient(135deg, #001633 0%, #060042 100%);
    padding: 32px 24px;
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 24px;
    text-align: center;
  }

  .stat-card {
    color: white;
  }

  .stat-number {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 13px;
    opacity: 0.9;
  }

  /* Values Section */
  .values-section {
    margin-bottom: 24px;
  }

  .values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .value-card {
    background: #fafafa;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    text-align: center;
    transition: all 0.2s ease;
  }

  .value-card:hover {
    background: #ffffff;
    border-color: #d9d9d9;
    transform: translateY(-2px);
  }

  .value-icon {
    font-size: 32px;
    color: #001633;
    margin-bottom: 12px;
  }

  .value-card h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #262626;
  }

  .value-card p {
    font-size: 13px;
    color: #4a5568;
    line-height: 1.5;
    margin: 0;
  }

  /* Language Section */
  .language-section {
    background: #fafafa;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 24px;
    text-align: center;
  }

  .language-icon {
    font-size: 40px;
    color: #001633;
    margin-bottom: 12px;
  }

  .language-text {
    font-size: 14px;
    line-height: 1.6;
    color: #4a5568;
    max-width: 700px;
    margin: 0 auto 20px;
  }

  .language-features {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 6px;
    background: white;
    padding: 8px 16px;
    border-radius: 24px;
    font-size: 12px;
    color: #001633;
    border: 1px solid #e2e8f0;
  }

  /* Team Section */
  .team-section {
    margin-bottom: 24px;
    text-align: center;
  }

  .team-card {
    background: linear-gradient(135deg, #001633 0%, #060042 100%);
    padding: 32px;
    border-radius: 12px;
    color: white;
  }

  .team-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .team-card h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .team-role {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 12px;
  }

  .team-description {
    font-size: 13px;
    opacity: 0.8;
    margin: 0;
  }

  /* CTA Section */
  .cta-section {
    text-align: center;
    padding: 24px;
    background: #fafafa;
    border-radius: 12px;
  }

  .cta-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #262626;
  }

  .cta-text {
    font-size: 14px;
    color: #4a5568;
    margin-bottom: 20px;
  }

  /* Tablet */
  @media (min-width: 768px) {
    .about-container {
      padding: 24px;
    }

    .about-card {
      padding: 32px;
    }

    .header h1 {
      font-size: 28px;
    }

    .subtitle {
      font-size: 15px;
    }

    .section-title {
      font-size: 22px;
    }

    .stat-number {
      font-size: 36px;
    }

    .values-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .about-container {
      padding: 32px;
    }

    .header h1 {
      font-size: 32px;
    }

    .subtitle {
      font-size: 16px;
    }

    .mission-text {
      font-size: 15px;
    }

    .value-card h3 {
      font-size: 20px;
    }

    .value-card p {
      font-size: 14px;
    }

    .cta-title {
      font-size: 24px;
    }
  }
</style>
