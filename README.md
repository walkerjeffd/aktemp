Alaska Stream Temperature Database (AKTEMP)
===========================================


## Development

### CLI

Link CLI

```
npm link
aktemp help
```

### Datasets

Copy AKOATS files to `r/data/`

- `lake_data_for_JeffW.csv`: NPS data for lakes
- `littleSu_data_for_jeff.csv`: UAA data for streams

Run R targets

```r
source("_targets.R")
tar_make()
```

### Database

Configure database connection in `.env.development.local`

Create database

```sh
createdb aktemp
```

Run migration and seed

```sh
npm i -g knex       # install knex cli
knex migrate:latest
knex seed:run
```

Load organizations, stations and files using cli

```sh
# NPS
aktemp organizations import r/export/nps/organization.csv
aktemp stations import -o NPS r/export/nps/stations.csv
aktemp files import -o NPS -d r/export/nps/files -c r/export/nps/config.json r/export/nps/filelist.csv

# UAA
aktemp organizations import r/export/uaa/organization.csv
aktemp stations import -o UAA r/export/uaa/stations.csv
aktemp files import -o UAA -d r/export/uaa/files -c r/export/uaa/config.json r/export/uaa/filelist.csv
```

Process files

```sh
node batch/process.js files --all
```

