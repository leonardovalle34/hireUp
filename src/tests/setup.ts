import { vi } from 'vitest';

// Mock do cliente Supabase — nenhum teste deve bater na rede real.
// Cada método de query encadeia (mockReturnThis) para suportar chains como
// supabase.from(...).select(...).eq(...).order(...); os testes individuais
// sobrescrevem os retornos necessários com vi.mocked(supabase.x).mockReturnValue(...).
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock da Web Speech API (não implementada no jsdom).
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
} as any;

global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text: string) => ({
  text,
  lang: '',
  rate: 1,
  pitch: 1,
  volume: 1,
  onstart: null,
  onend: null,
  onerror: null,
})) as any;

// Mock de MediaRecorder / getUserMedia (não implementados no jsdom), usados
// pelas telas de gravação de áudio (Interview, Tutor, PlacementTest).
class MockMediaRecorder {
  static isTypeSupported = vi.fn().mockReturnValue(true);
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  mimeType: string;
  constructor(_stream: unknown, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType || 'audio/webm';
  }
  start(..._args: unknown[]) {}
  stop() {
    this.ondataavailable?.({ data: new Blob(['fake-audio'], { type: this.mimeType }) });
    this.onstop?.();
  }
}
global.MediaRecorder = MockMediaRecorder as any;

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
  writable: true,
  configurable: true,
});

global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock de window.matchMedia (não implementado no jsdom), usado internamente
// pelo grid responsivo do ant-design-vue (a-row/a-col, a-form, a-card...).
global.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// window.open não é implementado de verdade no jsdom (loga "Not implemented").
global.open = vi.fn();
global.alert = vi.fn();

// Mock de AudioContext (não implementado no jsdom), usado pelo VoiceRecorder
// para "destravar" o áudio em iOS/Safari antes de gravar. Precisa ser uma
// function (não arrow function) para funcionar com `new AudioContext()`.
global.AudioContext = vi.fn().mockImplementation(function AudioContextMock() {
  return {
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}) as any;
