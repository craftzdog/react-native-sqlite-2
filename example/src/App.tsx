import React, {Component} from 'react'
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native'

import SQLite from 'react-native-sqlite-2'
import type {
  WebsqlDatabase,
  SQLTransaction,
  SQLResultSet,
  SQLError,
} from 'react-native-sqlite-2'

function databaseName(name: string) {
  return name + '.' + Math.floor(Math.random() * 100000)
}

const database_name = 'test.db'
const database_version = '1.0'
const database_displayname = 'SQLite Test Database'
const database_size = 200000

interface Props {}
interface LogEntry {
  msg: string
  key: string
}
interface State {
  progress: Array<LogEntry>
}

export default class ReactNativeSQLite2Test extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      progress: [],
    }
  }

  componentDidMount() {
    this.addLog(
      typeof SQLite === 'object' && typeof SQLite.openDatabase === 'function'
        ? 'SQLite module loaded successfully'
        : 'Error: SQLite module is not loaded'
    )
  }

  componentWillUnmount() {}

  addLog(msg: string) {
    console.log(msg)
    const {progress} = this.state
    this.setState({
      progress: [...progress, {msg, key: (+new Date()).toString()}],
    })
  }

  errorCB = (err: SQLError): void => {
    console.error('error:', err)
    this.addLog('Error: ' + (err.message || err))
  }

  errorStatementCB = (_tx: SQLTransaction, err: SQLError): boolean => {
    this.errorCB(err)
    return false
  }

  successCB = () => {
    console.log('SQL executed ...')
  }

  openCB = () => {
    this.addLog('Database OPEN')
    this.setState(this.state)
  }

  closeCB = () => {
    this.addLog('Database CLOSED')
  }

  deleteCB = () => {
    this.addLog('Database DELETED')
  }

  assigningPragma(db: WebsqlDatabase) {
    return new Promise<void>((resolve) => {
      let sql = 'PRAGMA journal_mode = WAL'
      db._db.exec([{sql: sql, args: []}], false, (_, result) => {
        const row = result?.[0]?.rows?.[0]
        let journal_mode = row?.journal_mode
        if (journal_mode == 'wal') {
          this.addLog('✅ ' + sql)
        } else {
          this.addLog('❌ ' + sql)
          console.log(result, journal_mode)
        }
        resolve()
      })
    })
  }

  queryingPragma(db: WebsqlDatabase, isWal: boolean) {
    return new Promise<void>((resolve) => {
      let sql = 'PRAGMA journal_mode'
      db._db.exec([{sql: sql, args: []}], false, (_, result) => {
        const row = result?.[0]?.rows?.[0]
        const journal_mode = row?.journal_mode
        // Default journal_modes differ on Android & iOS
        if (
          (!isWal && journal_mode != 'wal') ||
          (isWal && journal_mode == 'wal')
        ) {
          this.addLog('✅ ' + sql)
        } else {
          this.addLog('❌ ' + sql)
          console.log(result, journal_mode)
        }
        resolve()
      })
    })
  }

  buildPragmaSchema(db: WebsqlDatabase) {
    return new Promise<void>((resolve) => {
      db._db.exec(
        [
          {
            sql: 'CREATE TABLE Version(version_id INTEGER PRIMARY KEY NOT NULL);',
            args: [],
          },
        ],
        false,
        (_, _result) => {
          resolve()
        }
      )
    })
  }

  assigningParenthesisPragma(db: WebsqlDatabase) {
    return new Promise<void>((resolve) => {
      let sql = 'PRAGMA main.wal_checkpoint(FULL)'
      db._db.exec([{sql: sql, args: []}], false, (_, result) => {
        const row = result?.[0]?.rows?.[0]
        if (row.busy == 0 && row.checkpointed != -1 && row.log != -1) {
          this.addLog('✅ ' + sql)
        } else {
          this.addLog('❌ ' + sql)
          console.log(result, row)
        }
        resolve()
      })
    })
  }

  populateDatabase(db: WebsqlDatabase) {
    return new Promise<void>((resolve) => {
      this.addLog('Database integrity check')
      const prepareDB = () => {
        db.transaction(this.populateDB, this.errorCB, () => {
          this.addLog('Database populated ... executing query ...')
          db.transaction(this.queryEmployees, this.errorCB, () => {
            console.log('Transaction is now finished')
            this.addLog('Processing completed.')
            db.transaction(this.cleanupTables, this.errorCB, () => {
              this.closeDatabase(db)
              resolve()
            })
          })
        })
      }

      db.transaction((txn) => {
        txn.executeSql(
          'SELECT 1 FROM Version LIMIT 1',
          [],
          prepareDB,
          (_, error) => {
            console.log('received version error:', error)
            this.addLog('Database not yet ready ... populating data')
            prepareDB()
            return false
          }
        )
      })
    })
  }

  populateDB = (tx: SQLTransaction) => {
    this.addLog('Executing DROP stmts')

    tx.executeSql('DROP TABLE IF EXISTS Employees;')
    tx.executeSql('DROP TABLE IF EXISTS Offices;')
    tx.executeSql('DROP TABLE IF EXISTS Departments;')

    this.addLog('Executing CREATE stmts')

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Version( ' +
        'version_id INTEGER PRIMARY KEY NOT NULL); ',
      [],
      this.successCB,
      this.errorStatementCB
    )

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Departments( ' +
        'department_id INTEGER PRIMARY KEY NOT NULL, ' +
        'name VARCHAR(30) ); ',
      [],
      this.successCB,
      this.errorStatementCB
    )

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Offices( ' +
        'office_id INTEGER PRIMARY KEY NOT NULL, ' +
        'name VARCHAR(20), ' +
        'longtitude FLOAT, ' +
        'latitude FLOAT ) ; ',
      [],
      this.successCB,
      this.errorStatementCB
    )

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Employees( ' +
        'employe_id INTEGER PRIMARY KEY NOT NULL, ' +
        'name VARCHAR(55), ' +
        'office INTEGER, ' +
        'department INTEGER, ' +
        'FOREIGN KEY ( office ) REFERENCES Offices ( office_id ) ' +
        'FOREIGN KEY ( department ) REFERENCES Departments ( department_id ));',
      []
    )

    this.addLog('Executing INSERT stmts')

    tx.executeSql(
      'INSERT INTO Departments (name) VALUES ("Client Services");',
      []
    )
    tx.executeSql(
      'INSERT INTO Departments (name) VALUES ("Investor Services");',
      []
    )
    tx.executeSql('INSERT INTO Departments (name) VALUES ("Shipping");', [])
    tx.executeSql('INSERT INTO Departments (name) VALUES ("Direct Sales");', [])

    tx.executeSql(
      'INSERT INTO Offices (name, longtitude, latitude) VALUES ("Denver", 59.8,  34.);',
      []
    )
    tx.executeSql(
      'INSERT INTO Offices (name, longtitude, latitude) VALUES ("Warsaw", 15.7, 54.);',
      []
    )
    tx.executeSql(
      'INSERT INTO Offices (name, longtitude, latitude) VALUES ("Berlin", 35.3, 12.);',
      []
    )
    tx.executeSql(
      'INSERT INTO Offices (name, longtitude, latitude) VALUES ("Paris", 10.7, 14.);',
      []
    )

    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Sylvester Stallone", 2,  4);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Elvis Presley", 2, 4);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Leslie Nelson", 3,  4);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Fidel Castro", 3, 3);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Bill Clinton", 1, 3);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Margaret Thatcher", 1, 3);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Donald Trump", 1, 3);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES (?, 1, 3);',
      ['Zero\0Null']
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Dr DRE", 2, 2);',
      []
    )
    tx.executeSql(
      'INSERT INTO Employees (name, office, department) VALUES ("Samantha Fox", 2, 1);',
      []
    )
    console.log('all config SQL done')
  }

  queryEmployees = (tx: SQLTransaction) => {
    console.log('Executing sql...')
    tx.executeSql(
      'SELECT a.name, b.name as deptName FROM Employees a, Departments b WHERE a.department = b.department_id and a.department=?',
      [3],
      this.queryEmployeesSuccess,
      this.errorStatementCB
    )
  }

  queryEmployeesSuccess = (_tx: SQLTransaction, results: SQLResultSet) => {
    console.log('results:', JSON.stringify(results, null, 4))
    this.addLog('Query completed')
    var len = results.rows.length
    for (let i = 0; i < len; i++) {
      let row = results.rows.item(i)
      this.addLog(
        `Empl Name: ${JSON.stringify(row.name)}, Dept Name: ${JSON.stringify(
          row.deptName
        )}`
      )
    }
  }

  cleanupTables = (tx: SQLTransaction) => {
    this.addLog('Executing DROP stmts')

    tx.executeSql('DROP TABLE IF EXISTS Employees;')
    tx.executeSql('DROP TABLE IF EXISTS Offices;')
    tx.executeSql('DROP TABLE IF EXISTS Departments;')
  }

  async loadAndQueryDB() {
    this.addLog('Opening database ...')
    const db = SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size,
      this.openCB
    )
    await this.populateDatabase(db)
  }

  async pragmaTests() {
    this.addLog('Open separate DB and run PRAGMA tests')
    const db = SQLite.openDatabase(
      databaseName(database_name),
      database_version,
      database_displayname,
      database_size,
      this.openCB
    )
    await this.queryingPragma(db, false)
    await this.assigningPragma(db)
    await this.queryingPragma(db, true)
    await this.buildPragmaSchema(db)
    await this.assigningParenthesisPragma(db)
  }

  closeDatabase = (db: WebsqlDatabase) => {
    if (db) {
      this.addLog('Closing database ...')
    } else {
      this.addLog('Database was not OPENED')
    }
  }

  async runDemo() {
    this.addLog('Starting SQLite Callback Demo')
    await this.loadAndQueryDB()
    this.pragmaTests()
  }

  renderProgressEntry = (entry: {item: LogEntry}) => {
    const {item} = entry
    return (
      <View style={listStyles.li}>
        <View>
          <Text style={listStyles.liText}>{item.msg}</Text>
        </View>
      </View>
    )
  }

  render() {
    const {progress} = this.state
    return (
      <SafeAreaView style={styles.mainContainer}>
        <TouchableOpacity style={styles.toolbar} onPress={() => this.runDemo()}>
          <Text style={styles.toolbarButton}>Run Demo</Text>
        </TouchableOpacity>
        <FlatList
          data={progress}
          renderItem={this.renderProgressEntry}
          style={listStyles.liContainer}
        />
      </SafeAreaView>
    )
  }
}

var listStyles = StyleSheet.create({
  li: {
    borderBottomColor: '#c8c7cc',
    borderBottomWidth: 0.5,
    paddingTop: 15,
    paddingRight: 15,
    paddingBottom: 15,
  },
  liContainer: {
    backgroundColor: '#fff',
    flex: 1,
    paddingLeft: 15,
  },
  liIndent: {
    flex: 1,
  },
  liText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '400',
    marginBottom: -3.5,
    marginTop: -3.5,
  },
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  toolbar: {
    backgroundColor: '#51c04d',
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButton: {
    color: 'white',
    textAlign: 'center',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
  },
})
