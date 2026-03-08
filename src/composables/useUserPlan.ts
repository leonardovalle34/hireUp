import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useUserPlan() {
  const auth = useAuthStore()
  const plan = computed(() => auth.profile?.plan || 'free')
  const isFree = computed(() => plan.value === 'free')
  const isPro = computed(() => plan.value === 'pro')

  return {
    plan,
    isFree,
    isPro,
  }
}
