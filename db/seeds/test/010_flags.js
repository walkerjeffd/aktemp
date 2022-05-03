exports.seed = knex => knex('flags').del()
  .then(() => knex('flags').insert([
    { id: 'OTHER', description: 'Custom flag' },
    { id: 'OOW', description: 'Out of water' }
  ]))
