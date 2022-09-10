import Vue from 'vue'
import { saveAs } from 'file-saver'
import json2csv from 'json2csv'

function csv (rows, filename, fields) {
  const csv = json2csv.parse(rows, { fields: fields || Object.keys(rows[0]) })
  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8'
  })
  saveAs(blob, filename)
}

Vue.prototype.$download = {
  csv
}
