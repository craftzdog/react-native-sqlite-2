# React Native SQLite 2

SQLite3 Native Plugin for React Native for Android/iOS/Windows.
This plugin provides a [WebSQL](http://www.w3.org/TR/webdatabase/)-compatible API to store data in a react native app, by using a SQLite database on the native side.

Inspired by fantastic work done by [Nolan Lawson](https://github.com/nolanlawson/cordova-plugin-sqlite-2).
It should be a drop-in replacement with [react-native-sqlite-storage](https://github.com/andpor/react-native-sqlite-storage).
It works pretty well with [PouchDB](https://github.com/stockulus/pouchdb-react-native) on React Native app.

The reason of this plugin is that `react-native-sqlite-storage` has some problems to use with PouchDB:

  * It [can't store string data with `\u0000`](https://github.com/andpor/react-native-sqlite-storage/issues/107) due to [the react native problem](https://github.com/facebook/react-native/issues/12731).
    * PouchDB heavily uses the Null character in the document IDs for building index, so it won't work well.
  * It's unstable for storing PouchDB's attachments: [#6037](https://github.com/pouchdb/pouchdb/issues/6037).

This plugin avoids these problems.

## Getting started

```shell
$ npm install react-native-sqlite-2 --save
```

### Mostly automatic installation

```shell
$ react-native link react-native-sqlite-2
```

#### iOS

In Xcode, add `libsqlite3.tbd` to your project's `Build Phases` ➜ `Link Binary With Libraries`.

### Manual installation

#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-sqlite-2` and add `RNSqlite2.xcodeproj`
3. In Xcode, in the project navigator, select your project. Add `libRNSqlite2.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import dog.craftz.sqlite_2.RNSqlite2Package;` to the imports at the top of the file
  - Add `new RNSqlite2Package()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
    ```
    include ':react-native-sqlite-2'
    project(':react-native-sqlite-2').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-sqlite-2/android')
    ```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```
    compile project(':react-native-sqlite-2')
    ```

#### Windows  
1. Open the solution in `Visual Studio` for your Windows apps.
  - Right click your in the Explorer and click `Add` > `Existing Project...`.
  - [UWP] Navigate to `./<app-name>/windows/RNSqlite2/` and add `RNSqlite2.csproj`.
  
    [WPF] Navigate to `./<app-name>/windows/RNSqlite2.Net46/` and add `RNSqlite2.Net46.csproj`.
  - Right click on your React Native Windows app under your solutions directory and click `Add` > `Reference...`.
  - [UWP] Check the `RNSqlite2` you just added and press `Ok`.
    
    [WPF] Check the `RNSqlite2.Net46` you just added and press `Ok`.
2. Open `MainPage.cs` in your app
 - Edit it like below:

```
using RNSqlite2;

get
  {
      return new List<IReactPackage>
      {
          new MainReactPackage(),
          new RNSqlite2Package(),
      };
  }
```

## Usage

```javascript
import SQLite from 'react-native-sqlite-2';

const db = SQLite.openDatabase('test.db', '1.0', '', 1);
db.transaction(function (txn) {
  txn.executeSql('DROP TABLE IF EXISTS Users', []);
  txn.executeSql('CREATE TABLE IF NOT EXISTS Users(user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(30))', []);
  txn.executeSql('INSERT INTO Users (name) VALUES (:name)', ['nora']);
  txn.executeSql('INSERT INTO Users (name) VALUES (:name)', ['takuya']);
  txn.executeSql('SELECT * FROM `users`', [], function (tx, res) {
    for (let i = 0; i < res.rows.length; ++i) {
      console.log('item:', res.rows.item(i));
    }
  });
});
```

There is a test app in the [test directory](https://github.com/craftzdog/react-native-sqlite-2/tree/master/test).

### Using with PouchDB

It can be used with [pouchdb-adapter-react-native-sqlite](https://github.com/craftzdog/pouchdb-adapter-react-native-sqlite).

```javascript
import PouchDB from 'pouchdb-react-native'
import SQLite from 'react-native-sqlite-2'
import SQLiteAdapterFactory from 'pouchdb-adapter-react-native-sqlite'

const SQLiteAdapter = SQLiteAdapterFactory(SQLite)
PouchDB.plugin(SQLiteAdapter)
var db = new PouchDB('mydb', { adapter: 'react-native-sqlite' })
```

## Original Cordova SQLite Bindings from Nolan Lawson

https://github.com/nolanlawson/cordova-plugin-sqlite-2

The issues and limitations for the actual SQLite can be found on this site.

