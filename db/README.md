# AKTEMP Database Schema and Migrations

> Jeffrey D Walker, PhD | Walker Environmental Research LLC  
> Developed for Becky Shaftel and Marcus Geist | Univ. Alaska Anchorage with funding from US EPA

## Dependencies

Install `knex` globally in order to utilize the CLI:

```bash
npm install -g knex
```

Install local dependencies

```bash
npm install
```

## Configuration

After creating a database instance (locally or in the cloud), set the database credentials in the `.env` files as described in the `Configuration` section of the main [README](../README.md) file.

## Migrations

First, export the appropriate node environment to work the corresponding database (defaults to `development` if not specified).

```bash
export NODE_ENV=development
```

Use `knex` [Migration CLI](https://knexjs.org/#Migrations-CLI) to create, list, run or rollback migrations.

```bash
# create new migration
knex migrate:make migration_name

# check status
knex migrate:status

# migrate in batches
knex migrate:latest         # update schema to latest migration
knex migrate:rollback       # last batch
knex migrate:rollback --all # start fresh

# step by step
knex migrate:up
knex migrate:down
```

## Seeds

Database seeds are specified in the `./seeds` folder and grouped by node environment (e.g. `development`, `production`).

Use the `knex` [Seed CLI](https://knexjs.org/#Seeds-CLI) to create, list and run seed files.

```bash
knex seed:make seed_name # create new seed file
knex seed:run            # runs all seed files for current NODE_ENV
```

## ORM

A database ORM is provided using [`objection.js`](https://vincit.github.io/objection.js/). Database models and relationships are defined in the `./models/` folder. See the [User Guide](https://vincit.github.io/objection.js/guide/) for help.

