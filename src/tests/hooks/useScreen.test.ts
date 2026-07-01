import { describe, it, expect, vi, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useScreen } from '@/hooks/useScreen';

function setWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
}

function mountUseScreen() {
  let exposed: any;
  const TestComponent = defineComponent({
    setup() {
      exposed = useScreen();
      return () => h('div');
    },
  });
  const wrapper = mount(TestComponent);
  return { wrapper, exposed };
}

describe('useScreen', () => {
  const originalWidth = window.innerWidth;

  afterEach(() => {
    setWindowWidth(originalWidth);
  });

  it('detects a mobile screen (width <= 768px) on mount', () => {
    setWindowWidth(500);
    const { exposed } = mountUseScreen();

    expect(exposed.isMobile.value).toBe(true);
  });

  it('detects a desktop screen (width > 768px) on mount', () => {
    setWindowWidth(1200);
    const { exposed } = mountUseScreen();

    expect(exposed.isMobile.value).toBe(false);
  });

  it('updates isMobile when the resize event fires', () => {
    setWindowWidth(1200);
    const { exposed } = mountUseScreen();
    expect(exposed.isMobile.value).toBe(false);

    setWindowWidth(400);
    window.dispatchEvent(new Event('resize'));

    expect(exposed.isMobile.value).toBe(true);
  });

  it('removes the resize listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { wrapper } = mountUseScreen();

    wrapper.unmount();

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeSpy.mockRestore();
  });
});
