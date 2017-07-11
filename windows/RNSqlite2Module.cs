using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Data.Sqlite;
using System.IO;
using Newtonsoft.Json.Linq;
using System.Data;
using System.Text.RegularExpressions;

namespace RNSqlite2
{
    class RNSqlite2Module : ReactContextNativeModuleBase
    {
        public RNSqlite2Module(ReactContext reactContext)
            : base(reactContext)
        {
            this.reactContext = reactContext;
        }

        public override string Name
        {
            get
            {
                return "RNSqlite2";
            }
        }
        private readonly ReactContext reactContext;

        private static readonly bool DEBUG_MODE = false;

        private static readonly string TAG = typeof(RNSqlite2Module).Name;

        private static readonly List<object> EMPTY_ROWS = new List<object>();
        private static readonly List<string> EMPTY_COLUMNS = new List<string>();

        //protected Context context = null;
        private static readonly SQLitePLuginResult EMPTY_RESULT = new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, null);

        private static readonly Dictionary<string, SqliteConnection> DATABASES = new Dictionary<string, SqliteConnection>();
        private static readonly Dictionary<string, SqliteTransaction> TRANSACTIONS = new Dictionary<string, SqliteTransaction>();

        [ReactMethod]
        public void test(string message, IPromise promise)
        {
            debug("example", "test called: " + message);
            promise.Resolve(message + "\u0000" + "hoge");
        }

        private SqliteConnection getDatabase(string name)
        {
            if (!DATABASES.ContainsKey(name))
            {
#if WINDOWS_UWP
                string path = Path.Combine(Windows.Storage.ApplicationData.Current.LocalFolder.Path, name);
#else
                string path = Path.Combine(PCLStorage.FileSystem.Current.LocalStorage.Path, name);
#endif
                SqliteConnection conn = new SqliteConnection("Filename=" + path);
                DATABASES[name] = conn;
                TRANSACTIONS[name] = null;
            }
            return DATABASES[name];
        }

        // TODO: Need improve . This function : command.Parameters.AddWithValue(item.Key, item.Value); don't support bind string by index or i missing something
        private static void parseJsonArrayToParams(ref string sql, List<JToken> jsonArray, ref SqliteCommand statement)
        {
            MatchCollection matches = Regex.Matches(sql, @"\?");
            Dictionary<string, string> array = new Dictionary<string, string>();
            int len = matches.Count;
            if (len > 0)
            {
                if (matches.Count > jsonArray.Count)
                {
                    throw new Exception("parameter not correct");
                }

                var lastLen = 0;
                for (int i = 0; i < len; i++)
                {
                    var stringBuilder = new StringBuilder(sql);
                    stringBuilder.Remove(lastLen + matches[i].Index, 1);
                    stringBuilder.Insert(lastLen + matches[i].Index, "@" + i);
                    statement.Parameters.AddWithValue("@" + i, jsonArray[i].ToString());
                    lastLen += i.ToString().Length;
                    sql = stringBuilder.ToString();
                }
            }
            else
            {
                // This is old code handle txn.executeSql('INSERT INTO Users (name) VALUES (:name)', ['narumiya'])
                matches = Regex.Matches(sql, @"\:([A-Za-z0-9]*)");
                len = matches.Count;

                if (matches.Count > jsonArray.Count)
                {
                    throw new Exception("parameter not correct");
                }

                for (int i = 0; i < len; i++)
                {
                    statement.Parameters.AddWithValue(matches[i].Value, jsonArray[i].ToString());
                }
            }
        }

        private static bool isSelect(String str)
        {
            return str.TrimStart().StartsWith("select", StringComparison.OrdinalIgnoreCase);
        }

        private static bool isInsert(String str)
        {
            return str.TrimStart().StartsWith("insert", StringComparison.OrdinalIgnoreCase);
        }

        private static bool isDelete(String str)
        {
            return str.TrimStart().StartsWith("delete", StringComparison.OrdinalIgnoreCase);
        }

        private static bool isUpdate(String str)
        {
            return str.TrimStart().StartsWith("update", StringComparison.OrdinalIgnoreCase);
        }

        private static bool isBegin(String str)
        {
            return str.TrimStart().StartsWith("begin", StringComparison.OrdinalIgnoreCase);
        }

        private static bool isEnd(String str)
        {
            return str.TrimStart().StartsWith("end", StringComparison.OrdinalIgnoreCase);
        }

        private static bool isCommit(String str)
        {
            return str.TrimStart().StartsWith("commit", StringComparison.OrdinalIgnoreCase);
        }

