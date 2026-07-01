import { describe, it, expect, vi, beforeEach } from 'vitest';
import Antd from 'ant-design-vue';
import { mount, flushPromises } from '@vue/test-utils';
import VoiceRecorder from '@/components/VoiceRecorder/VoiceRecorder.vue';

describe('VoiceRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records, stops and emits audio-recorded on submit', async () => {
    const wrapper = mount(VoiceRecorder, { global: { plugins: [Antd] } });

    await wrapper.find('button').trigger('click'); // Start Recording
    await flushPromises();

    const stopButton = wrapper.findAll('button').find((b) => b.text().includes('Stop'))!;
    await stopButton.trigger('click');
    await flushPromises();

    expect(wrapper.find('audio').exists()).toBe(true);

    const submitButton = wrapper.findAll('button').find((b) => b.text().includes('Submit Answer'))!;
    await submitButton.trigger('click');
    await flushPromises();

    const emitted = wrapper.emitted('audio-recorded');
    expect(emitted).toHaveLength(1);
    expect(emitted![0][0]).toBeInstanceOf(Blob);
  });

  it('shows an alert when microphone access fails', async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(
      new Error('Permission denied'),
    );
    const wrapper = mount(VoiceRecorder, { global: { plugins: [Antd] } });

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(global.alert).toHaveBeenCalledWith('Error accessing microphone: Permission denied');
  });
});
