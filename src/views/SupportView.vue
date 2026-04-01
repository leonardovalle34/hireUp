<script lang="ts">
  export default {
    name: 'SupportView',
  };
</script>

<script lang="ts" setup>
  import { ref } from 'vue';
  import {
    WhatsAppOutlined,
    QuestionCircleOutlined,
    BugOutlined,
    CustomerServiceOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SafetyOutlined,
  } from '@ant-design/icons-vue';

  const whatsappNumber = '47997537883';
  const whatsappLink = `https://wa.me/55${whatsappNumber}`;

  const faqs = ref([
    {
      question: 'Como funciona o treinamento de entrevistas?',
      answer:
        'Nosso sistema simula entrevistas reais com perguntas técnicas e comportamentais. Você responde e recebe feedback imediato com pontuação e sugestões de melhoria.',
    },
    {
      question: 'Posso treinar em inglês?',
      answer:
        'Sim! Oferecemos perguntas em inglês para ajudar você a se preparar para entrevistas internacionais e melhorar seu vocabulário técnico.',
    },
    {
      question: 'Como funciona a assinatura?',
      answer:
        'Temos planos mensal e anual. Após a assinatura, você tem acesso ilimitado a todas as simulações, feedback detalhado e acompanhamento de evolução.',
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer:
        'Sim! Você pode cancelar sua assinatura diretamente no painel do Stripe. O cancelamento é imediato e sem multa.',
    },
    {
      question: 'As respostas são avaliadas por pessoas ou IA?',
      answer:
        'Utilizamos um sistema inteligente que analisa palavras-chave, estrutura e profundidade das respostas. O feedback é gerado automaticamente com base em critérios técnicos.',
    },
  ]);

  const activeFaq = ref<number | null>(null);

  const toggleFaq = (index: number) => {
    if (activeFaq.value === index) {
      activeFaq.value = null;
    } else {
      activeFaq.value = index;
    }
  };

  const openWhatsApp = () => {
    window.open(whatsappLink, '_blank');
  };
</script>

<template>
  <div class="support-container">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <CustomerServiceOutlined class="hero-icon" />
        <h1 class="hero-title">Suporte Técnico</h1>
        <p class="hero-subtitle">
          Estamos aqui para ajudar! Escolha a melhor forma de entrar em contato
          conosco
        </p>
      </div>
    </div>

    <!-- Contact Options -->
    <div class="contact-options">
      <div class="container">
        <div class="options-grid">
          <!-- WhatsApp Card -->
          <div class="option-card whatsapp-card" @click="openWhatsApp">
            <WhatsAppOutlined class="option-icon" />
            <h3 class="option-title">WhatsApp</h3>
            <p class="option-description">
              Resposta rápida e direta para dúvidas, reclamações ou sugestões
            </p>
            <div class="option-contact">(47) 99753-7883</div>
            <a-button type="primary" class="option-button">
              <WhatsAppOutlined /> Falar Agora
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="faq-section">
      <div class="container">
        <h2 class="section-title">Perguntas Frequentes</h2>
        <p class="section-subtitle">
          Tire suas dúvidas rapidamente com as perguntas mais comuns
        </p>

        <div class="faq-list">
          <div v-for="(faq, index) in faqs" :key="index" class="faq-item">
            <div class="faq-question" @click="toggleFaq(index)">
              <div style="display: flex; align-items: center; gap: 10px">
                <QuestionCircleOutlined class="faq-icon" />
                <span>{{ faq.question }}</span>
              </div>
              <span class="faq-toggle">{{
                activeFaq === index ? '−' : '+'
              }}</span>
            </div>
            <div v-show="activeFaq === index" class="faq-answer">
              <CheckCircleOutlined class="answer-icon" />
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="container">
        <div class="info-grid">
          <div class="info-card">
            <ClockCircleOutlined class="info-icon" />
            <h3>Horário de Atendimento</h3>
            <p>Segunda a Sexta: 9h às 18h</p>
            <p>Sábado: 9h às 13h</p>
            <p>Domingo: Fechado</p>
          </div>

          <div class="info-card">
            <SafetyOutlined class="info-icon" />
            <h3>Atendimento Seguro</h3>
            <p>Seus dados são protegidos</p>
            <p>Resposta em até 24h úteis</p>
            <p>Suporte prioritário para assinantes</p>
          </div>

          <div class="info-card">
            <BugOutlined class="info-icon" />
            <h3>Reportar Bug</h3>
            <p>Encontrou um problema?</p>
            <p>Reporte pelo WhatsApp</p>
            <p>Inclua prints e detalhes</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .support-container {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* Hero Section */
  .hero-section {
    background: linear-gradient(135deg, #001633 0%, #060042 100%);
    padding: 60px 24px;
    text-align: center;
    color: white;
  }

  .hero-icon {
    font-size: 64px;
    margin-bottom: 24px;
    animation: pulse 2s ease-in-out infinite;
  }

  .hero-title {
    font-size: 48px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .hero-subtitle {
    font-size: 18px;
    max-width: 600px;
    margin: 0 auto;
    opacity: 0.95;
  }

  /* Contact Options */
  .contact-options {
    padding: 60px 0;
    background: white;
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 32px;
  }

  .option-card {
    text-align: center;
    padding: 40px 24px;
    border-radius: 16px;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition:
      transform 0.3s,
      box-shadow 0.3s;
    cursor: pointer;
  }

  .option-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .whatsapp-card {
    border-top: 4px solid #25d366;
  }

  /* FAQ Section */
  .faq-section {
    padding: 60px 0;
    background: #f5f5f5;
  }

  .section-title {
    font-size: 36px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 16px;
    color: #001633;
  }

  .section-subtitle {
    font-size: 18px;
    text-align: center;
    color: #4a5568;
    margin-bottom: 48px;
  }

  .faq-list {
    max-width: 800px;
    margin: 0 auto;
  }

  .faq-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    background: white;
  }

  .faq-question {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    cursor: pointer;
    gap: 12px;
    color: #2d3748;
  }

  .faq-question:hover {
    background: #f7fafc;
  }

  .faq-icon {
    color: #001633;
    font-size: 20px;
    max-width: 30px;
  }

  .faq-question span:first-of-type {
    flex: 1;
  }

  .faq-toggle {
    font-size: 24px;
    font-weight: bold;
    color: #001633;
  }

  .faq-answer {
    padding: 20px 24px;
    background: #f7fafc;
    display: flex;
    gap: 12px;
    border-top: 1px solid #e2e8f0;
  }

  .answer-icon {
    color: #001633;
    font-size: 18px;
    margin-top: 2px;
  }

  .faq-answer p {
    margin: 0;
    color: #4a5568;
    line-height: 1.6;
    flex: 1;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 32px;
  }

  .info-card {
    text-align: center;
    padding: 32px;
    background: #f7fafc;
    border-radius: 16px;
    transition: transform 0.3s;
    border: 1px solid #e2e8f0;
  }

  .info-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .info-icon {
    font-size: 48px;
    color: #001633;
    margin-bottom: 16px;
  }

  .info-card h3 {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #2d3748;
  }

  .info-card p {
    color: #4a5568;
    margin-bottom: 8px;
  }

  /* Animations */
  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
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

    .options-grid {
      grid-template-columns: 1fr;
    }

    .faq-question {
      font-size: 14px;
      padding: 16px;
    }

    .faq-answer {
      font-size: 14px;
      padding: 16px;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
