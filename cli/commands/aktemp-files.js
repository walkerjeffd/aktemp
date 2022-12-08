const program = require('commander')
const { findFiles, deleteFile, importFiles, processFile } = require('../lib/files')
const { printTable } = require('../lib/utils')
const { File } = require('aktemp-db/models')

function printFiles (rows, columns = ['id', 'organization_code', 'filename', 'status']) {
  printTable(rows, columns)
}

program
  .command('list [organizationCode]')
  .description('List files')
  .action(async function (organizationCode) {
    const rows = await findFiles(organizationCode)
    printFiles(rows)
  })

program
  .command('import <organizationCode> <file>')
  .requiredOption('-d, --directory <id>', 'Directory containing files')
  .description('Import data files from list')
  .action(async function (organizationCode, filepath, options) {
    const files = await importFiles(organizationCode, filepath, options)
    const importedFiles = files.filter(d => !d.error)
    const failedFiles = files.filter(d => !!d.error)

    console.log(`imported files (n=${importedFiles.length}):`)
    printFiles(importedFiles, ['id', 'filename', 'status'])

    console.log(`\nfailed files (n=${failedFiles.length}):`)
    printFiles(failedFiles, ['filename', 'error'])
  })

program
  .command('process <id>')
  .option('-d, --dry-run', 'Only parse file, do not save to database')
  .description('Process file')
  .action(async (id, options) => {
    try {
      const file = await processFile(id, options)
      let rows = []
      if (file.series.length > 0) {
        rows = file.series.map(d => ({
          file_id: d.file_id,
          series_id: d.id,
          start_datetime: d.start_datetime,
          end_datetime: d.end_datetime
        }))
      } else if (file.profiles.length > 0) {
        rows = file.profiles.map(d => ({
          file_id: d.file_id,
          profile_id: d.id,
          station_id: d.station_id,
          date: d.date.toISOString().substr(0, 10)
        }))
      }
      printFiles([file])
      console.log('')
      printTable(rows)
    } catch (err) {
      console.log(`failed to process file (id=${id})`)
      console.log(err)
      if (!options.dryRun) {
        const file = await File.query().findById(id)
        if (file) {
          await file.$query().patch({
            status: 'FAILED',
            error: err.toString()
          })
        }
      }
    }
  })

program
  .command('delete <id>')
  .description('Delete a file')
  .action(async function (id) {
    const row = await deleteFile(id)
    printFiles([row])
  })

program.parseAsync(process.argv)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.toString())
    process.exit(1)
  })
