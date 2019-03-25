import React, { Component } from 'react'
import { StyleSheet, Text, View, FlatList, SafeAreaView } from 'react-native'

import SQLite from 'react-native-sqlite-2'

const database_name = 'test.db'
const database_version = '1.0'
const database_displayname = 'SQLite Test Database'
const database_size = 200000
let db

export default class ReactNativeSQLite2Test extends Component {
  constructor(props) {
    super(props)
    this.state = {
      progress: [{ msg: 'Welcome', key: 'welcome' }]
    }
  }

  componentWillUnmount() {
    this.closeDatabase()
  }

  addLog(msg) {
    console.log(msg)
    const { progress } = this.state
    this.setState({
      progress: [...progress, { msg, key: (+new Date()).toString() }]
    })
  }

  errorCB = err => {
    console.error('error:', err)
    this.addLog('Error: ' + (err.message || err))
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

  populateDatabase(db) {
    this.addLog('Database integrity check')
    const prepareDB = () => {
      db.transaction(this.populateDB, this.errorCB, () => {
        this.addLog('Database populated ... executing query ...')
        db.transaction(this.queryEmployees, this.errorCB, () => {
          console.log('Transaction is now finished')
          this.addLog('Processing completed.')
          db.transaction(this.cleanupTables, this.errorCB, () => {
            this.closeDatabase()
          })
        })
      })
    }

    db.transaction(txn => {
      txn.executeSql('SELECT 1 FROM Version LIMIT 1', [], prepareDB, error => {
        console.log('received version error:', error)
        this.addLog('Database not yet ready ... populating data')
        prepareDB()
      })
    })
  }

  populateDB = tx => {
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
      this.errorCB
    )

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Departments( ' +
        'department_id INTEGER PRIMARY KEY NOT NULL, ' +
        'name VARCHAR(30) ); ',
      [],
      this.successCB,
      this.errorCB
    )

    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS Offices( ' +
        'office_id INTEGER PRIMARY KEY NOT NULL, ' +
        'name VARCHAR(20), ' +
        'longtitude FLOAT, ' +
        'latitude FLOAT ) ; ',
      [],
      this.successCB,
      this.errorCB
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

  queryEmployees = tx => {
    console.log('Executing sql...')
    tx.executeSql(
      'SELECT a.name, b.name as deptName FROM Employees a, Departments b WHERE a.department = b.department_id and a.department=?',
      [3],
      this.queryEmployeesSuccess,
      this.errorCB
    )
  }

  queryEmployeesSuccess = (tx, results) => {
    this.addLog('Query completed')
    var len = results.rows.length
    for (let i = 0; i < len; i++) {
      let row = results.rows.item(i)
      this.addLog(`Empl Name: ${row.name}, Dept Name: ${row.deptName}`)
    }
  }

  cleanupTables = tx => {
    this.addLog('Executing DROP stmts')

    tx.executeSql('DROP TABLE IF EXISTS Employees;')
    tx.executeSql('DROP TABLE IF EXISTS Offices;')
    tx.executeSql('DROP TABLE IF EXISTS Departments;')
  }

  loadAndQueryDB() {
    this.addLog('Opening database ...')
    db = SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size,
      this.openCB,
      this.errorCB
    )
    this.populateDatabase(db)
  }

  closeDatabase = () => {
    if (db) {
      this.addLog('Closing database ...')
    } else {
      this.addLog('Database was not OPENED')
    }
  }

  runDemo() {
    this.setState({
      progress: ['Starting SQLite Callback Demo']
    })
    this.loadAndQueryDB()
  }

  renderProgressEntry = entry => {
    const { item } = entry
    return (
      <View style={listStyles.li}>
        <View>
          <Text style={listStyles.liText}>{item.msg}</Text>
        </View>
      </View>
    )
  }

  render() {
    const { progress } = this.state
    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarButton} onPress={() => this.runDemo()}>
            Run Demo
          </Text>
        </View>
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
    paddingBottom: 15
  },
  liContainer: {
    backgroundColor: '#fff',
    flex: 1,
    paddingLeft: 15
  },
  liIndent: {
    flex: 1
  },
  liText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '400',
    marginBottom: -3.5,
    marginTop: -3.5
  }
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  },
  toolbar: {
    backgroundColor: '#51c04d',
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  toolbarButton: {
    color: 'white',
    textAlign: 'center',
    flex: 1
  },
  mainContainer: {
    flex: 1
  }
})
