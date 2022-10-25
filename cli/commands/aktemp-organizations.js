const program = require('commander')
const { findOrganizations, deleteOrganization, importOrganizationsFromFile } = require('../lib/organizations')

const { printTable } = require('../lib/utils')

function printOrganizations (rows, columns = ['id', 'code', 'name']) {
  printTable(rows, columns)
}

program
  .command('list')
  .description('List organizations')
  .action(async function () {
    const rows = await findOrganizations()
    printOrganizations(rows)
  })

program
  .command('import <file>')
  .description('Import organizations from file')
  .action(async function (filepath) {
    const rows = await importOrganizationsFromFile(filepath)
    printOrganizations(rows)
  }
  )

program
  .command('delete <id>')
  .description('Delete an organization')
  .action(async function (id) {
    const row = await deleteOrganization(id)
    printOrganizations([row])
  })

program.parseAsync(process.argv)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.toString())
    process.exit(1)
  })
