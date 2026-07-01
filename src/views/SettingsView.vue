<script lang="ts">
  export default { name: 'SettingsView' };
</script>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { storeToRefs } from 'pinia';
  import { useRouter } from 'vue-router';

  const auth = useAuthStore();
  const { dashboardUser } = storeToRefs(auth);
  const router = useRouter();

  // Theme
  const isDark = ref(false);

  // API Key
  const apiKey = ref('');
  const apiKeyVisible = ref(false);
  const apiKeySaved = ref(false);

  // Model
  const selectedModel = ref('');
  const modelSaved = ref(false);

  // Level
  const englishLevel = ref('');
  const levelSaved = ref(false);

  // Placement test
  const canTakeTest = computed(() => {
    const plan = dashboardUser.value?.plan;
    const testDone = (dashboardUser.value as any)?.placement_test_done;
    const testDoneAt = (dashboardUser.value as any)?.placement_test_done_at;

    if (!testDone) return true;

    if (plan === 'free') return false;

    if (testDoneAt) {
      const lastTest = new Date(testDoneAt);
      const now = new Date();
      const diffDays = (now.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 30;
    }

    return true;
  });

  const testBlockedReason = computed(() => {
    const plan = dashboardUser.value?.plan;
    const testDoneAt = (dashboardUser.value as any)?.placement_test_done_at;

    if (plan === 'free') return 'Plano Free permite apenas 1 teste de nivelamento.';

    if (testDoneAt) {
      const lastTest = new Date(testDoneAt);
      const now = new Date();
      const diffDays = Math.ceil(30 - (now.getTime() - lastTest.getTime()) / (1000 * 60 * 60 * 24));
      return `Você pode refazer o teste em ${diffDays} dias.`;
    }

    return '';
  });

  // Delete account
  const showDeleteConfirm = ref(false);
  const deleteConfirmText = ref('');
  const deleteLoading = ref(false);
  const errorMsg = ref('');

  const levels = [
    { value: 'beginner', label: 'Beginner — Iniciante' },
    { value: 'elementary', label: 'Elementary — Básico' },
    { value: 'intermediate', label: 'Intermediate — Intermediário' },
    { value: 'advanced', label: 'Advanced — Avançado' },
  ];

  const models = [
    {
      group: 'Anthropic (Claude)',
      options: [
        {
          value: 'claude-haiku-4-5-20251001',
          label: 'Claude Haiku — Rápido e barato (padrão)',
        },
        { value: 'claude-sonnet-4-6', label: 'Claude Sonnet — Equilibrado' },
        { value: 'claude-opus-4-6', label: 'Claude Opus — Mais poderoso' },
      ],
    },
    {
      group: 'OpenAI',
      options: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini — Rápido e barato' },
        { value: 'gpt-4o', label: 'GPT-4o — Premium' },
      ],
    },
  ];

  const modelProvider = computed(() => {
    if (!selectedModel.value) return null;
    if (selectedModel.value.startsWith('claude')) return 'anthropic';
    if (
      selectedModel.value.startsWith('gpt') ||
      selectedModel.value.startsWith('o1')
    )
      return 'openai';
    return null;
  });

  const apiKeyHint = computed(() => {
    if (!selectedModel.value) return null;
    if (modelProvider.value === 'anthropic')
      return 'Insira sua chave Anthropic (sk-ant-...)';
    if (modelProvider.value === 'openai')
      return 'Insira sua chave OpenAI (sk-...)';
    return null;
  });

  const planLabel = computed(() => {
    const p = dashboardUser.value?.plan;
    if (p === 'practice') return 'Practice';
    if (p === 'fluent' || p === 'pro') return 'Fluent';
    return 'Free';
  });

  function applyTheme(dark: boolean) {
    document.documentElement.setAttribute(
      'data-theme',
      dark ? 'dark' : 'light',
    );
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    applyTheme(isDark.value);
  }

  function saveApiKey() {
    if (!apiKey.value.trim()) return;
    localStorage.setItem('userApiKey', apiKey.value.trim());
    apiKeySaved.value = true;
    setTimeout(() => {
      apiKeySaved.value = false;
    }, 2000);
  }

  function removeApiKey() {
    localStorage.removeItem('userApiKey');
    apiKey.value = '';
  }

  function onModelChange() {
    if (selectedModel.value) {
      localStorage.setItem('userModel', selectedModel.value);
    } else {
      localStorage.removeItem('userModel');
    }
    modelSaved.value = true;
    setTimeout(() => {
      modelSaved.value = false;
    }, 2000);
  }

  async function saveLevel() {
    if (!englishLevel.value) return;
    await auth.updateLevel(englishLevel.value);
    levelSaved.value = true;
    setTimeout(() => {
      levelSaved.value = false;
    }, 2000);
  }

  async function confirmDeleteAccount() {
    if (deleteConfirmText.value !== 'DELETAR') return;
    deleteLoading.value = true;
    await auth.deleteAccount();
    deleteLoading.value = false;
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    isDark.value = savedTheme === 'dark';

    const savedKey = localStorage.getItem('userApiKey');
    if (savedKey) apiKey.value = savedKey;

    const savedModel = localStorage.getItem('userModel');
    if (savedModel) selectedModel.value = savedModel;

    // Load the current level from the profile
    if (dashboardUser.value?.english_level) {
      englishLevel.value = dashboardUser.value.english_level;
    }
  });
