import Vue from 'vue'
import { saveAs } from 'file-saver'

Vue.prototype.$download = (body, filename) => {
  const blob = new Blob([body], {
    type: 'text/csv;charset=utf-8'
  })
  saveAs(blob, filename)
}
