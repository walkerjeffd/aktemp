const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],
  publicPath: process.env.BASE_URL || '/',
  configureWebpack: {
    devtool: 'source-map'
  }
})
