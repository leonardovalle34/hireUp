<script lang="ts">
  export default { name: 'SettingsView' };
</script>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useAuthStore } from '@/stores/auth';
  import { storeToRefs } from 'pinia';
  import { supabase } from '@/lib/supabase';

  const auth = useAuthStore();
  const { dashboardUser } = storeToRefs(auth);

  // Tema
  const isDark = ref(false);

  // API Key
  const apiKey = ref('');
  const apiKeyVisible = ref(false);
  const apiKeySaved = ref(false);

  // Nível
  const englishLevel = ref('');
  const levelSaved = ref(false);

  // Delete account
  const showDeleteConfirm = ref(false);
  const deleteConfirmText = ref('');
  const deleteLoading = ref(false);

  const levels = [
    { value: 'beginner', label: 'Beginner — Iniciante' },
    { value: 'elementary', label: 'Elementary — Básico' },
    { value: 'intermediate', label: 'Intermediate — Intermediário' },
    { value: 'advanced', label: 'Advanced — Avançado' },
  ];

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

  async function saveLevel() {
    if (!englishLevel.value) return;
    const { error } = await supabase
      .from('profiles')
      .update({ english_level: englishLevel.value })
      .eq('id', dashboardUser.value?.id || '');

    if (!error) {
      levelSaved.value = true;
      setTimeout(() => {
        levelSaved.value = false;
      }, 2000);
    }
  }

  async function deleteAccount() {
    if (deleteConfirmText.value !== 'DELETAR') return;
    deleteLoading.value = true;
    try {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', dashboardUser.value?.id || '');
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    } finally {
      deleteLoading.value = false;
    }
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    isDark.value = savedTheme === 'dark';

    const savedKey = localStorage.getItem('userApiKey');
    if (savedKey) apiKey.value = savedKey;
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

    <!-- API Key -->
    <div class="settings-card">
      <h2 class="card-title">🔑 API Key própria</h2>
      <p class="card-desc">
        Use sua própria API key para simulações ilimitadas. Sua chave é salva
        apenas neste dispositivo.
      </p>
      <div class="input-row">
        <input
          :type="apiKeyVisible ? 'text' : 'password'"
          v-model="apiKey"
          placeholder="sk-... ou sk-ant-..."
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
        <div class="btn-row">
          <button
            class="btn-danger"
            :disabled="deleteConfirmText !== 'DELETAR' || deleteLoading"
            @click="deleteAccount"
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
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .page-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
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
  .input-row {
    display: flex;
    gap: 8px;
    align-items: center;
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
</style>
