AKTEMP API
==========

> Jeffrey D Walker, PhD | Walker Environmental Research LLC  
> Developed for Becky Shaftel and Marcus Geist | Univ. Alaska Anchorage with funding from US EPA

## Dependencies

Install local dependencies

```bash
npm install
```

## Configuration

Define the database connection parameters in a `.env*` file based on the [`dotenv-flow`](https://www.npmjs.com/package/dotenv-flow) conventions (e.g. `.env.development.local` and `.env.production.local`).

Required values are listed in `.env`.

## Routes

### Public Routes

Public endpoints are accessed within the `/public` root URL.

```text
GET /stations                # fetch list of stations
GET /stations/:id            # fetch single station
GET /stations/:id/series     # fetch series for station
GET /stations/:id/profiles   # fetch profiles for station
```

### Restricted Routes

Restricted endpoints are accessed within the `/restricted` root URL and require user authentication via cognito.

```text
# user must belong to provider or be admin
GET    /providers/:id/stations                # fetch list of stations
POST   /providers/:id/stations                # create new station
GET    /providers/:id/stations/:id            # fetch single station
PUT    /providers/:id/stations/:id            # update single station
DELETE /providers/:id/stations/:id            # delete single station

POST   /providers/:id/stations/:id/files      # upload data file
PUT    /providers/:id/stations/:id/files/:id  # update data file
DELETE /providers/:id/stations/:id/files/:id  # delete data file and associated series or profiles
POST   /providers/:id/stations/:id/files/:id/process # trigger batch processor
```

## File Upload Process

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
