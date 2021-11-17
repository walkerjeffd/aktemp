const { program } = require('commander')
require('dotenv-flow').config({
  default_node_env: 'development'
})

const { processFile } = require('./processors')

program.command('file <id>')
  .option('-d, --dry-run', 'dry run')
  .description('Process file')
  .action(processFile)

program.parseAsync(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    // console.error(e.toString())
    process.exit(1)
  })
