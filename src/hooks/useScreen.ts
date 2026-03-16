import { ref, onMounted, onUnmounted } from 'vue';

export function useScreen() {
  const isMobile = ref(false);

  function checkScreen() {
    isMobile.value = window.innerWidth <= 768;
  }

  onMounted(() => {
    checkScreen();
    window.addEventListener('resize', checkScreen);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', checkScreen);
  });

  return {
    isMobile,
    checkScreen,
  };
}