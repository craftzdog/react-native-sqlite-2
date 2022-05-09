import {NativeModules, Platform} from 'react-native'
// @ts-ignore
import customOpenDatabase from 'websql/custom'
import SQLiteDatabase from './SQLiteDatabase'
import type {WebsqlDatabase, WebsqlDatabaseCallback} from './WebsqlDatabase'

if (!process.nextTick) {
  process.nextTick = function (callback: () => void) {
    setTimeout(callback, 0)
  }
}

const LINKING_ERROR =
  `The package 'react-native-sqlite-2' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ios: "- You have run 'pod install'\n", default: ''}) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n'

const Sqlite2 = NativeModules.RNSqlite2
  ? NativeModules.RNSqlite2
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      }
    )

export function multiply(a: number, b: number): Promise<number> {
  return Sqlite2.multiply(a, b)
}

let openDB = customOpenDatabase(SQLiteDatabase)

class SQLitePlugin {
  openDatabase(
    args: {
      name: string
      version: string
      description: string
      size: number
    },
    callback: WebsqlDatabaseCallback
  ): WebsqlDatabase
  openDatabase(
    name: string,
    version?: string,
    description?: string,
    size?: number,
    callback?: WebsqlDatabaseCallback
  ): WebsqlDatabase

  openDatabase(
    name:
      | string
      | {
          name: string
          version: string
          description: string
          size: number
        },
    version?: string | WebsqlDatabaseCallback,
    description?: string,
    size?: number,
    callback?: WebsqlDatabaseCallback
  ): WebsqlDatabase {
    if (name && typeof name === 'object') {
      // accept SQLite Plugin 1-style object here
      callback = typeof version === 'function' ? version : undefined
      size = name.size
      description = name.description
      version = name.version
      name = name.name
    }
    if (!size) {
      size = 1
    }
    if (!description) {
      description = name
    }
    if (!version) {
      version = '1.0'
    }
    if (typeof name === 'undefined') {
      throw new Error('please be sure to call: openDatabase("myname.db")')
    }
    return openDB(name, version, description, size, callback)
  }
}

export default new SQLitePlugin()
export * from './WebsqlDatabase'
