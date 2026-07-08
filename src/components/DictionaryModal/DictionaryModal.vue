<script lang="ts">
export default { name: 'DictionaryModal' };
</script>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { lookupWord, saveToHistory, getHistory } from '@/services/dictionary';
import type { DictionaryDirection, DictionaryResult, DictionaryHistoryEntry } from '@/interfaces/IDictionary';

const props = withDefaults(
  defineProps<{ initialWord?: string; initialDirection?: DictionaryDirection }>(),
  { initialWord: '', initialDirection: 'en-pt' },
);
const emit = defineEmits<{ close: [] }>();

const query = ref(props.initialWord);
const direction = ref<DictionaryDirection>(props.initialDirection);
const loading = ref(false);
const error = ref('');
const result = ref<DictionaryResult | null>(null);
const history = ref<DictionaryHistoryEntry[]>(getHistory());
const showHistory = ref(false);
const resultDirection = ref<DictionaryDirection>(props.initialDirection);

function toggleDirection() {
  direction.value = direction.value === 'en-pt' ? 'pt-en' : 'en-pt';
}

async function search(word?: string) {
  const term = (word ?? query.value).trim();
  if (!term) return;

  const searchDirection = direction.value;
  query.value = term;
  showHistory.value = false;
  loading.value = true;
  error.value = '';
  result.value = null;

  try {
    const data = await lookupWord(term, searchDirection);
    result.value = data;
    resultDirection.value = searchDirection;
    saveToHistory(data.word, searchDirection);
    history.value = getHistory();
  } catch {
    error.value = 'Palavra não encontrada.';
  } finally {
    loading.value = false;
  }
}

function selectHistoryWord(entry: DictionaryHistoryEntry) {
  direction.value = entry.direction;
  showHistory.value = false;
  search(entry.word);
}

function playAudio(accent: 'us' | 'uk') {
  const url = accent === 'us' ? result.value?.audio_us : result.value?.audio_uk;
  if (!url) return;
  new Audio(url).play();
}

function close() {
  emit('close');
}

onMounted(() => {
  if (props.initialWord) {
    search(props.initialWord);
  }
});
</script>

<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-card">
      <button class="close-btn" @click="close">✕</button>

      <div class="search-bar">
        <div class="input-wrapper">
          <input
            v-model="query"
            class="dictionary-input"
            type="text"
            placeholder="Digite uma palavra..."
            @focus="showHistory = true"
            @blur="showHistory = false"
            @keyup.enter="search()"
          />
          <ul v-if="showHistory && history.length" class="history" @mousedown.prevent>
            <li
              v-for="(entry, index) in history"
              :key="index"
              class="history-item"
              @click="selectHistoryWord(entry)"
            >
              {{ entry.word }}
            </li>
          </ul>
        </div>
        <button class="direction-btn" @click="toggleDirection">
          {{ direction === 'en-pt' ? 'EN → PT' : 'PT → EN' }}
        </button>
        <button class="search-btn" @click="search()">Buscar</button>
      </div>

      <div v-if="loading" class="loading">Buscando...</div>

      <div v-else-if="error" class="error-message">{{ error }}</div>

      <div v-else-if="result" class="result">
        <div class="result-header">
          <div class="word-meta">
            <span class="word-label">{{ result.word }}</span>
            <span v-if="result.phonetic" class="phonetic">{{ result.phonetic }}</span>
          </div>
          <div class="audio-buttons">
            <button
              v-if="result.audio_us"
              class="audio-btn"
              aria-label="Ouvir pronúncia americana"
              title="Pronúncia americana"
              @click="playAudio('us')"
            >
              🔊 US
            </button>
            <button
              v-if="result.audio_uk"
              class="audio-btn"
              aria-label="Ouvir pronúncia britânica"
              title="Pronúncia britânica"
              @click="playAudio('uk')"
            >
              🔊 UK
            </button>
          </div>
        </div>

        <p class="translation">
          {{ resultDirection === 'en-pt' ? result.translation_pt : result.translation_en }}
        </p>

        <div v-for="(meaning, index) in result.meanings" :key="index" class="meaning">
          <p class="part-of-speech">{{ meaning.partOfSpeech }}</p>
          <ul class="definitions">
            <li v-for="(definition, defIndex) in meaning.definitions" :key="defIndex">{{ definition }}</li>
          </ul>
          <p v-if="meaning.synonyms.length" class="synonyms"><strong>Sinônimos:</strong> {{ meaning.synonyms.join(', ') }}</p>
          <p v-if="meaning.antonyms.length" class="antonyms"><strong>Antônimos:</strong> {{ meaning.antonyms.join(', ') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 3000;
  padding: 16px;
  padding-top: max(56px, env(safe-area-inset-top, 0px) + 32px);
  overflow-y: auto;
}
.modal-card {
  background: var(--card-bg);
  border-radius: 18px;
  padding: 24px 20px;
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: var(--card-shadow);
  position: relative;
}
.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  font-size: 16px;
  color: var(--text-tertiary);
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}
.search-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 24px;
}
.input-wrapper {
  position: relative;
  width: 100%;
}
.dictionary-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card-bg);
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
}
.dictionary-input:focus {
  outline: none;
  border-color: var(--accent);
}
.direction-btn,
.search-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: var(--accent);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-sizing: border-box;
}
.direction-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.loading,
.error-message {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
  padding: 20px 0;
}
.result {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.word-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.word-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.phonetic {
  color: var(--text-tertiary);
  font-size: 12px;
}
.audio-buttons {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.audio-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
.translation {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: -8px;
}
.meaning {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 12px 14px;
}
.part-of-speech {
  font-weight: 700;
  color: var(--accent);
  font-size: 12px;
  font-style: italic;
  text-transform: capitalize;
}
.definitions {
  padding-left: 18px;
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.synonyms,
.antonyms {
  font-size: 12px;
  color: var(--text-secondary);
}
.history {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--card-shadow);
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 10;
}
.history-item {
  padding: 10px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
}
.history-item:hover {
  background: var(--bg-secondary);
}
</style>
