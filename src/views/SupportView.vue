<script lang="ts">
  export default {
    name: 'SupportView',
  };
</script>

<script lang="ts" setup>
  import { ref } from 'vue';
  import BaseCard from '@/components/UI/BaseCard.vue';
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
        'Simulações reais com feedback automático baseado em critérios técnicos.',
    },
    {
      question: 'O treinamento é em inglês?',
      answer:
        'Sim. Toda a experiência é em inglês, simulando entrevistas reais para empresas internacionais e ajudando você a desenvolver confiança e vocabulário técnico.',
    },
    {
      question: 'Como funciona a assinatura?',
      answer: 'Planos mensal e anual com acesso completo às simulações.',
    },
    {
      question: 'Posso cancelar?',
      answer: 'Sim, cancelamento direto pelo Stripe sem multa.',
    },
    {
      question: 'Como minhas respostas são avaliadas?',
      answer:
        'Utilizamos uma lógica no backend que analisa suas respostas com base em critérios técnicos e retorna uma nota junto com feedback estruturado.',
    },
  ]);

  const activeFaq = ref<number | null>(null);

  const toggleFaq = (index: number) => {
    activeFaq.value = activeFaq.value === index ? null : index;
  };

  const openWhatsApp = () => {
    window.open(whatsappLink, '_blank');
  };
</script>

<template>
  <div class="container">
    <div class="main-card">
      <!-- Header -->
      <div class="header">
        <CustomerServiceOutlined class="icon" />
        <h1>Suporte Técnico</h1>
        <p>Estamos aqui para ajudar</p>
      </div>

      <!-- Cards -->
      <div class="cards">
        <BaseCard title="WhatsApp" center>
          <WhatsAppOutlined class="icon whatsapp" />
          <p>Resposta rápida para dúvidas</p>
          <p class="contact">(47) 99753-7883</p>

          <a-button type="primary" @click="openWhatsApp">
            Falar Agora
          </a-button>
        </BaseCard>

        <BaseCard title="Horário" center>
          <ClockCircleOutlined class="icon" />
          <p>Seg-Sex: 9h às 18h</p>
          <p>Sábado: 9h às 13h</p>
        </BaseCard>

        <BaseCard title="Atendimento" center>
          <SafetyOutlined class="icon" />
          <p>Dados protegidos</p>
          <p>Resposta em até 24h</p>
        </BaseCard>

        <BaseCard title="Reportar Bug" center>
          <BugOutlined class="icon" />
          <p>Encontrou problema?</p>
          <p>Envie detalhes via WhatsApp</p>
        </BaseCard>
      </div>

      <!-- FAQ -->
      <div class="faq">
        <h2>Perguntas Frequentes</h2>

        <div class="faq-list">
          <BaseCard v-for="(faq, index) in faqs" :key="index">
            <div class="faq-question" @click="toggleFaq(index)">
              <div class="left">
                <QuestionCircleOutlined />
                <span>{{ faq.question }}</span>
              </div>
              <span>{{ activeFaq === index ? '−' : '+' }}</span>
            </div>

            <div v-if="activeFaq === index" class="faq-answer">
              <CheckCircleOutlined />
              <p>{{ faq.answer }}</p>
            </div>
          </BaseCard>
        </div>
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
    font-size: 32px;
    margin-bottom: 10px;
    color: #001633;
  }

  .whatsapp {
    color: #25d366;
  }

  .contact {
    font-weight: 500;
    margin: 8px 0;
  }

  /* Cards layout */
  .cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  /* FAQ */
  .faq {
    margin-top: 16px;
  }

  .faq h2 {
    text-align: center;
    margin-bottom: 16px;
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .faq-question {
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    font-weight: 500;
  }

  .faq-question .left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .faq-answer {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    font-size: 14px;
    color: #4a5568;
  }

  /* Responsive */
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
      flex: 1 1 calc(25% - 12px);
    }
  }
</style>
