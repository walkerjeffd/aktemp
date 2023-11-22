exports.seed = async knex => {
  await knex('flag_types').del()
  await knex('flag_types').insert([
    { id: 'OTHER', description: 'Other' },
    { id: 'BURIED', description: 'Buried logger' },
    { id: 'OOW', description: 'Out of water' },
    { id: 'ERROR', description: 'Logger error' }
  ])
}
