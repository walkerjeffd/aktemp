exports.seed = knex => knex('users_organizations').del()
  .then(() => knex('users_organizations').insert([
    { user_id: 'e31729fb-09dd-40ab-bea6-af098086eb57', organization_id: 1 }
  ]))
