#!/usr/bin/env node

const { program } = require('commander')

const { listOrganizations, importOrganizations } = require('./organizations')
const { listStations, createStation, importStations } = require('./stations')
const { listFiles, createFile, importFiles, deleteFile } = require('./files')

const organizations = program.command('organizations').description('Manage organizations')

organizations
  .command('list')
  .description('List organizations')
  .action(listOrganizations)

organizations
  .command('import <file>')
  .description('Import organizations from file')
  .action(importOrganizations)

const stations = program.command('stations').description('Manage stations')

stations
  .command('list')
  .description('List stations')
  .action(listStations)

stations
  .command('create')
  .requiredOption('-o, --organizationId <id>', 'Organization ID')
  .requiredOption('-c, --code <code>', 'Station code (unique in organization)')
  .requiredOption('-l, --latitude <latitude>', 'Latitude (decimal degrees)')
  .requiredOption('-n, --longitude <longitude>', 'Longitude (decimal degrees)')
  .requiredOption('-z, --timezone <timezone>', 'Timezone', 'US/Alaska')
  .description('Create new station')
  .action(createStation)

stations
  .command('import <file>')
  .requiredOption('-o, --organizationId <id>', 'Organization ID')
  .description('Import stations from csv file')
  .action(importStations)

const files = program.command('files').description('Manage files')

files
  .command('list')
  .description('List files')
  .action(listFiles)

files
  .command('create <file>')
  .requiredOption('-o, --organizationId <id>', 'Organization ID')
  .requiredOption('-c, --configFile <path>', 'Configuration file')
  .description('Create and upload a data file')
  .action(createFile)

files
  .command('import <filelist>')
  .requiredOption('-o, --organizationId <id>', 'Organization ID')
  .requiredOption('-c, --configFile <path>', 'Configuration file')
  .requiredOption('-d, --directory <id>', 'Directory containing files')
  .description('Import data files from list')
  .action(importFiles)

files
  .command('delete <id>')
  .description('Delete a file')
  .action(deleteFile)

program.parseAsync(process.argv)
  .then(() => {
    process.exit(0)
  })
  .catch((e) => {
    console.error(e.toString())
    process.exit(1)
  })
