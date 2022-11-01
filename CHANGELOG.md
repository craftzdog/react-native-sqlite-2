## v3.6.2 (2022-11-01)

- chore(android): remove jCenter in gradle build files (Thanks [@obdulia-losantos](https://github.com/craftzdog/react-native-sqlite-2/pull/138))

## v3.6.1 (2022-08-11)

- Windows files are missing

## v3.6.0 (2022-08-11)

- TypeScript support
- Add an example project
- Add Husky

## v3.5.0 (2021-11-01)

- chore(android): update sqlite-android to 3.36.0 (Thanks [@matinzd](https://github.com/craftzdog/react-native-sqlite-2/pull/104))
- chore(android): update sqlite to 2.1.0

## v3.4.1 (2021-09-06)

- chore(dep): update websql to 2.0.3 (Thanks [DerGuteMoritz](https://github.com/craftzdog/react-native-sqlite-2/pull/103))

## v3.4.0 (2021-08-05)

- feat(ios): Harmonize foreign key enforcing (Thanks [ilmoraunio](https://github.com/craftzdog/react-native-sqlite-2/pull/98))
- feat(android): Allow PRAGMA statements that assign when invoked via exec (Thanks [ilmoraunio](https://github.com/craftzdog/react-native-sqlite-2/pull/99))
- chore(dep): Bump up websql to 2.0.2

## v3.3.0 (2021-03-25)

- feature(dep): Bump up websql to 2.0.0 (Thanks [technowizard](https://github.com/craftzdog/react-native-sqlite-2/issues/93))

## v3.2.0 (2021-03-21)

- feature(tvos): Support tvOS (Thanks [manbir-app-curefit](https://github.com/craftzdog/react-native-sqlite-2/pull/89))
- fix(android): Allow PRAGMA queries (Thanks [beeks](https://github.com/craftzdog/react-native-sqlite-2/pull/91))
- fix(android): Always enable foreign key constraints (Thanks [beeks](https://github.com/craftzdog/react-native-sqlite-2/pull/92))

## v3.1.1 (2020-09-28)

- fix(ios): Xcode 12 `use_frameworks` compatibility (Thanks [chrmod](https://github.com/craftzdog/react-native-sqlite-2/pull/87))

## v3.1.0 (2020-07-23)

- feat(macos): Support react-native-macos (Thanks [ospfranco](https://github.com/craftzdog/react-native-sqlite-2/issues/81))
- fix(android): boolean query arg are inversed (Thanks [jdextraze](https://github.com/craftzdog/react-native-sqlite-2/issues/74))

## v3.0.0 (2019-09-26)

- feat(android): Update to AndroidX. Make sure to enable it in your project's `android/gradle.properties`.
- feat(android): Use [sqlite-android](https://github.com/requery/sqlite-android)

## v2.0.4 (2019-09-12)

- chore(ios): move podspec file
- chore(ios): change flag name for debug logs [#64](https://github.com/craftzdog/react-native-sqlite-2/pull/64)

## v2.0.3 (2019-07-25)

- chore(android): change 'compile' to 'implementation' [#61](https://github.com/craftzdog/react-native-sqlite-2/pull/61)

## v2.0.2 (2019-05-12)

- fix(ios): Synchronize cachedDatabases to prevent SIGABRT crash when opening many databases (Thanks [@PaulMest](https://github.com/craftzdog/react-native-sqlite-2/pull/58))

## v2.0.1

- Change a peer dependency on RN to `>= 0.58.0`

## v2.0.0

- Escape NULL characters to support RN0.59 [#53](https://github.com/craftzdog/react-native-sqlite-2/pull/53)

## v1.7.0

- perf(ios): Make dispatch queues for each database connection
- perf(android): Make background handlers for each database connection
- fix(android): Fix integer overflow for SELECT result (Thanks [@Kudo](https://github.com/Kudo))
- fix(android): Fix build settings to use root project's

## v1.6.2

- fix(android): Update build config for android

## v1.6.1

- build(dependency): Update websql dependency to 1.0.0 (Thanks [@p2k](https://github.com/p2k))

## v1.6.0

- perf(ios): Run query in background thread to avoid blocking UI thread
- perf(android): Run query in background thread
- fix(android): Handle REAL datatype correctly (Thanks [@chrmod](https://github.com/chrmod))
- fix(android): Fix "Null" Strings in Android for INSERT and UPDATE statements. (Thanks [@Ayiga](https://github.com/Ayiga))
- fix(ios): Fix warning due to no requiresMainQueueSetup
- docs(readme): Fix installation instruction for Android (Thanks [@yairopro](https://github.com/yairopro))

## v1.5.2

- Fix a warning that the package name does not match the directory structure: `dog.craftz.sqlite_2` vs `dog/sqlite_2`.

## v1.5.1

- Change the package name for Android

## v1.5.0

- Fix peer dependency to react native >= 0.47.0
- Fixing build on android: removed createJSModules [#15](https://github.com/craftzdog/react-native-sqlite-2/pull/15)

## v1.4.0

- Update contact info in podspec
- Fix WPF project arch for x86/x64 #8
- Add case commit, rollback and correct exception throw [#7](https://github.com/craftzdog/react-native-sqlite-2/pull/7)

## v1.3.0

- Add WPF support #5

## v1.2.0

- Add Windows module for react-native-windows [#3](https://github.com/craftzdog/react-native-sqlite-2/pull/3)

## v1.1.0

- Improve performance

## v1.0.3

- Remove unnecessary dependency

## v1.0.1

- Suppress debug logs
- remove unnecessary peer dependency
