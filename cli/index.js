#!/usr/bin/env node

const path = require('path')
require('dotenv-flow').config({
  default_node_env: 'development',
  path: path.resolve(__dirname, '..'),
  silent: true
})

const { program } = require('commander')

program
  .name('aktemp')
  .version('0.1.0')
  .executableDir('./commands')
  .command('downloads', 'Process downloads')
  .command('organizations', 'Manage organizations')
  .command('files', 'Manage files')
  .command('stations', 'Manage stations')

program.parse(process.argv)
