import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import DictionaryModal from '@/components/DictionaryModal/DictionaryModal.vue';
import { lookupWord, getHistory } from '@/services/dictionary';

vi.mock('@/services/dictionary', () => ({
  lookupWord: vi.fn(),
  saveToHistory: vi.fn(),
  getHistory: vi.fn().mockReturnValue([]),
  clearHistory: vi.fn(),
}));

const mockResult = {
  word: 'hello',
  phonetic: '/həˈloʊ/',
  audio_us: 'https://audio.example.com/hello-us.mp3',
  audio_uk: 'https://audio.example.com/hello-uk.mp3',
  translation_pt: 'olá',
  translation_en: 'hello',
  meanings: [
    { partOfSpeech: 'exclamation', definitions: ['Used as a greeting.'], synonyms: ['hi'], antonyms: ['goodbye'] },
  ],
};

describe('DictionaryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getHistory).mockReturnValue([]);
  });

  it('renders the input, direction button and search button', () => {
    const wrapper = mount(DictionaryModal);

    expect(wrapper.find('.dictionary-input').exists()).toBe(true);
    expect(wrapper.find('.direction-btn').exists()).toBe(true);
    expect(wrapper.find('.search-btn').exists()).toBe(true);
  });

  it('triggers a search when Enter is pressed in the input', async () => {
    vi.mocked(lookupWord).mockResolvedValue(mockResult);
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').setValue('hello');
    await wrapper.find('.dictionary-input').trigger('keyup.enter');
    await flushPromises();

    expect(lookupWord).toHaveBeenCalledWith('hello', 'en-pt');
  });

  it('triggers a search when the search button is clicked', async () => {
    vi.mocked(lookupWord).mockResolvedValue(mockResult);
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').setValue('hello');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    expect(lookupWord).toHaveBeenCalledWith('hello', 'en-pt');
  });

  it('toggles direction between EN-PT and PT-EN when the direction button is clicked', async () => {
    vi.mocked(lookupWord).mockResolvedValue(mockResult);
    const wrapper = mount(DictionaryModal);

    expect(wrapper.find('.direction-btn').text()).toBe('EN → PT');
    await wrapper.find('.direction-btn').trigger('click');
    expect(wrapper.find('.direction-btn').text()).toBe('PT → EN');

    await wrapper.find('.dictionary-input').setValue('olá');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    expect(lookupWord).toHaveBeenCalledWith('olá', 'pt-en');
  });

  it('shows a loading indicator while searching', async () => {
    let resolvePromise: (value: typeof mockResult) => void = () => {};
    vi.mocked(lookupWord).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').setValue('hello');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    expect(wrapper.find('.loading').exists()).toBe(true);

    resolvePromise(mockResult);
    await flushPromises();

    expect(wrapper.find('.loading').exists()).toBe(false);
  });

  it('shows an error message when the word is not found', async () => {
    vi.mocked(lookupWord).mockRejectedValue(new Error('Palavra não encontrada'));
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').setValue('asdkjaskdj');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    expect(wrapper.find('.error-message').exists()).toBe(true);
  });

  it('shows translation, phonetic, meanings, synonyms and antonyms on success', async () => {
    vi.mocked(lookupWord).mockResolvedValue(mockResult);
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').setValue('hello');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('olá');
    expect(text).toContain('/həˈloʊ/');
    expect(text).toContain('Used as a greeting.');
    expect(text).toContain('hi');
    expect(text).toContain('goodbye');
  });

  it('shows the English translation (not the original word) when searching in pt-en direction', async () => {
    vi.mocked(lookupWord).mockResolvedValue({
      word: 'casa',
      phonetic: null,
      audio_us: null,
      audio_uk: null,
      translation_pt: 'casa',
      translation_en: 'house',
      meanings: [],
    });
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.direction-btn').trigger('click');
    await wrapper.find('.dictionary-input').setValue('casa');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('house');
    expect(text.match(/casa/g)?.length).toBe(1);
  });

  it('shows both US and UK audio buttons when both accents exist, each playing its own file', async () => {
    vi.mocked(lookupWord).mockResolvedValue(mockResult);
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').setValue('hello');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    const audioButtons = wrapper.findAll('.audio-btn');
    expect(audioButtons).toHaveLength(2);
    expect(audioButtons[0].text()).toContain('US');
    expect(audioButtons[1].text()).toContain('UK');

    await audioButtons[0].trigger('click');
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    await audioButtons[1].trigger('click');
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });

  it('shows only the US button when only audio_us is available', async () => {
    vi.mocked(lookupWord).mockResolvedValue({ ...mockResult, audio_uk: null });
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').setValue('hello');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    const audioButtons = wrapper.findAll('.audio-btn');
    expect(audioButtons).toHaveLength(1);
    expect(audioButtons[0].text()).toContain('US');
  });

  it('does not show any audio button when both audio_us and audio_uk are null', async () => {
    vi.mocked(lookupWord).mockResolvedValue({ ...mockResult, audio_us: null, audio_uk: null });
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').setValue('hello');
    await wrapper.find('.search-btn').trigger('click');
    await flushPromises();

    expect(wrapper.find('.audio-btn').exists()).toBe(false);
  });

  it('emits close when clicking the overlay', async () => {
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.modal-overlay').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when clicking the close (X) button', async () => {
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.close-btn').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('automatically searches when mounted with an initialWord prop', async () => {
    vi.mocked(lookupWord).mockResolvedValue(mockResult);
    mount(DictionaryModal, { props: { initialWord: 'hello' } });
    await flushPromises();

    expect(lookupWord).toHaveBeenCalledWith('hello', 'en-pt');
  });

  it('does not show history before the input is focused', () => {
    vi.mocked(getHistory).mockReturnValue([{ word: 'hello', direction: 'en-pt', timestamp: 1 }]);

    const wrapper = mount(DictionaryModal);

    expect(wrapper.find('.history').exists()).toBe(false);
  });

  it('shows history as a list of options when the input is focused', async () => {
    vi.mocked(getHistory).mockReturnValue([
      { word: 'hello', direction: 'en-pt', timestamp: 1 },
      { word: 'world', direction: 'en-pt', timestamp: 2 },
    ]);

    const wrapper = mount(DictionaryModal);
    await wrapper.find('.dictionary-input').trigger('focus');

    expect(wrapper.find('.history').exists()).toBe(true);
    expect(wrapper.findAll('.history-item')).toHaveLength(2);
  });

  it('hides history when the input loses focus', async () => {
    vi.mocked(getHistory).mockReturnValue([{ word: 'hello', direction: 'en-pt', timestamp: 1 }]);

    const wrapper = mount(DictionaryModal);
    await wrapper.find('.dictionary-input').trigger('focus');
    expect(wrapper.find('.history').exists()).toBe(true);

    await wrapper.find('.dictionary-input').trigger('blur');

    expect(wrapper.find('.history').exists()).toBe(false);
  });

  it('searches the word and closes the history when an item is clicked', async () => {
    vi.mocked(getHistory).mockReturnValue([{ word: 'hello', direction: 'en-pt', timestamp: 1 }]);
    vi.mocked(lookupWord).mockResolvedValue(mockResult);
    const wrapper = mount(DictionaryModal);

    await wrapper.find('.dictionary-input').trigger('focus');
    await wrapper.find('.history-item').trigger('click');
    await flushPromises();

    expect(lookupWord).toHaveBeenCalledWith('hello', 'en-pt');
    expect(wrapper.find('.history').exists()).toBe(false);
  });
});
