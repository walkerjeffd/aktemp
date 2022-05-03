exports.seed = knex => knex('users').del()
  .then(() => knex('users').insert([
    { id: 'abc-123' }
  ]))
