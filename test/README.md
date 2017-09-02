How to run test
================

1. Create new react-native project

```
react-native init SQLite2Test
cd SQLite2Test
```

2. Install `react-native-sqlite-2` by following instructions on its README.
3. Change `index.ios.js` and `index.android.js` to:

```javascript
import React, { Component } from 'react'
import {
  AppRegistry,
} from 'react-native'
import App from 'react-native-sqlite-2/test/app'

AppRegistry.registerComponent('SQLite2Test', () => App)
```
