import Vue from 'vue'
import { luxon } from 'aktemp-utils/time'

Object.defineProperties(Vue.prototype, {
  $luxon: {
    get () {
      return luxon
    }
  }
})

window.luxon = luxon
