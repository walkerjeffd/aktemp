import Vue from 'vue'
import * as chrono from 'chrono-node'

window.chrono = chrono

Object.defineProperties(Vue.prototype, {
  $chrono: {
    get () {
      return chrono
    }
  }
})
