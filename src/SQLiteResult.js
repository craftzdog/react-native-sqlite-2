function SQLiteResult(error, insertId, rowsAffected, rows) {
  this.error = error
  this.insertId = insertId
  this.rowsAffected = rowsAffected
  this.rows = rows
}

export default SQLiteResult
