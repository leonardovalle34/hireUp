<script lang="ts">
  export default { name: 'AboutView' };
</script>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  const router = useRouter();
</script>

<template>
  <div class="about-container">
    <div class="hero">
      <img src="@/assets/ace/ace-waving.png" alt="Ace" class="ace" />
      <h1>Preparando profissionais para o sucesso</h1>
      <p>
        Plataforma de inglês profissional com IA para adultos brasileiros que
        querem se destacar no mercado de trabalho.
      </p>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h2>🎯 Nossa Missão</h2>
        <p>
          Democratizar o acesso ao inglês profissional, permitindo que qualquer
          adulto brasileiro pratique diariamente com um tutor de IA
          personalizado.
        </p>
        <ul>
          <li>Simulações reais de entrevistas</li>
          <li>Feedback detalhado com IA</li>
          <li>Todas as áreas profissionais</li>
        </ul>
      </div>

      <div class="card">
        <h2>💡 Nossos Valores</h2>
        <ul>
          <li>
            <strong>Prática real:</strong> aprender falando, não decorando
          </li>
          <li>
            <strong>Contexto profissional:</strong> inglês aplicado à sua área
          </li>
          <li>
            <strong>Acessibilidade:</strong> preço justo para o mercado
            brasileiro
          </li>
        </ul>
      </div>

      <div class="card">
        <h2>🎤 Inglês na Prática</h2>
        <p>
          Treine entrevistas em inglês com o Ace, nosso entrevistador de IA, e
          ganhe confiança para oportunidades nacionais e internacionais.
        </p>
        <ul>
          <li>Entrevistas por voz com IA</li>
          <li>Feedback de vocabulário e fluência</li>
          <li>Todas as áreas: tech, saúde, finanças e mais</li>
        </ul>
      </div>

      <div class="card">
        <h2>🚀 Pronto para começar?</h2>
        <p>
          Junte-se a profissionais que já estão praticando inglês diariamente
          com o HireUp.
        </p>
        <button class="btn-start" @click="router.push('/interview')">
          Iniciar simulação agora
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .about-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .hero {
    background: var(--card-bg);
    border-radius: 20px;
    padding: 32px 24px;
    box-shadow: var(--card-shadow);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .ace {
    width: 80px;
    height: auto;
  }
  .hero h1 {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .hero p {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    max-width: 500px;
  }
  .cards-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 768px) {
    .cards-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  .card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .card h2 {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .card p {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin: 0;
  }
  .card ul {
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .card li {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  .btn-start {
    width: 100%;
    padding: 13px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
  }
  .btn-start:hover {
    background: var(--accent-hover);
  }
</style>
