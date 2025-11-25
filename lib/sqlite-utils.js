// lib/sqlite-utils.js
export function execSqlAsyncFactory(db) {
  return (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(sql, params, (_, result) => resolve(result), (_, error) => { reject(error); return false; });
      });
    });
  };
}
