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
    <div class="support-card">
      <div class="header">
        <CustomerServiceOutlined class="header-icon" />
        <h1>Suporte Técnico</h1>
        <p class="subtitle">Estamos aqui para ajudar!</p>
      </div>

      <div class="cards">
        <!-- WhatsApp Card -->
        <div class="card whatsapp-card" @click="openWhatsApp">
          <WhatsAppOutlined class="card-icon" />
          <h3>WhatsApp</h3>
          <p>Resposta rápida para dúvidas, reclamações ou sugestões</p>
          <div class="contact">(47) 99753-7883</div>
          <a-button type="primary" class="btn-whatsapp">
            <WhatsAppOutlined /> Falar Agora
          </a-button>
        </div>

        <!-- Horário Card -->
        <div class="card">
          <ClockCircleOutlined class="card-icon" />
          <h3>Horário de Atendimento</h3>
          <p>Segunda a Sexta: 9h às 18h</p>
          <p>Sábado: 9h às 13h</p>
          <p>Domingo: Fechado</p>
        </div>

        <!-- Atendimento Card -->
        <div class="card">
          <SafetyOutlined class="card-icon" />
          <h3>Atendimento Seguro</h3>
          <p>Seus dados são protegidos</p>
          <p>Resposta em até 24h úteis</p>
          <p>Suporte prioritário para assinantes</p>
        </div>

        <!-- Reportar Bug Card -->
        <div class="card">
          <BugOutlined class="card-icon" />
          <h3>Reportar Bug</h3>
          <p>Encontrou um problema?</p>
          <p>Reporte pelo WhatsApp</p>
          <p>Inclua prints e detalhes</p>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="faq-section">
        <h2 class="faq-title">Perguntas Frequentes</h2>

        <div class="faq-list">
          <div v-for="(faq, index) in faqs" :key="index" class="faq-item">
            <div class="faq-question" @click="toggleFaq(index)">
              <div class="faq-question-left">
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
  </div>
</template>

<style scoped>
  .support-container {
    padding: 40px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .support-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.3s ease;
  }

  .support-card:hover {
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.07),
      0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .header {
    margin-bottom: 24px;
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
    margin-bottom: 8px;
    color: #1a1a1a;
    font-weight: 600;
  }

  .subtitle {
    font-size: 14px;
    color: #8c8c8c;
    margin: 0;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }

  .card {
    background: #fafafa;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    transition: all 0.2s ease;
    text-align: center;
    cursor: pointer;
  }

  .card:hover {
    background: #ffffff;
    border-color: #d9d9d9;
    transform: translateY(-2px);
  }

  .whatsapp-card {
    border-top: 4px solid #25d366;
  }

  .card-icon {
    font-size: 36px;
    margin-bottom: 12px;
    color: #001633;
  }

  .whatsapp-card .card-icon {
    color: #25d366;
  }

  .card h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #262626;
  }

  .card p {
    font-size: 14px;
    color: #4a5568;
    margin-bottom: 8px;
  }

  .contact {
    font-size: 14px;
    color: #001633;
    font-weight: 500;
    margin: 12px 0;
  }

  .btn-whatsapp {
    margin-top: 8px;
    background-color: #25d366;
    border-color: #25d366;
  }

  .btn-whatsapp:hover {
    background-color: #128c7e;
    border-color: #128c7e;
  }

  /* FAQ Section */
  .faq-section {
    margin-top: 16px;
  }

  .faq-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #262626;
    text-align: center;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .faq-item {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    overflow: hidden;
  }

  .faq-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .faq-question:hover {
    background: #ffffff;
  }

  .faq-question-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .faq-icon {
    color: #001633;
    font-size: 16px;
  }

  .faq-question-left span {
    font-size: 14px;
    font-weight: 500;
    color: #2d3748;
  }

  .faq-toggle {
    font-size: 20px;
    font-weight: bold;
    color: #001633;
  }

  .faq-answer {
    padding: 16px;
    background: #ffffff;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 12px;
  }

  .answer-icon {
    color: #001633;
    font-size: 14px;
    margin-top: 2px;
  }

  .faq-answer p {
    margin: 0;
    font-size: 13px;
    color: #4a5568;
    line-height: 1.5;
    flex: 1;
  }

  /* Tablet */
  @media (min-width: 768px) {
    .support-container {
      padding: 24px;
    }

    .support-card {
      padding: 32px;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .header h1 {
      font-size: 28px;
    }

    .header-icon {
      font-size: 56px;
    }

    .faq-title {
      font-size: 22px;
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .support-container {
      padding: 32px;
    }

    .cards {
      grid-template-columns: repeat(4, 1fr);
    }

    .card {
      padding: 24px;
    }

    .card-icon {
      font-size: 42px;
    }

    .card h3 {
      font-size: 20px;
    }

    .faq-question-left span {
      font-size: 16px;
    }

    .faq-answer p {
      font-size: 14px;
    }
  }
</style>