        private static bool isRollback(String str)
        {
            return str.TrimStart().StartsWith("rollback", StringComparison.OrdinalIgnoreCase);
        }

        [ReactMethod]
        public void exec(string dbName, JArray queries, bool readOnly, IPromise promise)
        {
            debug("test called: " + dbName);
            SqliteConnection db = getDatabase(dbName);
            try
            {
                int numQueries = queries.Count;
                SQLitePLuginResult[] results = new SQLitePLuginResult[numQueries];
                if (TRANSACTIONS[dbName] == null)
                {
                    db.Open();
                }
                for (int i = 0; i < numQueries; i++)
                {
                    var sqlQuery = queries[i];
                    string sql = sqlQuery[0].ToString();
                    try
                    {
                        if (isSelect(sql))
                        {
                            results[i] = doSelectInBackgroundAndPossiblyThrow(sql, sqlQuery[1].ToList(), db, TRANSACTIONS[dbName]);
                        }
                        else if (isBegin(sql))
                        {
                            //Handle begin without end
                            if (TRANSACTIONS[dbName] != null)
                            {
                                TRANSACTIONS[dbName].Rollback();
                                TRANSACTIONS[dbName].Dispose();
                                TRANSACTIONS[dbName] = null;
                            }
                            TRANSACTIONS[dbName] = db.BeginTransaction();
                            results[i] = EMPTY_RESULT;
                        }
                        else if (isEnd(sql) || isCommit(sql))
                        {
                            if (TRANSACTIONS[dbName] != null)
                            {
                                TRANSACTIONS[dbName].Commit();
                                TRANSACTIONS[dbName].Dispose();
                                TRANSACTIONS[dbName] = null;
                            }
                            results[i] = EMPTY_RESULT;
                        }
                        else if (isRollback(sql))
                        {
                            if (TRANSACTIONS[dbName] != null)
                            {
                                TRANSACTIONS[dbName].Rollback();
                                TRANSACTIONS[dbName].Dispose();
                                TRANSACTIONS[dbName] = null;
                            }
                            results[i] = EMPTY_RESULT;
                        }
                        else
                        { // update/insert/delete
                            if (readOnly)
                            {
                                results[i] = new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, new ReadOnlyException());
                            }
                            else
                            {
                                results[i] = doUpdateInBackgroundAndPossiblyThrow(sql, sqlQuery[1].ToList(), db, TRANSACTIONS[dbName]);
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        if (RNSqlite2Module.DEBUG_MODE)
                        {
                            Console.WriteLine(e.ToString());
                        }
                        if (TRANSACTIONS[dbName] != null)
                        {
                            TRANSACTIONS[dbName].Rollback();
                            TRANSACTIONS[dbName].Dispose();
                            TRANSACTIONS[dbName] = null;
                        }
                        results[i] = new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, e);
                    }
                }

                List<Object> data = pluginResultsToPrimitiveData(results);
                promise.Resolve(data);
            }
            catch (Exception e)
            {
                promise.Reject("SQLiteError", e);
                if (TRANSACTIONS[dbName] != null)
                {
                    TRANSACTIONS[dbName].Rollback();
                    TRANSACTIONS[dbName].Dispose();
                    TRANSACTIONS[dbName] = null;
                }
            }
            finally
            {
                if (TRANSACTIONS[dbName] == null)
                {
                    db.Close();
                }
            }
        }

        private Object getValueFromCursor(SqliteDataReader reader, int index, Type dataType)
        {
            if (dataType == typeof(Int16))
            {
                return reader.GetInt16(index);
            }
            else if (dataType == typeof(Int32))
            {
                return reader.GetInt32(index);
            }
            else if (dataType == typeof(Int64))
            {
                return reader.GetInt64(index);
            }
            else if (dataType == typeof(double))
            {
                return reader.GetDouble(index);
            }
            else if (dataType == typeof(decimal))
            {
                return reader.GetDecimal(index);
            }
            else if (dataType == typeof(string))
            {
                return reader.GetString(index);
            }
            else
            {
                return "";
            }
        }

        private static void debug(String line, object format = null)
        {
            if (DEBUG_MODE)
            {
                Console.WriteLine(TAG, string.Format(line, format));
            }
        }

