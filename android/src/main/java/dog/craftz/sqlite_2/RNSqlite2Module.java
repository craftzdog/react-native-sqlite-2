package dog.craftz.sqlite_2;

import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;

import android.content.Context;
import android.util.Log;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteStatement;
import android.os.Handler;
import android.os.HandlerThread;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RNSqlite2Module extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  private static final boolean DEBUG_MODE = false;

  private static final String TAG = RNSqlite2Module.class.getSimpleName();

  private static final Object[][] EMPTY_ROWS = new Object[][]{};
  private static final String[] EMPTY_COLUMNS = new String[]{};
  private static final SQLitePLuginResult EMPTY_RESULT = new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, null);

  private static final Map<String, SQLiteDatabase> DATABASES = new HashMap<String, SQLiteDatabase>();

  private final Handler backgroundHandler = createBackgroundHandler();

  /**
   * Linked activity
   */
  protected Context context = null;

  public RNSqlite2Module(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext.getApplicationContext();
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "RNSqlite2";
  }

  private Handler createBackgroundHandler() {
    HandlerThread thread = new HandlerThread("SQLitePlugin BG Thread");
    thread.start();
    return new Handler(thread.getLooper());
  }

  @ReactMethod
  public void exec(final String dbName, final ReadableArray queries, final Boolean readOnly, final Promise promise) {
    debug("exec called: %s", dbName);

    backgroundHandler.post(new Runnable() {
      @Override
      public void run() {
        try {
          int numQueries = queries.size();
          SQLitePLuginResult[] results = new SQLitePLuginResult[numQueries];
          SQLiteDatabase db = getDatabase(dbName);

          for (int i = 0; i < numQueries; i++) {
            ReadableArray sqlQuery = queries.getArray(i);
            String sql = sqlQuery.getString(0);
            String[] bindArgs = convertParamsToStringArray(sqlQuery.getArray(1));
            try {
              if (isSelect(sql)) {
                results[i] = doSelectInBackgroundAndPossiblyThrow(sql, bindArgs, db);
              } else { // update/insert/delete
                if (readOnly) {
                  results[i] = new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, new ReadOnlyException());
                } else {
                  results[i] = doUpdateInBackgroundAndPossiblyThrow(sql, bindArgs, db);
                }
              }
            } catch (Throwable e) {
              if (DEBUG_MODE) {
                e.printStackTrace();
              }
              results[i] = new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, e);
            }
          }
          NativeArray data = pluginResultsToPrimitiveData(results);
          promise.resolve(data);
        } catch (Exception e) {
          promise.reject("SQLiteError", e);
        }
      }
    });
  }

  // do a update/delete/insert operation
  private SQLitePLuginResult doUpdateInBackgroundAndPossiblyThrow(String sql, String[] bindArgs,
                                                                  SQLiteDatabase db) {
    debug("\"run\" query: %s", sql);
    SQLiteStatement statement = null;
    try {
      statement = db.compileStatement(sql);
      debug("compiled statement");
      if (bindArgs != null) {
        statement.bindAllArgsAsStrings(bindArgs);
      }
      debug("bound args");
      if (isInsert(sql)) {
        debug("type: insert");
        long insertId = statement.executeInsert();
        int rowsAffected = insertId >= 0 ? 1 : 0;
        return new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, rowsAffected, insertId, null);
      } else if (isDelete(sql) || isUpdate(sql)) {
        debug("type: update/delete");
        int rowsAffected = statement.executeUpdateDelete();
        return new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, rowsAffected, 0, null);
      } else {
        // in this case, we don't need rowsAffected or insertId, so we can have a slight
        // perf boost by just executing the query
        debug("type: drop/create/etc.");
        statement.execute();
        return EMPTY_RESULT;
      }
    } finally {
      if (statement != null) {
        statement.close();
      }
    }
  }

  // do a select operation
  private SQLitePLuginResult doSelectInBackgroundAndPossiblyThrow(String sql, String[] bindArgs,
                                                                  SQLiteDatabase db) {
    debug("\"all\" query: %s", sql);
    Cursor cursor = null;
    try {
      cursor = db.rawQuery(sql, bindArgs);
      int numRows = cursor.getCount();
      if (numRows == 0) {
        return EMPTY_RESULT;
      }
      int numColumns = cursor.getColumnCount();
      Object[][] rows = new Object[numRows][];
      String[] columnNames = cursor.getColumnNames();
      for (int i = 0; cursor.moveToNext(); i++) {
        Object[] row = new Object[numColumns];
        for (int j = 0; j < numColumns; j++) {
          row[j] = getValueFromCursor(cursor, j, cursor.getType(j));
        }
        rows[i] = row;
      }
      debug("returning %d rows", numRows);
      return new SQLitePLuginResult(rows, columnNames, 0, 0, null);
    } finally {
      if (cursor != null) {
        cursor.close();
      }
    }
  }

  private Object getValueFromCursor(Cursor cursor, int index, int columnType) {
    switch (columnType) {
      case Cursor.FIELD_TYPE_FLOAT:
        return cursor.getDouble(index);
      case Cursor.FIELD_TYPE_INTEGER:
        return cursor.getInt(index);
      case Cursor.FIELD_TYPE_BLOB:
        // convert byte[] to binary string; it's good enough, because
        // WebSQL doesn't support blobs anyway
        return new String(cursor.getBlob(index));
      case Cursor.FIELD_TYPE_STRING:
        return cursor.getString(index);
    }
    return null;
  }

  private SQLiteDatabase getDatabase(String name) {
    SQLiteDatabase database = DATABASES.get(name);
    if (database == null) {
      if (":memory:".equals(name)) {
        database = SQLiteDatabase.openOrCreateDatabase(name, null);
      } else {
        File file = new File(this.context.getFilesDir(), name);
        database = SQLiteDatabase.openOrCreateDatabase(file, null);
      }
      DATABASES.put(name, database);
    }
    return database;
  }

  private static void debug(String line, Object... format) {
    if (DEBUG_MODE) {
      Log.d(TAG, String.format(line, format));
    }
  }

  private static NativeArray pluginResultsToPrimitiveData(SQLitePLuginResult[] results) {
    WritableNativeArray list = new WritableNativeArray();
    for (int i = 0; i < results.length; i++) {
      SQLitePLuginResult result = results[i];
      WritableNativeArray arr = convertPluginResultToArray(result);
      list.pushArray(arr);
    }
    return list;
  }

  private static WritableNativeArray convertPluginResultToArray(SQLitePLuginResult result) {
    WritableNativeArray data = new WritableNativeArray();
    if (result.error != null) {
      data.pushString(result.error.getMessage());
    } else {
      data.pushNull();
    }
    data.pushInt((int) result.insertId);
    data.pushInt(result.rowsAffected);

    // column names
    WritableNativeArray columnNames = new WritableNativeArray();
    for (int i = 0; i < result.columns.length; i++) {
      columnNames.pushString(result.columns[i]);
    }
    data.pushArray(columnNames);

    // rows
    WritableNativeArray rows = new WritableNativeArray();
    for (int i = 0; i < result.rows.length; i++) {
      Object[] values = result.rows[i];
      // row content
      WritableNativeArray rowContent = new WritableNativeArray();
      for (int j = 0; j < values.length; j++) {
        Object value = values[j];
        if (value == null) {
          rowContent.pushNull();
        } else if (value instanceof String) {
          rowContent.pushString((String)value);
        } else if (value instanceof Boolean) {
          rowContent.pushBoolean((Boolean)value);
        } else {
          Number v = (Number)value;
          rowContent.pushDouble(v.doubleValue());
        }
      }
      rows.pushArray(rowContent);
    }
    data.pushArray(rows);
    return data;
  }

  private static boolean isSelect(String str) {
    return startsWithCaseInsensitive(str, "select");
  }
  private static boolean isInsert(String str) {
    return startsWithCaseInsensitive(str, "insert");
  }
  private static boolean isUpdate(String str) {
    return startsWithCaseInsensitive(str, "update");
  }
  private static boolean isDelete(String str) {
    return startsWithCaseInsensitive(str, "delete");
  }

  // identify an "insert"/"select" query more efficiently than with a Pattern
  private static boolean startsWithCaseInsensitive(String str, String substr) {
    int i = -1;
    int len = str.length();
    while (++i < len) {
      char ch = str.charAt(i);
      if (!Character.isWhitespace(ch)) {
        break;
      }
    }

    int j = -1;
    int substrLen = substr.length();
    while (++j < substrLen) {
      if (j + i >= len) {
        return false;
      }
      char ch = str.charAt(j + i);
      if (Character.toLowerCase(ch) != substr.charAt(j)) {
        return false;
      }
    }
    return true;
  }

  private static String[] jsonArrayToStringArray(String jsonArray) throws JSONException {
    JSONArray array = new JSONArray(jsonArray);
    int len = array.length();
    String[] res = new String[len];
    for (int i = 0; i < len; i++) {
      res[i] = array.getString(i);
    }
    return res;
  }

  private static String[] convertParamsToStringArray(ReadableArray paramArray) {
    int len = paramArray.size();
    String[] res = new String[len];
    for (int i = 0; i < len; i++) {
      ReadableType type = paramArray.getType(i);
      if (type == ReadableType.String) {
        String unescaped = unescapeBlob(paramArray.getString(i));
        res[i] = unescaped;
      } else if (type == ReadableType.Boolean) {
        res[i] = paramArray.getBoolean(i) ? "0" : "1";
      } else if (type == ReadableType.Null) {
        res[i] = "NULL";
      } else if (type == ReadableType.Number) {
        res[i] = Double.toString(paramArray.getDouble(i));
      }
    }
    return res;
  }

  private static String unescapeBlob(String str) {
    return str.replaceAll("\u0001\u0001", "\u0000")
            .replaceAll("\u0001\u0002", "\u0001")
            .replaceAll("\u0002\u0002", "\u0002");
  }

  private static class SQLitePLuginResult {
    public final Object[][] rows;
    public final String[] columns;
    public final int rowsAffected;
    public final long insertId;
    public final Throwable error;

    public SQLitePLuginResult(Object[][] rows, String[] columns,
                              int rowsAffected, long insertId, Throwable error) {
      this.rows = rows;
      this.columns = columns;
      this.rowsAffected = rowsAffected;
      this.insertId = insertId;
      this.error = error;
    }
  }

  private static class ReadOnlyException extends Exception {
    public ReadOnlyException() {
      super("could not prepare statement (23 not authorized)");
    }
  }
}
