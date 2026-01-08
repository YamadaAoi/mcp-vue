<template>
  <div>
    <h1>Vue2 Features Test</h1>

    <!-- Vue2 过滤器 -->
    <p>{{ message | capitalize }}</p>
    <p>{{ price | currency }}</p>
    <p>{{ date | formatDate('YYYY-MM-DD') }}</p>

    <!-- Vue2 v-model with .sync modifier -->
    <child-component :title.sync="pageTitle"></child-component>
    <child-component
      :value="inputValue"
      @input="inputValue = $event"
    ></child-component>

    <!-- Vue2 slot and slot-scope -->
    <slot-component>
      <template slot="header">
        <h2>Header Slot</h2>
      </template>

      <div slot="footer">
        <p>Footer Slot</p>
      </div>

      <template slot-scope="props">
        <p>Scoped slot: {{ props.text }}</p>
      </template>
    </slot-component>

    <!-- Vue2 event modifiers -->
    <button @click.stop="handleClick">Stop Propagation</button>
    <button @click.prevent="handleSubmit">Prevent Default</button>
    <button @click.stop.prevent="handleBoth">Both Modifiers</button>
    <input @keyup.enter="handleEnter" />
    <input @keyup.13="handleEnterKey" />

    <!-- Vue2 v-bind with .sync -->
    <sync-component :visible.sync="isVisible"></sync-component>
    <sync-component :value.sync="syncValue"></sync-component>

    <!-- Vue2 functional components -->
    <functional-component :items="items"></functional-component>

    <!-- Vue2 provide/inject -->
    <parent-component></parent-component>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'
import SlotComponent from './SlotComponent.vue'
import FunctionalComponent from './FunctionalComponent.vue'
import ParentComponent from './ParentComponent.vue'

export default {
  name: 'Vue2Features',

  components: {
    ChildComponent,
    SlotComponent,
    FunctionalComponent,
    ParentComponent
  },

  props: {
    initialMessage: {
      type: String,
      default: 'Hello Vue2'
    }
  },

  data() {
    return {
      message: 'hello world',
      price: 99.99,
      date: new Date(),
      pageTitle: 'Vue2 Test Page',
      inputValue: '',
      isVisible: false,
      syncValue: '',
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
    }
  },

  filters: {
    capitalize(value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },

    currency(value) {
      if (!value) return '$0.00'
      return '$' + value.toFixed(2)
    },

    formatDate(value, format) {
      if (!value) return ''
      return value.toLocaleDateString()
    }
  },

  methods: {
    handleClick() {
      console.log('Button clicked')
    },

    handleSubmit() {
      console.log('Form submitted')
    },

    handleBoth() {
      console.log('Both modifiers')
    },

    handleEnter() {
      console.log('Enter key pressed')
    },

    handleEnterKey() {
      console.log('Enter key (code 13) pressed')
    }
  },

  computed: {
    computedMessage() {
      return this.message.toUpperCase()
    }
  },

  watch: {
    inputValue(newVal, oldVal) {
      console.log(`Input changed from ${oldVal} to ${newVal}`)
    }
  },

  beforeCreate() {
    console.log('Vue2 beforeCreate')
  },

  created() {
    console.log('Vue2 created')
  },

  beforeMount() {
    console.log('Vue2 beforeMount')
  },

  mounted() {
    console.log('Vue2 mounted')
  },

  beforeUpdate() {
    console.log('Vue2 beforeUpdate')
  },

  updated() {
    console.log('Vue2 updated')
  },

  beforeDestroy() {
    console.log('Vue2 beforeDestroy')
  },

  destroyed() {
    console.log('Vue2 destroyed')
  }
}
</script>

<style scoped>
.vue2-features {
  padding: 20px;
}
</style>
