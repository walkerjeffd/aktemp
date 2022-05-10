exports.seed = knex => knex('users_organizations').del()
  .then(() => knex('users_organizations').insert([
    { user_id: 'abc-123', organization_id: 1 }
  ]))
