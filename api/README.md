AKTEMP API
==========

## Dependencies

Install local dependencies for API

```bash
npm install
```

## Configuration

See `Configuration` in [README.md](../README.md) for details on setting up the `.env` configuration files.

## Run Development Server

Run the `start` script to start a local development server:

```sh
export NODE_ENV=development # or production
npm run start
```

## Tests

Run automated unit tests via `jest`:

```sh
npm run test
```

Generate test coverage report

```sh
npm run test:coverage
```

## File Upload Process

The following roughly describes the file upload process:

```
app   -> POST /providers/:id/files
              body = { filename, config } -> api
api   -> insert { filename, config, status: 'CREATED' } into db://files (db adds uuid)
         create presignedUrl (s3://files/uuid)
         return { ...row, presignedUrl } -> app
app   -> upload file to presignedUrl (s3://files/uuid)
         PUT /providers/:id/stations/:id/files/{file.id}
             body={ status: 'UPLOADED' }
api   -> patch { status } in db://files/file.id
app   -> POST /providers/:id/stations/:id/files/{file.id}/process
              body=null
api   -> submit batch job (file.id)
         patch { status: 'QUEUED' } in db://files/file.id
batch -> patch { status: 'PROCESSING' } in db://files/file.id
         parse file using config
         insert [series/profiles] into db://{series/profiles}
         patch { status: 'DONE' or 'FAILED' } in db://files/file.id
```
