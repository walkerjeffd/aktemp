/* eslint-env jest */
const app = require('../app')
const knex = require('../db/knex')

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

  describe('organizations', () => {
    test('GET /organizations/:id', async () => {
      const response = await request(app)
        .get('/restricted/organizations/UAA')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('id', 'UAA')
    })

    test('GET /organizations/:id/stations', async () => {
      const response = await request(app)
        .get('/restricted/organizations/UAA/stations')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveLength(1)
    })

    test('GET /organizations/:id/stations/:id', async () => {
      const response = await request(app)
        .get('/restricted/organizations/UAA/stations/1')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('code')
    })

    test('GET /organizations/:id/stations/100 (404)', async () => {
      const response = await request(app)
        .get('/restricted/organizations/UAA/stations/100')
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

  describe('organization/stations', () => {
    const station = {
      code: 'Test Station',
      latitude: 40,
      longitude: -70,
      timezone: 'US/Alaska'
    }
    let stationId
    test('POST /organizations/:id/stations', async () => {
      const response = await request(app)
        .post('/restricted/organizations/UAA/stations')
        .auth('user', 'user')
        .send(station)
      expect(response.statusCode).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('organization_id', 'UAA')
      expect(response.body).toHaveProperty('code', station.code)
      stationId = response.body.id
    })
    test('GET /organizations/:id/stations (unauthorized 401)', async () => {
      const response = await request(app)
        .get('/restricted/organizations/UAA/stations')
      expect(response.statusCode).toBe(401)
    })
    test('GET /organizations/:id/stations/:id', async () => {
      const response = await request(app)
        .get(`/restricted/organizations/UAA/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('id', stationId)
      expect(response.body).toHaveProperty('code', station.code)
    })
    test('GET /organizations/:id/stations/:id (unauthorized 401)', async () => {
      const response = await request(app)
        .get(`/restricted/organizations/UAA/stations/${stationId}`)
      expect(response.statusCode).toBe(401)
    })
    test('PUT /organizations/:id/stations/:id', async () => {
      const response = await request(app)
        .put(`/restricted/organizations/UAA/stations/${stationId}`)
        .auth('user', 'user')
        .send({
          code: 'Test Station (updated)'
        })
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('id', stationId)
      expect(response.body).toHaveProperty('code', 'Test Station (updated)')
    })
    test('GET /organizations/:id/stations/:id (post-update)', async () => {
      const response = await request(app)
        .get(`/restricted/organizations/UAA/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('id', stationId)
      expect(response.body).toHaveProperty('code', 'Test Station (updated)')
    })
    test('DELETE /organizations/:id/stations/:id', async () => {
      const response = await request(app)
        .delete(`/restricted/organizations/UAA/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(204)
    })
    test('GET /organizations/:id/stations/:id (post-delete, 404)', async () => {
      const response = await request(app)
        .get('/restricted/organizations/UAA/stations/100')
        .auth('user', 'user')
      expect(response.statusCode).toBe(404)
    })
  })

  describe('organization/files', () => {
    const file = {
      filename: 'test.csv',
      config: '{}'
    }
    let fileId
    test('POST /organizations/:id/files', async () => {
      const response = await request(app)
        .post('/restricted/organizations/UAA/files')
        .auth('user', 'user')
        .send(file)
      expect(response.statusCode).toBe(201)
      expect(response.body).toHaveProperty('filename', file.filename)
      expect(response.body).toHaveProperty('status', 'CREATED')
      expect(response.body).toHaveProperty('uuid')
      expect(response.body.uuid).toBeTruthy()
      expect(response.body).toHaveProperty('user_id', 'abc-123')
      expect(response.body).toHaveProperty('organization_id', 'UAA')
      expect(response.body).toHaveProperty('s3.Bucket', 'test-bucket')
      expect(response.body).toHaveProperty('s3.Key')
      expect(response.body.error).toBeNull()
      fileId = response.body.id
    })
    test('POST /organizations/:id/files (unauthorized, 401)', async () => {
      const response = await request(app)
        .post('/restricted/organizations/UAA/files')
        .send(file)
      expect(response.statusCode).toBe(401)
    })
    test('GET /organizations/:id/files/', async () => {
      const response = await request(app)
        .get('/restricted/organizations/UAA/files/')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveLength(2)
    })
    test('GET /organizations/:id/files/:id', async () => {
      const response = await request(app)
        .get(`/restricted/organizations/UAA/files/${fileId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body).toHaveProperty('filename', file.filename)
    })
  })
})
