import { useUserPlan } from './useUserPlan'
import { useRouter } from 'vue-router'

export function useRequirePremium() {
  const { isPro } = useUserPlan()
  const router = useRouter()

  if (!isPro.value) {
    router.push('/pricing')
  }
}
