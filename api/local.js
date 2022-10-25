#!/usr/bin/env node
require('dotenv-flow').config({
  default_node_env: 'development',
  path: '..'
})

const app = require('./app')
const http = require('http')
const debug = require('debug')('aktemp-api')

debug('env:', process.env.NODE_ENV)
const port = normalizePort(process.env.PORT || '3000')
app.set('port', port)

const server = http.createServer(app)

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

process.on('unhandledRejection', error => {
  console.error('unhandledRejection: ' + error.toString())
  server.close(() => {
    process.exit(1)
  })
})

function normalizePort (val) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    return val
  }

  if (port >= 0) {
    return port
  }

  return false
}

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

function onListening () {
  const addr = server.address()
  debug('listening:', addr)
}
