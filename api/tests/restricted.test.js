/* eslint-env jest */
const app = require('../app')
const knex = require('aktemp-db')

const request = require('supertest')

describe('restricted api', () => {
  beforeAll(async () => {
    await knex.migrate.latest()
    await knex.seed.run()
  })

  afterAll(async () => {
    await knex.migrate.rollback()
    await knex.destroy()
  })

  describe('root', () => {
    test('GET / (unauthorized, 401)', async () => {
      const response = await request(app)
        .get('/restricted')
      expect(response.statusCode).toBe(401)
    })

    test('GET / (wrong password, 401)', async () => {
      const response = await request(app)
        .get('/restricted')
        .auth('user', 'wrong')
      expect(response.statusCode).toBe(401)
    })

    test('GET / (wrong username, 401)', async () => {
      const response = await request(app)
        .get('/restricted')
        .auth('wrong', 'user')
      expect(response.statusCode).toBe(401)
    })

    test('GET / (authorized, 200)', async () => {
      const response = await request(app)
        .get('/restricted')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
    })
  })

  describe('providers', () => {
    test('GET /providers/:id', async () => {
      const response = await request(app)
        .get('/restricted/providers/1')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('id', 1)
      expect(response.body).toHaveProperty('code', 'UAA')
    })

    test('GET /providers/:id/stations', async () => {
      const response = await request(app)
        .get('/restricted/providers/1/stations')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveLength(3)
    })

    test('GET /providers/:id/stations/:id', async () => {
      const response = await request(app)
        .get('/restricted/providers/1/stations/1')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('code')
    })

    test('GET /providers/:id/stations/100 (404)', async () => {
      const response = await request(app)
        .get('/restricted/providers/1/stations/100')
        .auth('user', 'user')
      expect(response.statusCode).toBe(404)
    })
  })

  describe('files', () => {
    test('GET /files', async () => {
      const response = await request(app)
        .get('/restricted/files')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveLength(1)
    })
    test('GET /files/:id', async () => {
      const response = await request(app)
        .get('/restricted/files/1')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('filename', 'UAA_001.csv')
    })
  })

  describe('provider/stations', () => {
    const station = {
      code: 'Test Station',
      latitude: 40,
      longitude: -70,
      timezone: 'US/Alaska'
    }
    let stationId
    test('POST /providers/:id/stations', async () => {
      const response = await request(app)
        .post('/restricted/providers/1/stations')
        .auth('user', 'user')
        .send(station)
      expect(response.statusCode).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('provider_id', 1)
      expect(response.body).toHaveProperty('code', station.code)
      stationId = response.body.id
    })
    test('POST /providers/:id/stations (conflict 409)', async () => {
      const response = await request(app)
        .post('/restricted/providers/1/stations')
        .auth('user', 'user')
        .send(station)
      expect(response.statusCode).toBe(409)
      expect(response.body.message).toBe('Station code (\'Test Station\') already exists for this provider.')
    })
    test('GET /providers/:id/stations (unauthorized 401)', async () => {
      const response = await request(app)
        .get('/restricted/providers/1/stations')
      expect(response.statusCode).toBe(401)
    })
    test('GET /providers/:id/stations/:id', async () => {
      const response = await request(app)
        .get(`/restricted/providers/1/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('id', stationId)
      expect(response.body).toHaveProperty('code', station.code)
    })
    test('GET /providers/:id/stations/:id (unauthorized 401)', async () => {
      const response = await request(app)
        .get(`/restricted/providers/1/stations/${stationId}`)
      expect(response.statusCode).toBe(401)
    })
    test('PUT /providers/:id/stations/:id', async () => {
      const response = await request(app)
        .put(`/restricted/providers/1/stations/${stationId}`)
        .auth('user', 'user')
        .send({
          code: 'Test Station (updated)'
        })
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('id', stationId)
      expect(response.body).toHaveProperty('code', 'Test Station (updated)')
    })
    test('GET /providers/:id/stations/:id (post-update)', async () => {
      const response = await request(app)
        .get(`/restricted/providers/1/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('id', stationId)
      expect(response.body).toHaveProperty('code', 'Test Station (updated)')
    })
    test('DELETE /providers/:id/stations/:id', async () => {
      const response = await request(app)
        .delete(`/restricted/providers/1/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(204)
    })
    test('GET /providers/:id/stations/:id (post-delete, 404)', async () => {
      const response = await request(app)
        .get('/restricted/providers/1/stations/100')
        .auth('user', 'user')
      expect(response.statusCode).toBe(404)
    })
  })

  describe('provider/files', () => {
    const file = {
      filename: 'test.csv',
      type: 'SERIES',
      config: '{}'
    }
    let fileId
    test('POST /providers/:id/files', async () => {
      const response = await request(app)
        .post('/restricted/providers/1/files')
        .auth('user', 'user')
        .send(file)
      expect(response.statusCode).toBe(201)
      expect(response.body).toHaveProperty('filename', file.filename)
      expect(response.body).toHaveProperty('status', 'CREATED')
      expect(response.body).toHaveProperty('uuid')
      expect(response.body.uuid).toBeTruthy()
      expect(response.body).toHaveProperty('user_id', 'abc-123')
      expect(response.body).toHaveProperty('provider_id', 1)
      expect(response.body).toHaveProperty('s3.Bucket', 'test-bucket')
      expect(response.body).toHaveProperty('s3.Key')
      expect(response.body.error).toBeNull()
      fileId = response.body.id
    })
    test('POST /providers/:id/files (unauthorized, 401)', async () => {
      const response = await request(app)
        .post('/restricted/providers/1/files')
        .send(file)
      expect(response.statusCode).toBe(401)
    })
    test('GET /providers/:id/files/', async () => {
      const response = await request(app)
        .get('/restricted/providers/1/files/')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveLength(2)
    })
    test('GET /providers/:id/files/:id', async () => {
      const response = await request(app)
        .get(`/restricted/providers/1/files/${fileId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('filename', file.filename)
    })
  })
})
