const program = require('commander')
const { findProviders, deleteProvider, importProvidersFromFile } = require('../lib/providers')

const { printTable } = require('../lib/utils')

function printProviders (rows, columns = ['id', 'code', 'name']) {
  printTable(rows, columns)
}

program
  .command('list')
  .description('List providers')
  .action(async function () {
    const rows = await findProviders()
    printProviders(rows)
  })

program
  .command('import <file>')
  .description('Import providers from file')
  .action(async function (filepath) {
    const rows = await importProvidersFromFile(filepath)
    printProviders(rows)
  }
  )

program
  .command('delete <id>')
  .description('Delete a provider')
  .action(async function (id) {
    const row = await deleteProvider(id)
    printProviders([row])
  })

program.parseAsync(process.argv)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.toString())
    process.exit(1)
  })
