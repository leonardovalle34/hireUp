import type {
  DictionaryDirection,
  DictionaryResult,
  DictionaryMeaning,
  DictionaryHistoryEntry,
} from '@/interfaces/IDictionary';

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const FREE_DICTIONARY_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const HISTORY_KEY = 'dictionary_history';
const MAX_HISTORY = 20;

interface FreeDictionaryPhonetic {
  text?: string;
  audio?: string;
}

interface FreeDictionaryDefinition {
  definition: string;
}

interface FreeDictionaryMeaning {
  partOfSpeech: string;
  definitions: FreeDictionaryDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface FreeDictionaryEntry {
  phonetic?: string;
  phonetics?: FreeDictionaryPhonetic[];
  meanings?: FreeDictionaryMeaning[];
}

async function fetchTranslation(word: string, direction: DictionaryDirection): Promise<string> {
  const langpair = direction === 'en-pt' ? 'en|pt' : 'pt|en';
  const response = await fetch(`${MYMEMORY_URL}?q=${encodeURIComponent(word)}&langpair=${langpair}`);
  if (!response.ok) {
    throw new Error('Palavra não encontrada');
  }

  const data = await response.json();
  const translatedText = data?.responseData?.translatedText;
  if (!translatedText) {
    throw new Error('Palavra não encontrada');
  }

  return translatedText;
}

function findAccentAudio(phonetics: FreeDictionaryPhonetic[], accent: 'us' | 'uk'): string | null {
  const match = phonetics.find((p) => p.audio && p.audio.toLowerCase().includes(`-${accent}.mp3`));
  return match?.audio || null;
}

async function fetchDefinitions(word: string): Promise<{
  phonetic: string | null;
  audio_us: string | null;
  audio_uk: string | null;
  meanings: DictionaryMeaning[];
}> {
  try {
    const response = await fetch(`${FREE_DICTIONARY_URL}/${encodeURIComponent(word)}`);
    if (!response.ok) {
      return { phonetic: null, audio_us: null, audio_uk: null, meanings: [] };
    }

    const data: FreeDictionaryEntry[] = await response.json();
    const entry = data?.[0];
    if (!entry) {
      return { phonetic: null, audio_us: null, audio_uk: null, meanings: [] };
    }

    const phonetics = entry.phonetics || [];
    const phonetic = entry.phonetic || phonetics.find((p) => p.text)?.text || null;
    const audio_uk = findAccentAudio(phonetics, 'uk');
    const audio_us =
      findAccentAudio(phonetics, 'us') || phonetics.find((p) => p.audio && p.audio !== audio_uk)?.audio || null;
    const meanings: DictionaryMeaning[] = (entry.meanings || []).map((meaning) => ({
      partOfSpeech: meaning.partOfSpeech,
      definitions: (meaning.definitions || []).map((definition) => definition.definition),
      synonyms: meaning.synonyms || [],
      antonyms: meaning.antonyms || [],
    }));

    return { phonetic, audio_us, audio_uk, meanings };
  } catch {
    return { phonetic: null, audio_us: null, audio_uk: null, meanings: [] };
  }
}

export async function lookupWord(word: string, direction: DictionaryDirection): Promise<DictionaryResult> {
  const normalizedWord = word.trim().toLowerCase();
  const translatedText = await fetchTranslation(normalizedWord, direction);

  const translation_pt = direction === 'en-pt' ? translatedText : normalizedWord;
  const translation_en = direction === 'en-pt' ? normalizedWord : translatedText;

  const { phonetic, audio_us, audio_uk, meanings } = await fetchDefinitions(translation_en.trim().toLowerCase());

  return {
    word: normalizedWord,
    phonetic,
    audio_us,
    audio_uk,
    translation_pt,
    translation_en,
    meanings,
  };
}

export function saveToHistory(word: string, direction: DictionaryDirection): void {
  const normalizedWord = word.trim().toLowerCase();
  const history = getHistory().filter(
    (entry) => !(entry.word === normalizedWord && entry.direction === direction),
  );
  history.unshift({ word: normalizedWord, direction, timestamp: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function getHistory(): DictionaryHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
