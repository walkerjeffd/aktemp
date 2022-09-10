import Vue from 'vue'

export function errorMessage (error) {
  if (!error) return error
  if (error.response) {
    if (error.response.data && error.response.data.message) {
      return error.response.data.message
    }
  }
  if (error.message) {
    return error.message
  }
  return error.toString() || 'Unknown error'
}

Vue.prototype.$errorMessage = errorMessage
