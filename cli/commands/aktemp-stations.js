const program = require('commander')
const { findStations, deleteStation, importStationsFromFile } = require('../lib/stations')
const { printTable } = require('../lib/utils')

function printStations (rows, columns = ['id', 'organization_code', 'code', 'latitude', 'longitude']) {
  printTable(rows, columns)
}

program
  .command('list [organizationCode]')
  .description('List stations')
  .action(async function (organizationCode) {
    const rows = await findStations(organizationCode)
    printStations(rows)
  })

program
  .command('import <organizationCode> <file>')
  .description('Import stations from csv file')
  .action(async function (organizationCode, filepath) {
    const rows = await importStationsFromFile(organizationCode, filepath)
    printStations(rows, ['id', 'code', 'latitude', 'longitude'])
  })

program
  .command('delete <id>')
  .description('Delete an station')
  .action(async function (id) {
    const row = await deleteStation(id)
    printStations([row])
  })

program.parseAsync(process.argv)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.toString())
    process.exit(1)
  })
