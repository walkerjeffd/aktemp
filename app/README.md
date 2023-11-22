AKTEMP Web Application
======================

The AKTEMP website is a Vue.js single page application (SPA) that provides a web interface for accessing and downloading data from the AKTEMP database.

## Project Setup

### Dependencies

First, install the local dependencies:

```sh
npm install
```

### Configuration

The web application is configured using environmental variables defined using `.env` files. See [Vue CLI Docs](https://cli.vuejs.org/guide/mode-and-env.html#environment-variables) for details on defining different `.env` files for different environments (e.g., `.env.development.local` and `.env.production.local`. Note that any `.env` file that ends in `.local` will not be tracked by git.

```sh
# base URL to web app
BASE_URL=/

# URL to AKTEMP API
VUE_APP_API_URL=

# AWS Cognito configuration
VUE_APP_COGNITO_REGION=
VUE_APP_COGNITO_USER_POOL_ID=
VUE_APP_COGNITO_CLIENT_ID=

# Recaptcha configuration
VUE_APP_RECAPTCHA_SITE_KEY=
```

## Development Server

To run a local development server with HOT reloading:

```sh
npm run serve
```

## Production Build

To build the application for production, run:

```sh
npm run build
```

The built files are then available in the `dist/` folder.

To deploy these files to the production web server, run:

```sh
npm run deploy
```

Note the target of this command is hard coded in the `package.json` file and would need to be changed to deploy to a different server.

## Staging Build

To build and deploy the application for staging, run:

```sh
npm run build:stage
npm run deploy:stage
```