        // do a select operation
        private SQLitePLuginResult doSelectInBackgroundAndPossiblyThrow(string sql, List<JToken> queryParams,
                                                                        SqliteConnection db, SqliteTransaction transaction = null)
        {
            debug("\"all\" query: %s", sql);
            SqliteDataReader query = null;
            try
            {
                SqliteCommand command = new SqliteCommand();
                command.Connection = db;
                command.Transaction = transaction;

                if (queryParams != null && queryParams.Count > 0)
                {
                    parseJsonArrayToParams(ref sql, queryParams, ref command);
                }
                command.CommandText = sql;

                query = command.ExecuteReader();
                if (!query.HasRows)
                {
                    return EMPTY_RESULT;
                }
                List<Object> entries = new List<Object>();

                while (query.Read())
                {
                    List<Object> row = new List<Object>();
                    for (int i = 0; i < query.FieldCount; i++)
                    {
                        var type = query.GetValue(i).GetType();
                        row.Add(getValueFromCursor(query, i, type));
                    }
                    entries.Add(row);
                }
                List<string> columns = Enumerable.Range(0, query.FieldCount).Select(query.GetName).ToList();
                debug("returning %d rows", entries.Count());
                return new SQLitePLuginResult(entries, columns, 0, 0, null);
            }
            catch (Exception e)
            {
                debug("Query error", e.Message);
                return new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, 0, 0, null);
            }
            finally
            {
                if (query != null)
                {
                    query.Dispose();
                }
            }
        }

        private static List<Object> pluginResultsToPrimitiveData(SQLitePLuginResult[] results)
        {
            List<Object> list = new List<Object>();
            for (int i = 0; i < results.Count(); i++)
            {
                SQLitePLuginResult result = results[i];
                List<Object> arr = convertPluginResultToArray(result);
                list.Add(arr);
            }
            return list;
        }

        private static List<Object> convertPluginResultToArray(SQLitePLuginResult result)
        {
            List<Object> data = new List<Object>();
            if (result.error != null)
            {
                data.Add(result.error.Message);
            }
            else
            {
                data.Add(null);
            }
            data.Add((long)result.insertId);
            data.Add((int)result.rowsAffected);

            // column names
            data.Add(result.columns);
            data.Add(result.rows);

            return data;
        }

        // do a update/delete/insert operation
        private SQLitePLuginResult doUpdateInBackgroundAndPossiblyThrow(string sql, List<JToken> queryParams,
                                                                        SqliteConnection db, SqliteTransaction transaction = null)
        {
            debug("\"run\" query: %s", sql);
            SqliteCommand statement = null;
            try
            {
                statement = new SqliteCommand();
                statement.Connection = db;
                statement.Transaction = transaction;
                statement.CommandType = CommandType.Text;
                debug("compiled statement");

                if (queryParams != null && queryParams.Count > 0)
                {
                    parseJsonArrayToParams(ref sql, queryParams, ref statement);
                }
                statement.CommandText = sql;
                debug("bound args");
                if (isInsert(sql))
                {
                    debug("type: insert");
                    int rowsAffected = statement.ExecuteNonQuery();
                    long insertId = 0;
                    if (rowsAffected > 0)
                    {
                        statement.CommandText = "SELECT last_insert_rowid()";
                        insertId = (long)statement.ExecuteScalar();
                    }
                    return new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, rowsAffected, insertId, null);
                }
                else if (isDelete(sql) || isUpdate(sql))
                {
                    debug("type: update/delete");
                    int rowsAffected = statement.ExecuteNonQuery();
                    return new SQLitePLuginResult(EMPTY_ROWS, EMPTY_COLUMNS, rowsAffected, 0, null);
                }
                else
                {
                    // in this case, we don't need rowsAffected or insertId, so we can have a slight
                    // perf boost by just executing the query
                    debug("type: drop/create/etc.");
                    statement.ExecuteScalar();
                    return EMPTY_RESULT;
                }
            }
            catch (Exception e)
            {
                debug("insert or update or delete error", e.Message);
                throw new Exception(e.Message);
            }
            finally
            {
                if (statement != null)
                {
                    statement.Dispose();
                }
            }
        }

        private class SQLitePLuginResult
        {
            public readonly List<Object> rows;
            public readonly List<string> columns;
            public readonly int rowsAffected;
            public readonly long insertId;
            public readonly Exception error;

            public SQLitePLuginResult(List<Object> rows, List<string> columns,
                              int rowsAffected, long insertId, Exception error)
            {
                this.rows = rows;
                this.columns = columns;
                this.rowsAffected = rowsAffected;
                this.insertId = insertId;
                this.error = error;
            }
        }
        private class ReadOnlyException : Exception
        {
            public ReadOnlyException() : base("could not prepare statement (23 not authorized)")
            {
            }
        }
    }
}
