import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import { vue2Options, vue3Composition } from '../fixtures'

describe('MCP Code Parser - Vue Computed Property Extraction (Options API)', () => {
  describe('Vue 2 Options API', () => {
    it('should extract computed properties from Vue 2 Options API component', () => {
      const code = `
        <script>
        export default {
          data() {
            return {
              count: 0,
              price: 10
            }
          },
          computed: {
            doubleCount() {
              return this.count * 2
            },
            totalPrice() {
              return this.count * this.price
            }
          }
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.computedProperties)).toBe(true)
      expect(result.optionsAPI?.computedProperties?.length).toBe(2)

      const computedProps = result.optionsAPI?.computedProperties || []
      const computedNames = computedProps.map(c => c.name)

      expect(computedNames).toContain('doubleCount')
      expect(computedNames).toContain('totalPrice')

      const doubleCount = computedProps.find(c => c.name === 'doubleCount')
      expect(doubleCount?.isGetter).toBe(true)
      expect(doubleCount?.isSetter).toBe(false)
    })

    it('should extract computed properties with getter and setter', () => {
      const code = `
        <script>
        export default {
          data() {
            return {
              count: 0
            }
          },
          computed: {
            doubleCount: {
              get() {
                return this.count * 2
              },
              set(value) {
                this.count = value / 2
              }
            }
          }
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeDefined()
      const computedProps = result.optionsAPI?.computedProperties || []

      const doubleCount = computedProps.find(c => c.name === 'doubleCount')
      expect(doubleCount?.isGetter).toBe(true)
      expect(doubleCount?.isSetter).toBe(true)
    })

    it('should extract computed properties from fixture', () => {
      const result = parseVue(vue2Options.vueOptionsDefault, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.computedProperties)).toBe(true)
    })
  })

  describe('Vue 3 Options API', () => {
    it('should extract computed properties from Vue 3 Options API component', () => {
      const code = `
        <script>
        import { defineComponent } from 'vue'
        
        export default defineComponent({
          data() {
            return {
              count: 0,
              items: [1, 2, 3]
            }
          },
          computed: {
            doubleCount() {
              return this.count * 2
            },
            itemCount() {
              return this.items.length
            }
          }
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeDefined()
      const computedProps = result.optionsAPI?.computedProperties || []

      const computedNames = computedProps.map(c => c.name)
      expect(computedNames).toContain('doubleCount')
      expect(computedNames).toContain('itemCount')
    })

    it('should extract computed properties with arrow functions', () => {
      const code = `
        <script>
        import { defineComponent } from 'vue'
        
        export default defineComponent({
          data() {
            return {
              count: 0
            }
          },
          computed: {
            doubleCount: () => {
              return this.count * 2
            }
          }
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeDefined()
      const computedProps = result.optionsAPI?.computedProperties || []

      expect(computedProps.find(c => c.name === 'doubleCount')).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle component without computed properties', () => {
      const code = `
        <script>
        export default {
          data() {
            return {
              count: 0
            }
          }
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeUndefined()
    })

    it('should handle component with empty computed object', () => {
      const code = `
        <script>
        export default {
          data() {
            return {
              count: 0
            }
          },
          computed: {}
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeUndefined()
    })

    it('should handle multiple computed properties with different formats', () => {
      const code = `
        <script>
        export default {
          data() {
            return {
              count: 0,
              price: 10
            }
          },
          computed: {
            // Method format
            doubleCount() {
              return this.count * 2
            },
            // Arrow function format
            totalPrice: () => {
              return this.count * this.price
            },
            // Object with getter and setter
            finalPrice: {
              get() {
                return this.totalPrice
              },
              set(value) {
                this.price = value / this.count
              }
            }
          }
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeDefined()
      const computedProps = result.optionsAPI?.computedProperties || []

      expect(computedProps.length).toBe(3)

      const doubleCount = computedProps.find(c => c.name === 'doubleCount')
      const totalPrice = computedProps.find(c => c.name === 'totalPrice')
      const finalPrice = computedProps.find(c => c.name === 'finalPrice')

      expect(doubleCount?.isGetter).toBe(true)
      expect(totalPrice?.isGetter).toBe(true)
      expect(finalPrice?.isGetter).toBe(true)
      expect(finalPrice?.isSetter).toBe(true)
    })

    it('should handle computed properties with complex logic', () => {
      const code = `
        <script>
        export default {
          data() {
            return {
              items: [1, 2, 3, 4, 5],
              threshold: 3
            }
          },
          computed: {
            filteredItems() {
              return this.items.filter(item => item > this.threshold)
            },
            itemSummary() {
              const filtered = this.filteredItems
              return {
                count: filtered.length,
                sum: filtered.reduce((acc, item) => acc + item, 0),
                average: filtered.length > 0 ? filtered.reduce((acc, item) => acc + item, 0) / filtered.length : 0
              }
            }
          }
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.computedProperties).toBeDefined()
      const computedProps = result.optionsAPI?.computedProperties || []

      expect(computedProps.find(c => c.name === 'filteredItems')).toBeDefined()
      expect(computedProps.find(c => c.name === 'itemSummary')).toBeDefined()
    })
  })
})
