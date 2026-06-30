<script lang="ts">
  export default { name: 'DashboardView' };
</script>

<script setup lang="ts">
  import { onMounted, ref, computed, watch, nextTick } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { storeToRefs } from 'pinia';
  import { useRouter } from 'vue-router';
  import { Chart, registerables } from 'chart.js';
  import { supabase } from '@/lib/supabase';

  const aceSleeping = new URL('../assets/ace/ace-sleeping.png', import.meta.url)
    .href;
  const aceWaving = new URL('../assets/ace/ace-waving.png', import.meta.url)
    .href;
  const aceThinking = new URL('../assets/ace/ace-thinking.png', import.meta.url)
    .href;
  const aceThumbsup = new URL('../assets/ace/ace-thumbsup.png', import.meta.url)
    .href;

  Chart.register(...registerables);

  const auth = useAuthStore();
  const { dashboardUser } = storeToRefs(auth);
  const router = useRouter();
  const weeklyChartRef = ref<HTMLCanvasElement | null>(null);
  const scoreChartRef = ref<HTMLCanvasElement | null>(null);
  const activityChartRef = ref<HTMLCanvasElement | null>(null);
  let weeklyChartInstance: Chart | null = null;
  let scoreChartInstance: Chart | null = null;
  let activityChartInstance: Chart | null = null;

  const aceImage = computed(() => {
    const s = dashboardUser.value?.streak ?? 0;
    if (s === 0) return aceSleeping;
    if (s >= 7) return aceWaving;
    return aceThinking;
  });

  const hasApiKey = computed(() => !!localStorage.getItem('userApiKey'));

  const planLabel = computed(() => {
    const p = dashboardUser.value?.plan;
    if (p === 'free') return 'Free';
    if (p === 'practice') return 'Practice';
    if (p === 'fluent') return 'Fluent';
    if (p === 'pro') return 'Pro';
    return p?.toUpperCase() ?? '—';
  });

  const scoreColor = computed(() => {
    const s = dashboardUser.value?.avg_score ?? 0;
    if (s >= 12) return '#16a34a';
    if (s >= 8) return '#ca8a04';
    return '#dc2626';
  });

  const streakMessage = computed(() => {
    const s = dashboardUser.value?.streak ?? 0;
    if (s === 0) return 'Nenhum dia ainda';
    if (s === 1) return '1 dia seguido';
    return `${s} dias seguidos`;
  });

  const remainingLabel = computed(() => {
    const r = dashboardUser.value?.remaining;
    if (r === null || r === undefined) return '∞';
    return String(r);
  });

  const canTrain = computed(() => {
    if (hasApiKey.value) return true;
    const r = dashboardUser.value?.remaining;
    return r === null || r === undefined || r > 0;
  });

  const calendarDays = computed(() => {
    const days = [];
    const activeDays = new Set(dashboardUser.value?.active_days ?? []);
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ key, active: activeDays.has(key), isToday: i === 0 });
    }
    return days;
  });

  const goToTraining = () => router.push('/interview');
  const goToPricing = () => router.push('/pricing');

  // ── Placement test modal ───────────────────────────────────────────────────
  const showPlacementModal = ref(false);

  async function checkPlacementTest() {
    const skipped = localStorage.getItem('placement_test_skipped') === 'true';
    if (skipped) return;

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('placement_test_done')
      .eq('id', authUser.id)
      .single();

    if (profile && !profile.placement_test_done) {
      showPlacementModal.value = true;
    }
  }

  function placementDoNow() {
    showPlacementModal.value = false;
    router.push('/placement-test');
  }

  function placementLater() {
    showPlacementModal.value = false;
  }

  function placementSkip() {
    localStorage.setItem('placement_test_skipped', 'true');
    showPlacementModal.value = false;
    router.push('/settings');
  }

  function getChartColors() {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      grid: isDark ? '#334155' : '#f3f4f6',
      text: isDark ? '#94a3b8' : '#6b7280',
      bar: isDark ? '#3b82f6' : '#bfdbfe',
      barActive: isDark ? '#60a5fa' : '#1d4ed8',
      line: isDark ? '#60a5fa' : '#1d4ed8',
      fill: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(29,78,216,0.08)',
    };
  }

  function buildCharts() {
    const weekly = dashboardUser.value?.weekly_chart ?? [];
    const scores = dashboardUser.value?.score_chart ?? [];
    const activity = dashboardUser.value?.activity_chart ?? [];
    const colors = getChartColors();

    if (weeklyChartRef.value) {
      if (weeklyChartInstance) weeklyChartInstance.destroy();
      weeklyChartInstance = new Chart(weeklyChartRef.value, {
        type: 'bar',
        data: {
          labels: weekly.map((d) => d.label),
          datasets: [
            {
              label: 'Treinos',
              data: weekly.map((d) => d.count),
              backgroundColor: weekly.map((d) => {
                const today = new Date().toISOString().split('T')[0];
                return d.day === today ? colors.barActive : colors.bar;
              }),
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, font: { size: 11 }, color: colors.text },
              grid: { color: colors.grid },
            },
            x: {
              ticks: { font: { size: 12 }, color: colors.text },
              grid: { display: false },
            },
          },
        },
      });
    }

    if (scoreChartRef.value) {
      if (scoreChartInstance) scoreChartInstance.destroy();
      const hasData = scores.length > 0;
      const labels = hasData
        ? [...scores].reverse().map((s) => s.date)
        : ['Sem dados'];
      const data = hasData ? [...scores].reverse().map((s) => s.score) : [null];

      scoreChartInstance = new Chart(scoreChartRef.value, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Score',
              data,
              borderColor: colors.line,
              backgroundColor: colors.fill,
              pointBackgroundColor: colors.line,
              pointRadius: hasData ? 4 : 0,
              tension: 0.4,
              fill: true,
              spanGaps: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              min: 0,
              max: 20,
              ticks: { stepSize: 5, font: { size: 11 }, color: colors.text },
              grid: { color: colors.grid },
            },
            x: {
              ticks: { font: { size: 11 }, color: colors.text },
              grid: { display: false },
            },
          },
        },
      });
    }

    if (activityChartRef.value) {
      if (activityChartInstance) activityChartInstance.destroy();
      activityChartInstance = new Chart(activityChartRef.value, {
        type: 'bar',
        data: {
          labels: activity.map((d: any) => d.label),
          datasets: [
            {
              label: 'Entrevistas',
              data: activity.map((d: any) => d.interviews),
              backgroundColor: '#3b82f6',
            },
            {
              label: 'Tutor',
              data: activity.map((d: any) => d.tutor),
              backgroundColor: '#10b981',
            },
            {
              label: 'Aulas',
              data: activity.map((d: any) => d.lessons),
              backgroundColor: '#f59e0b',
            },
            {
              label: 'Quiz',
              data: activity.map((d: any) => d.quiz),
              backgroundColor: '#8b5cf6',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { font: { size: 10 }, color: colors.text },
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: { font: { size: 11 }, color: colors.text },
              grid: { display: false },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: { stepSize: 1, font: { size: 11 }, color: colors.text },
              grid: { color: colors.grid },
            },
          },
        },
      });
    }
  }

  watch(
    dashboardUser,
    async (val) => {
      if (val) {
        await nextTick();
        buildCharts();
      }
    },
    { deep: true, immediate: true },
  );

  onMounted(async () => {
    await auth.fetchUser();
    checkPlacementTest();
  });
