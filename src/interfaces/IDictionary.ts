export type DictionaryDirection = 'en-pt' | 'pt-en';

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: string[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryResult {
  word: string;
  phonetic: string | null;
  audio_us: string | null;
  audio_uk: string | null;
  translation_pt: string | null;
  translation_en: string | null;
  meanings: DictionaryMeaning[];
}

export interface DictionaryHistoryEntry {
  word: string;
  direction: DictionaryDirection;
  timestamp: number;
}
