exports.seed = knex => knex('users').del()
  .then(() => knex('users').insert([
    { id: 'e31729fb-09dd-40ab-bea6-af098086eb57' },
    { id: '1bd55518-0a27-4d0b-a116-f371c05bae26' }
  ]))
