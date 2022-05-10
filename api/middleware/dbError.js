const {
  ValidationError,
  NotFoundError,
  DBError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError
} = require('objection')

function databaseErrorHandler (err, req, res, next) {
  if (err instanceof ValidationError) {
    switch (err.type) {
      case 'ModelValidation':
        res.status(400).send({
          message: err.message,
          type: err.type,
          data: err.data
        })
        break
      case 'RelationExpression':
        res.status(400).send({
          message: err.message,
          type: 'RelationExpression',
          data: {}
        })
        break
      case 'UnallowedRelation':
        res.status(400).send({
          message: err.message,
          type: err.type,
          data: {}
        })
        break
      case 'InvalidGraph':
        res.status(400).send({
          message: err.message,
          type: err.type,
          data: {}
        })
        break
      default:
        res.status(400).send({
          message: err.message,
          type: 'UnknownValidationError',
          data: {}
        })
        break
    }
  } else if (err instanceof NotFoundError) {
    return res.status(404).send({
      message: err.message,
      type: 'NotFound',
      data: {}
    })
  } else if (err instanceof UniqueViolationError) {
    if (err.constraint === 'stations_organization_id_code_unique') {
      res.status(409).send({
        message: 'Station code already exists for this organization, must be unique.',
        type: 'UniqueViolation',
        data: {
          columns: err.columns,
          table: err.table,
          constraint: err.constraint
        }
      })
    } else {
      res.status(409).send({
        message: err.message,
        type: 'UniqueViolation',
        data: {
          columns: err.columns,
          table: err.table,
          constraint: err.constraint
        }
      })
    }
  } else if (err instanceof NotNullViolationError) {
    res.status(400).send({
      message: err.message,
      type: 'NotNullViolation',
      data: {
        column: err.column,
        table: err.table
      }
    })
  } else if (err instanceof ForeignKeyViolationError) {
    res.status(409).send({
      message: err.message,
      type: 'ForeignKeyViolation',
      data: {
        table: err.table,
        constraint: err.constraint
      }
    })
  } else if (err instanceof CheckViolationError) {
    res.status(400).send({
      message: err.message,
      type: 'CheckViolation',
      data: {
        table: err.table,
        constraint: err.constraint
      }
    })
  } else if (err instanceof DataError) {
    res.status(400).send({
      message: err.message,
      type: 'InvalidData',
      data: {}
    })
  } else if (err instanceof DBError) {
    res.status(500).send({
      message: err.message,
      type: 'UnknownDatabaseError',
      data: {}
    })
  } else {
    next(err)
  }
}

module.exports = {
  databaseErrorHandler
}
