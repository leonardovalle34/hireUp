<script lang="ts">
  export default { name: 'SupportView' };
</script>

<script lang="ts" setup>
  import { ref } from 'vue';

  const whatsappNumber = '47997537883';
  const whatsappLink = `https://wa.me/55${whatsappNumber}`;

  const faqs = ref([
    {
      question: 'Como funciona a simulação de entrevistas?',
      answer:
        'O Ace, nosso entrevistador de IA, conduz uma entrevista realista em inglês por voz. Ao final das 8 perguntas, você recebe um feedback detalhado com pontuação, pontos fortes e áreas a melhorar.',
    },
    {
      question: 'O treinamento é em inglês?',
      answer:
        'Sim. Toda a experiência é em inglês, simulando entrevistas reais para empresas nacionais e internacionais, ajudando você a desenvolver confiança e vocabulário profissional.',
    },
    {
      question: 'Como funciona a assinatura?',
      answer:
        'Temos planos mensais e anuais. O plano Free permite 1 simulação a cada 2 dias. O Practice permite 1 por dia. O Fluent permite 3 por dia com acesso completo.',
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer:
        'Sim, cancelamento direto pelo Stripe sem multa ou burocracia. Seu acesso continua até o fim do período pago.',
    },
    {
      question: 'O que é a API key própria?',
      answer:
        'Usuários dos planos Practice e Fluent podem adicionar sua própria chave de API da OpenAI ou Anthropic para realizar simulações ilimitadas além do limite diário incluso.',
    },
  ]);

  const activeFaq = ref<number | null>(null);
  const toggleFaq = (index: number) => {
    activeFaq.value = activeFaq.value === index ? null : index;
  };
  const openWhatsApp = () => window.open(whatsappLink, '_blank');
</script>

<template>
  <div class="support-container">
    <div class="hero">
      <h1>💬 Suporte</h1>
      <p>Estamos aqui para ajudar você</p>
    </div>

    <div class="cards-grid">
      <div class="card">
        <div class="card-icon">📱</div>
        <h2>WhatsApp</h2>
        <p>Resposta rápida para dúvidas e sugestões</p>
        <p class="contact">(47) 99753-7883</p>
        <button class="btn-whatsapp" @click="openWhatsApp">Falar agora</button>
      </div>

      <div class="card">
        <div class="card-icon">🕐</div>
        <h2>Horário de atendimento</h2>
        <p>Segunda a Sexta: 9h às 18h</p>
        <p>Sábado: 9h às 13h</p>
        <p class="note">Resposta em até 24h úteis</p>
      </div>

      <div class="card">
        <div class="card-icon">🔒</div>
        <h2>Segurança</h2>
        <p>
          Seus dados estão protegidos. Pagamentos processados pelo Stripe com
          criptografia.
        </p>
      </div>

      <div class="card">
        <div class="card-icon">🐛</div>
        <h2>Reportar bug</h2>
        <p>
          Encontrou algum problema? Envie os detalhes via WhatsApp e corrigimos
          o mais rápido possível.
        </p>
      </div>
    </div>

    <!-- FAQ -->
    <div class="faq-section">
      <h2>Perguntas frequentes</h2>
      <div class="faq-list">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="faq-item"
          :class="{ active: activeFaq === index }"
        >
          <div class="faq-question" @click="toggleFaq(index)">
            <span>{{ faq.question }}</span>
            <span class="faq-icon">{{ activeFaq === index ? '−' : '+' }}</span>
          </div>
          <div v-if="activeFaq === index" class="faq-answer">
            <p>{{ faq.answer }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .support-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .hero {
    text-align: center;
    padding: 8px 0;
  }
  .hero h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  .hero p {
    font-size: 14px;
    color: var(--text-secondary);
  }
  .cards-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 768px) {
    .cards-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  .card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px;
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .card-icon {
    font-size: 28px;
  }
  .card h2 {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  .card p {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }
  .contact {
    font-weight: 700;
    color: var(--text-primary) !important;
    font-size: 15px !important;
  }
  .note {
    font-size: 12px !important;
    color: var(--text-tertiary) !important;
  }
  .btn-whatsapp {
    margin-top: 4px;
    padding: 10px 20px;
    background: #25d366;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    align-self: flex-start;
  }
  .btn-whatsapp:hover {
    opacity: 0.9;
  }
  .faq-section {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: var(--card-shadow);
  }
  .faq-section h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 16px;
  }
  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .faq-item {
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }
  .faq-item.active {
    border-color: var(--accent);
  }
  .faq-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    gap: 12px;
  }
  .faq-question:hover {
    background: var(--bg-secondary);
  }
  .faq-icon {
    font-size: 18px;
    flex-shrink: 0;
    color: var(--accent);
  }
  .faq-answer {
    padding: 0 16px 14px;
  }
  .faq-answer p {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
  }
</style>
