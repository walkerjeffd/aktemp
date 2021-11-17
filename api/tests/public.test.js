/* eslint-env jest */
const app = require('../app')
const knex = require('../db/knex')

const request = require('supertest')

describe('public api', () => {
  beforeAll(async () => {
    await knex.migrate.latest()
    await knex.seed.run()
  })

  afterAll(async () => {
    await knex.migrate.rollback()
    await knex.destroy()
  })

  test('GET /', async () => {
    const response = await request(app).get('/public')
    expect(response.statusCode).toBe(200)
  })

  test('GET /stations', async () => {
    const response = await request(app).get('/public/stations')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBeTruthy()
  })

  test('GET /stations/:id', async () => {
    const response = await request(app).get('/public/stations/1')
    expect(response.statusCode).toBe(200)
    expect(response.body).toBeTruthy()
    expect(response.body.code).toBeDefined()
  })

  test('GET /stations/:id (404)', async () => {
    const response = await request(app).get('/public/stations/100')
    expect(response.statusCode).toBe(404)
    expect(response.body.code).toBeUndefined()
  })

  test('GET /stations/:id/series', async () => {
    const response = await request(app).get('/public/stations/1/series')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBeTruthy()
  })

  test('GET /stations/:id/profiles', async () => {
    const response = await request(app).get('/public/stations/1/profiles')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBeTruthy()
  })
})
