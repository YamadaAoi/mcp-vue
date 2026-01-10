import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export const useCounter = () => {
  const count: Ref<number> = ref(0)
  const doubled = computed(() => count.value * 2)

  return { count, doubled }
}

export default useCounter
