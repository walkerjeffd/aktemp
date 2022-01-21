# AKTEMP Database Schema and Migrations

> Jeffrey D Walker, PhD | Walker Environmental Research LLC  
> Developed for Becky Shaftel and Marcus Geist | Univ. Alaska Anchorage with funding from US EPA

## Dependencies

Install global `knex` cli

```bash
npm install -g knex
```

Install local dependencies

```bash
npm install
```

## Configuration

Define the database connection parameters in a `.env*` file based on the [`dotenv-flow`](https://www.npmjs.com/package/dotenv-flow) conventions (e.g. `.env.development.local` and `.env.production.local`).

Required values are listed in `.env`.

## Migrations

Export the appropriate node environment (defaults to `development` if not specified).

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
knex migrate:latest
knex migrate:rollback # last batch
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
knex seed:run # runs all seed files
```

## ORM

A database ORM is provided using [`objection.js`](https://vincit.github.io/objection.js/). Database models and relationships are defined in the `./models/` folder. See the [User Guide](https://vincit.github.io/objection.js/guide/) for help.