</script>

<template>
  <div class="settings-container">
    <h1 class="page-title">Configurações</h1>

    <!-- Aparência -->
    <div class="settings-card">
      <h2 class="card-title">🎨 Aparência</h2>
      <div class="setting-row">
        <div>
          <p class="setting-label">Tema</p>
          <p class="setting-desc">
            {{ isDark ? 'Modo escuro ativado' : 'Modo claro ativado' }}
          </p>
        </div>
        <button class="toggle-btn" @click="toggleTheme">
          {{ isDark ? '☀️ Claro' : '🌙 Escuro' }}
        </button>
      </div>
    </div>

    <!-- Plano -->
    <div class="settings-card">
      <h2 class="card-title">💳 Plano atual</h2>
      <div class="setting-row">
        <div>
          <p class="setting-label">{{ planLabel }}</p>
          <p class="setting-desc">
            {{
              dashboardUser?.plan === 'free'
                ? '1 simulação a cada 2 dias'
                : dashboardUser?.plan === 'practice'
                ? '1 simulação por dia'
                : '3 simulações por dia'
            }}
          </p>
        </div>
        <router-link to="/pricing">
          <button class="btn-outline">Ver planos</button>
        </router-link>
      </div>
    </div>

    <!-- Modelo de IA -->
    <div v-if="dashboardUser?.plan !== 'free'" class="settings-card">
      <h2 class="card-title">🤖 Modelo de IA</h2>
      <p class="card-desc">
        Escolha o modelo usado nas simulações de entrevista.
      </p>

      <select v-model="selectedModel" class="select" @change="onModelChange">
        <option value="">⭐ Claude Haiku — Padrão incluso no seu plano</option>
        <optgroup label="Anthropic (Claude) — requer API key Anthropic">
          <option value="claude-sonnet-4-6">
            Claude Sonnet — Mais inteligente (usa sua key)
          </option>
          <option value="claude-opus-4-6">
            Claude Opus — Mais poderoso (usa sua key)
          </option>
        </optgroup>
        <optgroup label="OpenAI — requer API key OpenAI">
          <option value="gpt-4o-mini">
            GPT-4o Mini — Rápido (usa sua key)
          </option>
          <option value="gpt-4o">GPT-4o — Premium (usa sua key)</option>
        </optgroup>
      </select>

      <div v-if="!selectedModel" class="model-info success">
        ✅ Usando Claude Haiku — incluso no seu plano, sem custo adicional.
      </div>

      <div v-if="selectedModel" class="model-info warning">
        ⚠️ Este modelo usa sua API key própria. Certifique-se de ter adicionado
        sua chave
        {{
          modelProvider === 'anthropic'
            ? 'Anthropic (sk-ant-...)'
            : 'OpenAI (sk-...)'
        }}
        abaixo.
      </div>

      <p v-if="modelSaved" class="model-saved-msg">✅ Preferência salva!</p>
    </div>

    <!-- API Key -->
    <div v-if="dashboardUser?.plan === 'free'" class="settings-card">
      <h2 class="card-title">🔑 API Key própria</h2>
      <p class="card-desc">
        Use sua própria API key para entrevistas ilimitadas e acesso ao Tutor de IA. Disponível nos planos pagos.
      </p>
      <button class="btn-primary" @click="router.push('/pricing')">Ver planos</button>
    </div>
    <div v-else class="settings-card">
      <h2 class="card-title">🔑 API Key própria</h2>
      <p class="card-desc">
        Use sua própria API key para simulações ilimitadas. Sua chave é salva
        apenas neste dispositivo.
        {{
          modelProvider === 'openai' ? 'Necessário para modelos OpenAI.' : ''
        }}
        {{
          modelProvider === 'anthropic'
            ? 'Necessário para modelos Claude com sua conta.'
            : ''
        }}
      </p>
      <div class="input-row">
        <input
          :type="apiKeyVisible ? 'text' : 'password'"
          v-model="apiKey"
          :placeholder="modelProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'"
          class="input"
        />
        <button class="btn-icon" @click="apiKeyVisible = !apiKeyVisible">
          {{ apiKeyVisible ? '🙈' : '👁️' }}
        </button>
      </div>
      <div class="btn-row">
        <button class="btn-primary" @click="saveApiKey">
          {{ apiKeySaved ? '✅ Salvo!' : 'Salvar chave' }}
        </button>
        <button class="btn-ghost" @click="removeApiKey" v-if="apiKey">
          Remover
        </button>
      </div>
    </div>

    <!-- Nível de inglês -->
    <div class="settings-card">
      <h2 class="card-title">📚 Nível de inglês</h2>
      <p class="card-desc">
        Altere seu nível manualmente se achar que evoluiu.
      </p>
      <select v-model="englishLevel" class="select">
        <option value="" disabled>Selecione seu nível</option>
        <option v-for="l in levels" :key="l.value" :value="l.value">
          {{ l.label }}
        </option>
      </select>
      <button class="btn-primary" @click="saveLevel" :disabled="!englishLevel">
        {{ levelSaved ? '✅ Salvo!' : 'Salvar nível' }}
      </button>
    </div>

    <!-- Teste de Nivelamento -->
    <div class="settings-card">
      <h2 class="card-title">🎯 Teste de Nivelamento</h2>
      <p class="card-desc">
        Descubra seu nível de inglês com um teste completo de pronúncia, gramática e conversação.
      </p>

      <div v-if="(dashboardUser as any)?.placement_test_done_at" class="test-info">
        <p class="setting-desc">
          Último teste: {{ new Date((dashboardUser as any).placement_test_done_at).toLocaleDateString('pt-BR') }}
        </p>
        <p class="setting-desc">
          Nível atual: <strong>{{ (dashboardUser as any)?.english_level || 'beginner' }}</strong>
        </p>
      </div>

      <div v-if="!canTakeTest" class="model-info warning">
        {{ testBlockedReason }}
      </div>

      <button
        class="btn-primary"
        :disabled="!canTakeTest"
        @click="router.push('/placement-test')"
      >
        {{ canTakeTest ? '🎯 Fazer teste agora' : '🔒 Teste indisponível' }}
      </button>
    </div>

    <!-- Deletar conta -->
    <div class="settings-card danger-card">
      <h2 class="card-title danger">⚠️ Zona de perigo</h2>
      <p class="card-desc">
        Deletar sua conta é uma ação permanente e não pode ser desfeita. Todos
        os seus dados serão removidos.
      </p>

      <div v-if="!showDeleteConfirm">
        <button class="btn-danger" @click="showDeleteConfirm = true">
          Deletar minha conta
        </button>
      </div>

      <div v-else class="delete-confirm">
        <p class="setting-label">
          Digite <strong>DELETAR</strong> para confirmar:
        </p>
        <input
          v-model="deleteConfirmText"
          placeholder="DELETAR"
          class="input"
        />
        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
        <div class="btn-row">
          <button
            class="btn-danger"
            :disabled="deleteConfirmText !== 'DELETAR' || deleteLoading"
            @click="confirmDeleteAccount"
          >
            {{ deleteLoading ? 'Deletando...' : 'Confirmar exclusão' }}
          </button>
          <button
            class="btn-ghost"
            @click="
              showDeleteConfirm = false;
              deleteConfirmText = '';
            "
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .settings-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .page-title {
    font-size: 22px;
    font-weight: 700;
    color: white !important;
    margin-bottom: 4px;
  }
  .settings-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px;
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .danger-card {
    border: 1px solid #fecaca;
  }
  .model-saved-msg {
    font-size: 12px;
    color: var(--success);
    margin: 0;
  }
  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
  .card-title.danger {
    color: var(--danger);
  }
  .card-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.5;
  }
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .setting-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 2px;
  }
  .setting-desc {
    font-size: 12px;
    color: var(--text-tertiary);
    margin: 0;
  }
  .model-hint {
    background: #fef9c3;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 12px;
    color: #854d0e;
  }
  .model-hint p {
    margin: 0;
  }
  .input-row {
    display: flex;
    gap: 8px;
    align-items: center;
    overflow: hidden;
    max-width: 100%;
  }
  .input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    font-family: monospace;
    background: var(--card-bg);
    color: var(--text-primary);
    min-width: 0;
    max-width: 100%;
  }
  .input:focus {
    border-color: var(--accent);
  }
  .select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    background: var(--card-bg);
    color: var(--text-primary);
    cursor: pointer;
  }
  .select:focus {
    border-color: var(--accent);
  }
  .btn-row {
    display: flex;
    gap: 10px;
  }
  .btn-primary {
    flex: 1;
    padding: 11px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-primary:disabled {
    background: var(--border);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }
  .btn-ghost {
    flex: 1;
    padding: 11px;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 14px;
    cursor: pointer;
  }
  .btn-ghost:hover {
    background: var(--bg-secondary);
  }
  .btn-outline {
    padding: 8px 16px;
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-outline:hover {
    background: var(--bg-secondary);
  }
  .btn-icon {
    padding: 10px;
    background: var(--bg-secondary);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
  }
  .toggle-btn {
    padding: 8px 16px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-danger {
    flex: 1;
    padding: 11px;
    background: var(--danger);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-danger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .delete-confirm {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .error-msg {
    font-size: 12px;
    color: var(--danger);
    margin: 0;
  }
</style>
