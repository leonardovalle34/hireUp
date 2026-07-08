import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupWord, saveToHistory, getHistory, clearHistory } from '@/services/dictionary';

const HISTORY_KEY = 'dictionary_history';

function mockMyMemoryResponse(translatedText: string, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue({ responseData: { translatedText } }) };
}

function mockFreeDictionaryResponse(data: unknown, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(data) };
}

const freeDictionaryEntry = [
  {
    word: 'hello',
    phonetic: '/həˈloʊ/',
    phonetics: [
      { text: '/həˈləʊ/', audio: 'https://audio.example.com/hello-uk.mp3' },
      { text: '/heˈloʊ/', audio: 'https://audio.example.com/hello-us.mp3' },
    ],
    meanings: [
      {
        partOfSpeech: 'exclamation',
        definitions: [{ definition: 'Used as a greeting.', example: 'hello there!', synonyms: [], antonyms: [] }],
        synonyms: ['hi'],
        antonyms: ['goodbye'],
      },
    ],
  },
];

const freeDictionaryEntrySingleAccent = [
  {
    word: 'hello',
    phonetic: '/həˈloʊ/',
    phonetics: [{ text: '/həˈloʊ/', audio: 'https://audio.example.com/hello.mp3' }],
    meanings: [],
  },
];

describe('dictionary service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.clear();
  });

  describe('lookupWord', () => {
    it('calls MyMemory with langpair=en|pt AND Free Dictionary API for en-pt direction', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('olá') as any);
        return Promise.resolve(mockFreeDictionaryResponse(freeDictionaryEntry) as any);
      });

      await lookupWord('hello', 'en-pt');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('langpair=en|pt'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('dictionaryapi.dev/api/v2/entries/en/hello'));
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('calls MyMemory with langpair=pt|en AND Free Dictionary for the translated English word in pt-en direction', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('hello') as any);
        return Promise.resolve(mockFreeDictionaryResponse(freeDictionaryEntry) as any);
      });

      await lookupWord('olá', 'pt-en');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('langpair=pt|en'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('dictionaryapi.dev/api/v2/entries/en/hello'));
    });

    it('returns word, phonetic, audio_us, audio_uk, translation_pt, translation_en and meanings', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('olá') as any);
        return Promise.resolve(mockFreeDictionaryResponse(freeDictionaryEntry) as any);
      });

      const result = await lookupWord('hello', 'en-pt');

      expect(result).toEqual({
        word: 'hello',
        phonetic: '/həˈloʊ/',
        audio_us: 'https://audio.example.com/hello-us.mp3',
        audio_uk: 'https://audio.example.com/hello-uk.mp3',
        translation_pt: 'olá',
        translation_en: 'hello',
        meanings: [
          {
            partOfSpeech: 'exclamation',
            definitions: ['Used as a greeting.'],
            synonyms: ['hi'],
            antonyms: ['goodbye'],
          },
        ],
      });
    });

    it('falls back to whatever audio is available when the Free Dictionary entry has only one, unlabeled accent', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('olá') as any);
        return Promise.resolve(mockFreeDictionaryResponse(freeDictionaryEntrySingleAccent) as any);
      });

      const result = await lookupWord('hello', 'en-pt');

      expect(result.audio_us).toBe('https://audio.example.com/hello.mp3');
      expect(result.audio_uk).toBeNull();
    });

    it('trims and lowercases the word before searching', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('olá') as any);
        return Promise.resolve(mockFreeDictionaryResponse(freeDictionaryEntry) as any);
      });

      const result = await lookupWord('  HELLO  ', 'en-pt');

      expect(result.word).toBe('hello');
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('q=hello'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/entries/en/hello'));
    });

    it('returns empty meanings without throwing when Free Dictionary fails (network error)', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('olá') as any);
        return Promise.reject(new Error('network error'));
      });

      const result = await lookupWord('hello', 'en-pt');

      expect(result.meanings).toEqual([]);
      expect(result.translation_pt).toBe('olá');
    });

    it('returns empty meanings without throwing when Free Dictionary responds not-ok (word not found)', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('olá') as any);
        return Promise.resolve({ ok: false, json: vi.fn() } as any);
      });

      const result = await lookupWord('hello', 'en-pt');

      expect(result.meanings).toEqual([]);
    });

    it('returns phonetic, audio_us, audio_uk and meanings for the translated English word in pt-en direction', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('hello') as any);
        return Promise.resolve(mockFreeDictionaryResponse(freeDictionaryEntry) as any);
      });

      const result = await lookupWord('olá', 'pt-en');

      expect(result.translation_en).toBe('hello');
      expect(result.phonetic).toBe('/həˈloʊ/');
      expect(result.audio_us).toBe('https://audio.example.com/hello-us.mp3');
      expect(result.audio_uk).toBe('https://audio.example.com/hello-uk.mp3');
      expect(result.meanings).toEqual([
        {
          partOfSpeech: 'exclamation',
          definitions: ['Used as a greeting.'],
          synonyms: ['hi'],
          antonyms: ['goodbye'],
        },
      ]);
    });

    it('returns empty meanings without throwing when the translated word is not found in Free Dictionary (pt-en)', async () => {
      vi.mocked(global.fetch).mockImplementation((url: any) => {
        if (String(url).includes('mymemory')) return Promise.resolve(mockMyMemoryResponse('xyzzyunknown') as any);
        return Promise.resolve({ ok: false, json: vi.fn() } as any);
      });

      const result = await lookupWord('palavrainventada', 'pt-en');

      expect(result.meanings).toEqual([]);
      expect(result.phonetic).toBeNull();
      expect(result.audio_us).toBeNull();
      expect(result.audio_uk).toBeNull();
    });

    it('throws when MyMemory request fails', async () => {
      vi.mocked(global.fetch).mockResolvedValue({ ok: false, json: vi.fn() } as any);

      await expect(lookupWord('xyzzyunknown', 'en-pt')).rejects.toThrow();
    });
  });

  describe('saveToHistory', () => {
    it('saves an entry to localStorage', () => {
      saveToHistory('hello', 'en-pt');

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({ word: 'hello', direction: 'en-pt' });
    });

    it('caps history at 20 entries, discarding the oldest', () => {
      for (let i = 0; i < 25; i++) {
        saveToHistory(`word${i}`, 'en-pt');
      }

      const history = getHistory();
      expect(history).toHaveLength(20);
      expect(history[0].word).toBe('word24');
      expect(history.find((entry) => entry.word === 'word0')).toBeUndefined();
    });

    it('does not create duplicate entries for the same word and direction', () => {
      saveToHistory('hello', 'en-pt');
      saveToHistory('world', 'en-pt');
      saveToHistory('hello', 'en-pt');

      const history = getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].word).toBe('hello');
    });
  });

  describe('getHistory', () => {
    it('returns an empty array when there is no history', () => {
      expect(getHistory()).toEqual([]);
    });

    it('returns an empty array when localStorage data is corrupted', () => {
      localStorage.setItem(HISTORY_KEY, '{not-valid-json');

      expect(getHistory()).toEqual([]);
    });

    it('returns an empty array when localStorage data is not an array', () => {
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ not: 'an array' }));

      expect(getHistory()).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    it('removes the history key from localStorage', () => {
      saveToHistory('hello', 'en-pt');
      clearHistory();

      expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
      expect(getHistory()).toEqual([]);
    });
  });
});
