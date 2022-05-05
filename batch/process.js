const { program } = require('commander')
require('dotenv-flow').config({
  default_node_env: 'development'
})

const processFiles = require('./lib/processors')

program.command('files [ids...]')
  .option('-a, --all', 'all files')
  .option('-d, --dry-run', 'dry run')
  .description('Process files')
  .action(processFiles)

program.parseAsync(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err.toString())
    process.exit(1)
  })