</script>

<template>
  <div class="dashboard-container">
    <!-- Placement test modal -->
    <Teleport to="body">
      <div
        v-if="showPlacementModal"
        class="placement-modal-overlay"
        @click.self="placementLater"
      >
        <div class="placement-modal">
          <img :src="aceThumbsup" alt="Ace" class="placement-ace" />
          <h2>Descubra seu nível de inglês!</h2>
          <p>
            Faça o teste de nivelamento gratuito (5–8 minutos) e o Ace vai
            personalizar seus treinos para o seu nível.
          </p>
          <button class="pm-btn-primary" @click="placementDoNow">
            🎯 Fazer agora
          </button>
          <button class="pm-btn-ghost" @click="placementLater">Depois</button>
          <button class="pm-btn-link" @click="placementSkip">
            Pular e definir manualmente em Configurações
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Header -->
    <div class="header-section">
      <div class="header-text">
        <h1>👋 Olá, {{ dashboardUser?.name || dashboardUser?.email }}</h1>
        <p class="email">{{ dashboardUser?.email }}</p>
        <span class="plan-badge" :class="dashboardUser?.plan">{{
          planLabel
        }}</span>
      </div>
      <img :src="aceImage" alt="Ace" class="ace-mascot" />
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <p class="stat-label">Membro desde</p>
        <p class="stat-value small">
          {{
            dashboardUser?.created_at
              ? new Date(dashboardUser.created_at).toLocaleDateString('pt-BR')
              : '—'
          }}
        </p>
      </div>
      <div class="stat-card highlight">
        <p class="stat-label">🔥 Streak</p>
        <p class="stat-value">{{ streakMessage }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Treinos esta semana</p>
        <p class="stat-value">{{ dashboardUser?.weekly_count ?? 0 }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Score médio</p>
        <p class="stat-value" :style="{ color: scoreColor }">
          {{ dashboardUser?.avg_score ?? 0 }}/20
        </p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Treinos hoje</p>
        <p class="stat-value">{{ dashboardUser?.lessons_today ?? 0 }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Treinos restantes hoje</p>
        <p class="stat-value">{{ remainingLabel }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Aulas hoje</p>
        <p class="stat-value">{{ dashboardUser?.course_lessons_today ?? 0 }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Tutor hoje</p>
        <p class="stat-value">
          {{ dashboardUser?.tutor_minutes_today ?? 0 }} min
        </p>
      </div>
    </div>

    <!-- Simulação de entrevista -->
    <div class="section-card action-card">
      <div class="action-header">
        <div>
          <h2 class="section-title">Simulação de entrevista</h2>
          <p class="action-sub">
            O Ace conduz uma entrevista realista em inglês baseada na sua área
            profissional
          </p>
        </div>
        <div class="action-remaining" :class="{ 'no-remaining': !canTrain }">
          <span v-if="hasApiKey">🔑 Ilimitado com API key</span>
          <span v-else-if="canTrain">{{ remainingLabel }} restantes</span>
          <span v-else>Limite atingido</span>
        </div>
      </div>

      <button class="btn-train" :disabled="!canTrain" @click="goToTraining">
        {{ canTrain ? '🎯 Iniciar simulação' : '🔒 Limite atingido' }}
      </button>

      <button v-if="!canTrain" class="btn-upgrade" @click="goToPricing">
        ⚡ Fazer upgrade para mais simulações
      </button>
    </div>

    <!-- Gráfico semanal -->
    <div class="section-card">
      <h2 class="section-title">Treinos esta semana</h2>
      <div class="chart-wrap">
        <canvas
          ref="weeklyChartRef"
          role="img"
          aria-label="Treinos por dia nos últimos 7 dias"
        ></canvas>
      </div>
    </div>

    <!-- Streak calendário + Score chart -->
    <div class="two-col">
      <div class="section-card">
        <h2 class="section-title">🔥 Atividade — 30 dias</h2>
        <div class="calendar-grid">
          <div
            v-for="d in calendarDays"
            :key="d.key"
            class="cal-day"
            :class="{ 'cal-active': d.active, 'cal-today': d.isToday }"
            :title="d.key"
          />
        </div>
        <div class="cal-legend">
          <span class="legend-dot inactive"></span><span>Sem treino</span>
          <span class="legend-dot active"></span><span>Treinou</span>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">Evolução do score</h2>
        <div class="chart-wrap">
          <canvas
            ref="scoreChartRef"
            role="img"
            aria-label="Evolução do score nas últimas sessões"
          ></canvas>
        </div>
      </div>

      <div class="section-card">
        <h2 class="section-title">Atividades — 7 dias</h2>
        <div class="chart-wrap">
          <canvas
            ref="activityChartRef"
            role="img"
            aria-label="Atividades por tipo nos últimos 7 dias"
          ></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .dashboard-container {
    padding: 24px 20px;
    max-width: 1100px;
    margin: 0 auto;
    margin-top: 16px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
  }
  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: var(--card-shadow);
  }
  .header-text h1 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--text-primary);
  }
  .email {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 10px;
  }
  .ace-mascot {
    width: 90px;
    height: auto;
    object-fit: contain;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  @media (min-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .stat-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: var(--card-shadow);
  }
  .stat-card.highlight {
    background: #92400e;
    border: 1px solid #b45309;
  }
  .stat-card.highlight .stat-label {
    color: #fde68a;
  }
  .stat-card.highlight .stat-value {
    color: #fff;
  }
  .stat-label {
    font-size: 11px;
    color: var(--text-tertiary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 6px;
  }
  .stat-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .stat-value.small {
    font-size: 15px;
  }
  .section-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: var(--card-shadow);
    overflow: hidden;
  }
  .section-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
  }
  .action-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .action-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .action-sub {
    font-size: 13px;
    color: var(--text-tertiary);
    margin: 0;
  }
  .action-remaining {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    background: #dbeafe;
    color: #1d4ed8;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .action-remaining.no-remaining {
    background: #fee2e2;
    color: #991b1b;
  }
  .btn-train {
    width: 100%;
    padding: 14px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-train:hover {
    background: var(--accent-hover);
  }
  .btn-train:disabled {
    background: var(--border);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }
  .btn-upgrade {
    width: 100%;
    padding: 11px;
    background: transparent;
    color: var(--success);
    border: 1px solid var(--success);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-upgrade:hover {
    background: var(--bg-secondary);
  }
  .chart-wrap {
    position: relative;
    height: 180px;
    width: 100%;
    max-width: 100%;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    overflow: hidden;
  }
  @media (min-width: 768px) {
    .two-col {
      grid-template-columns: 1fr 1fr;
    }
  }
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 4px;
    margin-bottom: 10px;
  }
  .cal-day {
    aspect-ratio: 1;
    border-radius: 4px;
    background: var(--border);
  }
  .cal-day.cal-active {
    background: var(--accent);
  }
  .cal-day.cal-today {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .cal-legend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-tertiary);
  }
  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    display: inline-block;
  }
  .legend-dot.inactive {
    background: var(--bg-secondary);
  }
  .legend-dot.active {
    background: var(--accent);
  }

  /* Placement test modal */
  .placement-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  .placement-modal {
    background: var(--card-bg);
    border-radius: 20px;
    padding: 28px 24px;
    max-width: 360px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }
  .placement-ace {
    width: 72px;
    height: auto;
  }
  .placement-modal h2 {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    text-align: center;
    margin: 0;
  }
  .placement-modal p {
    font-size: 13px;
    color: var(--text-secondary);
    text-align: center;
    line-height: 1.5;
    margin: 0;
  }
  .pm-btn-primary {
    width: 100%;
    padding: 12px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
  }
  .pm-btn-ghost {
    width: 100%;
    padding: 10px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    font-size: 14px;
    cursor: pointer;
  }
  .pm-btn-link {
    background: none;
    border: none;
    color: var(--text-tertiary);
    font-size: 12px;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }
</style>
