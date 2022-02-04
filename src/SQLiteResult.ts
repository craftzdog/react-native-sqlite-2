export default class SQLiteResult {
  constructor(
    readonly error: Error | null,
    readonly insertId?: number | null,
    readonly rowsAffected?: number,
    readonly rows?: Array<any>
  ) {}
}
