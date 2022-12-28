const program = require('commander')
const { processDownload } = require('../lib/downloads')
const { printTable } = require('../lib/utils')
const { Download } = require('aktemp-db/models')

function printDownloads (rows, columns = ['id', 'status', 'url']) {
  printTable(rows, columns)
}

program
  .command('process <id>')
  .option('-d, --dry-run', 'Only create files, do not send email')
  .description('Process download request')
  .action(async (id, options) => {
    try {
      const download = await processDownload(id, options)
      printDownloads([download])
    } catch (err) {
      console.log(`failed to process download request (id=${id})`)
      console.log(err)
      if (!options.dryRun) {
        const download = await Download.query().findById(id)
        if (download) {
          await download.$query().patch({
            status: 'FAILED',
            error: err.toString()
          })
        }
      }
    }
  })

program.parseAsync(process.argv)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.toString())
    process.exit(1)
  })
