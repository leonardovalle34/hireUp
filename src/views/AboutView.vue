<script lang="ts">
  export default {
    name: 'AboutView',
  };
</script>

<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import {
    TeamOutlined,
    ThunderboltOutlined,
    GlobalOutlined,
    HeartOutlined,
    RocketOutlined,
    TrophyOutlined,
    CheckCircleOutlined,
    MessageOutlined,
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

  const team = ref([
    {
      name: 'Equipe de Desenvolvimento',
      role: 'Desenvolvedores Full Stack',
      description: 'Profissionais apaixonados por tecnologia e educação',
    },
  ]);
</script>

<template>
  <div class="about-container">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <RocketOutlined class="hero-icon" />
          Preparando Devs para o Sucesso
        </h1>
        <p class="hero-subtitle">
          Somos uma plataforma dedicada a transformar desenvolvedores em
          profissionais prontos para enfrentar qualquer entrevista técnica, em
          qualquer idioma.
        </p>
      </div>
    </div>

    <!-- Mission Section -->
    <div class="mission-section">
      <div class="container">
        <div class="mission-card">
          <h2 class="section-title">Nossa Missão</h2>
          <p class="mission-text">
            Somos programadores que entendem os desafios do mercado de
            tecnologia. Nossa missão é ajudar desenvolvedores a se prepararem
            para entrevistas técnicas, oferecendo um ambiente de treinamento
            realista e feedback especializado. Acreditamos que um bom
            desenvolvedor merece estar pronto para aproveitar as melhores
            oportunidades, independente do idioma.
          </p>
          <div class="mission-highlights">
            <div class="highlight">
              <CheckCircleOutlined class="highlight-icon" />
              <span>Simulações Reais de Entrevistas</span>
            </div>
            <div class="highlight">
              <CheckCircleOutlined class="highlight-icon" />
              <span>Feedback Imediato e Detalhado</span>
            </div>
            <div class="highlight">
              <CheckCircleOutlined class="highlight-icon" />
              <span>Preparação em Inglês e Português</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Values Section -->
    <div class="values-section">
      <div class="container">
        <h2 class="section-title">Nossos Valores</h2>
        <div class="values-grid">
          <div v-for="value in values" :key="value.title" class="value-card">
            <component :is="value.icon" class="value-icon" />
            <h3 class="value-title">{{ value.title }}</h3>
            <p class="value-description">{{ value.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Language Section -->
    <div class="language-section">
      <div class="container">
        <div class="language-content">
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
      </div>
    </div>

    <!-- Team Section -->
    <div class="team-section">
      <div class="container">
        <h2 class="section-title">Quem Faz Acontecer</h2>
        <div class="team-grid">
          <div v-for="member in team" :key="member.name" class="team-card">
            <TeamOutlined class="team-icon" />
            <h3 class="team-name">{{ member.name }}</h3>
            <p class="team-role">{{ member.role }}</p>
            <p class="team-description">{{ member.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="cta-section">
      <div class="container">
        <div class="cta-card">
          <TrophyOutlined class="cta-icon" />
          <h2 class="cta-title">Pronto para começar sua jornada?</h2>
          <p class="cta-text">
            Junte-se a centenas de desenvolvedores que já estão se preparando
            para suas próximas entrevistas.
          </p>
          <a-button
            type="primary"
            size="large"
            @click="$router.push('/lessons')"
          >
            Começar Agora
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .about-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* Hero Section */
  .hero-section {
    padding: 80px 24px;
    text-align: center;
    color: white;
  }

  .hero-icon {
    font-size: 48px;
    margin-right: 16px;
    animation: float 3s ease-in-out infinite;
  }

  .hero-title {
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }

  .hero-subtitle {
    font-size: 20px;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
    opacity: 0.95;
  }

  /* Mission Section */
  .mission-section {
    background: white;
    padding: 80px 0;
  }

  .mission-card {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 24px;
    padding: 48px;
    text-align: center;
  }

  .section-title {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 24px;
    text-align: center;
    color: #2d3748;
  }

  .mission-text {
    font-size: 18px;
    line-height: 1.8;
    color: #4a5568;
    max-width: 800px;
    margin: 0 auto 32px;
  }

  .mission-highlights {
    display: flex;
    justify-content: center;
    gap: 32px;
    flex-wrap: wrap;
  }

  .highlight {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: #2d3748;
  }

  .highlight-icon {
    color: #48bb78;
    font-size: 20px;
  }

  /* Stats Section */
  .stats-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60px 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 32px;
    text-align: center;
  }

  .stat-card {
    color: white;
  }

  .stat-number {
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 16px;
    opacity: 0.9;
  }

  /* Values Section */
  .values-section {
    background: white;
    padding: 80px 0;
  }

  .values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 32px;
    margin-top: 48px;
  }

  .value-card {
    text-align: center;
    padding: 32px;
    border-radius: 16px;
    background: #f7fafc;
    transition:
      transform 0.3s,
      box-shadow 0.3s;
  }

  .value-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .value-icon {
    font-size: 48px;
    color: #667eea;
    margin-bottom: 16px;
  }

  .value-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #2d3748;
  }

  .value-description {
    color: #4a5568;
    line-height: 1.6;
  }

  /* Language Section */
  .language-section {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 80px 0;
  }

  .language-content {
    text-align: center;
  }

  .language-icon {
    font-size: 64px;
    color: #667eea;
    margin-bottom: 24px;
  }

  .language-text {
    font-size: 18px;
    line-height: 1.8;
    color: #4a5568;
    max-width: 800px;
    margin: 0 auto 32px;
  }

  .language-features {
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    padding: 12px 24px;
    border-radius: 48px;
    color: #667eea;
    font-weight: 500;
  }

  /* Team Section */
  .team-section {
    background: white;
    padding: 80px 0;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 32px;
    margin-top: 48px;
  }

  .team-card {
    text-align: center;
    padding: 32px;
    border-radius: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .team-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .team-name {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .team-role {
    font-size: 16px;
    opacity: 0.9;
    margin-bottom: 16px;
  }

  .team-description {
    font-size: 14px;
    line-height: 1.6;
    opacity: 0.8;
  }

  /* CTA Section */
  .cta-section {
    padding: 80px 0;
    background: white;
  }

  .cta-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 24px;
    padding: 48px;
    text-align: center;
    color: white;
  }

  .cta-icon {
    font-size: 64px;
    margin-bottom: 24px;
  }

  .cta-title {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .cta-text {
    font-size: 18px;
    margin-bottom: 32px;
    opacity: 0.9;
  }

  /* Animations */
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 32px;
    }

    .hero-subtitle {
      font-size: 16px;
    }

    .section-title {
      font-size: 28px;
    }

    .mission-card {
      padding: 32px;
    }

    .mission-text {
      font-size: 16px;
    }

    .stat-number {
      font-size: 36px;
    }

    .cta-title {
      font-size: 24px;
    }
  }
</style>
