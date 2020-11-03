var dbDriver,
    dbName = 'MarineSales',
    dbVersion = '1.0',
    dbDescription = 'MarineSales Database for Order processing',
    dbSize = 2 * 1024 * 1024;

dbDriver = openDatabase(dbName, dbVersion, dbDescription, dbSize);

var dbo = {};

dbo.createTable = function(tableName, fields) {
    dbDriver.transaction(function(tx) {
        var query = 'CREATE TABLE IF NOT EXISTS ' + tableName + '(' + fields + ')';
        tx.executeSql(query, [], createTableSuccess, createTableError);
    });

    function createTableSuccess(tx, results) {
        void 0;
    }

    function createTableError(error) {
        void 0;
    }

};

dbo.filterOrdersByInsite = function(tableName, whereClause, Column, fields, callbackFunction) {
    var selectColumn = Column;
    dbDriver.readTransaction(function(t) {
        var query = 'SELECT '+selectColumn+' FROM ' + tableName + ' WHERE ' + whereClause + 'ORDER BY OrderNo ASC';
        t.executeSql(query, fields, function(t, data) {
            console.log('calling');
            callbackFunction(data);
        });
    });
}

dbo.selectTable = function(tableName, whereClause, fields, scopeObject) {
    var fields = fields,
        whereClause = whereClause,
        resultSet, callbackFunction = scopeObject,
        res;
    (function(whereClause, fields, tableName) {
        dbDriver.transaction(function(tx) {
            var query;
            if (whereClause && fields.length > 0) {
                void 0;
                query = 'SELECT * FROM ' + tableName + ' WHERE ' + whereClause + ' ORDER BY id ';
            } else {
                void 0;
                query = 'SELECT * FROM ' + tableName + ' ORDER BY id DESC ';
            }
            resultSet = tx.executeSql(query, fields, selectTableSuccess, selectTableError);
        })
    })(whereClause, fields, tableName);

    function selectTableSuccess(tx, results) {
        var len = results.rows.length,
            i;
        res = { "success": true, "data": results };
        callbackFunction(res);
        return res;

    }

    function selectTableError(error,error2) {
        console.log(error);
        console.log(error2);
        res = { "success": false, "data": error };
        callbackFunction(res);
        return res;
    }
}

dbo.insertTableData = function(tableName, fieldsArray, fieldsDataArray, scopeObject) {
    var qusOperator = [],
        fields = fieldsArray;
    fieldsData = fieldsDataArray,
        callbackFunction = scopeObject;
    for (var i = 0; i < fieldsData.length; i++) {
        qusOperator.push('?');
    }
    (function(tableName, fields,fieldsData,qusOperator, callbackFunction) {
        dbDriver.transaction(function(tx) {
            var query = 'INSERT INTO ' + tableName + ' (' + fields + ') VALUES (' + qusOperator + ')';
            tx.executeSql(query, fieldsData, callbackFunction, callbackFunction);

        })
    })(tableName, fields, fieldsData, qusOperator, callbackFunction);
}


dbo.insertTableMultipleData = function(tableName, fieldsArray, fieldsDataArray, scopeObject) {

    var qusOperator = [],
        fields = fieldsArray;
    fieldsData = fieldsDataArray,
        callbackFunction = scopeObject;
    for (var i = 0; i < fieldsData.length; i++) {
        qusOperator.push('?');
    }
    (function(tableName, fields, qusOperator, fieldsData, callbackFunction) {
        dbDriver.transaction(function(tx) {
            var query = 'INSERT INTO ' + tableName + ' (' + fields + ') VALUES (' + qusOperator + ')';
            tx.executeSql(query, fieldsData, callbackFunction, callbackFunction);

        })
    })(tableName, fields, qusOperator, fieldsData, callbackFunction, callbackFunction);
}


dbo.updateTableData = function(tableName, fieldsArray, whereCluase, fieldsDataArray, scopeObject) {
    var callbackFunction = scopeObject;
    (function(tableName, fieldsArray, fieldsDataArray, whereCluase) {
        dbDriver.transaction(function(tx) {
            var query = 'UPDATE ' + tableName + ' SET ' + fieldsArray + ' WHERE ' + whereCluase + '';
            void 0
            tx.executeSql(query, fieldsDataArray, callbackFunction, callbackFunction);

        })
    })(tableName, fieldsArray, fieldsDataArray, whereCluase, callbackFunction)

}

dbo.deleteTableData = function(tableName, whereClause, fields, cb) {
    var fields = fields,
        whereClause = whereClause;
    (function(tableName, whereClause, fields, cb) {
        if(tableName == "SyncMaster" || tableName == "OrdersMaster" || tableName == "DoiMaster" || tableName == "DataMaster"){
            dbDriver.transaction(function(tx) {
                var query;
                if (whereClause) {
                    void 0; 
                    query = 'DELETE FROM ' + tableName + ' where ' + whereClause;
                } else {
                    void 0;
                    query = 'DELETE FROM ' + tableName + '';
                }
                void 0;
                tx.executeSql(query, fields, deleteTableSuccess, deleteTableError);
            });
        }else{
            dbDriver.transaction(function(tx) {
                var query;
                if (whereClause && fields.length > 0) {
                    void 0;
                    query = 'DELETE FROM ' + tableName + ' where ' + whereClause;
                } else {
                    void 0;
                    query = 'DELETE FROM ' + tableName + '';
                }
                void 0;
                tx.executeSql(query, fields, deleteTableSuccess, deleteTableError);
            });
        }

        function deleteTableSuccess(tx, results) {
            if (cb) {
                cb();
            }
        }

        function deleteTableError(error) {
            if (cb) {
                cb();
            }
        }
    })(tableName, whereClause, fields, cb)

};

dbo.getData = function(tableName, whereClause, callbackFn) {
    dbDriver.transaction(function(tx) {
        var query = 'SELECT * FROM ' + tableName + ' WHERE' + whereClause +'  ORDER BY id ASC';
        tx.executeSql(query, [], getSuccess, getFailure);

        function getSuccess(err, res) {
            callbackFn(res)
        }

        function getFailure(data, err) {
            console.log(data, err)
        }
    });
}
dbo.getUniqueOrders=function(tableName,whereClause,callbackFn){

dbDriver.transaction(function(tx) {
        var query = 'SELECT DISTINCT SysTrxNo FROM ' + tableName + '  ORDER BY id ASC';
        tx.executeSql(query, [], getSuccess, getFailure);

        function getSuccess(err, res) {
            callbackFn(res)
        }

        function getFailure(data, err) {
            console.log(data, err)
        }
    });
}
dbo.ordersMasterTable = function(tableName, callbackFunction) {
    var resultSet, res;
    (function(tableName) {
        dbDriver.transaction(function(tx) {
            var query = 'SELECT * FROM ' + tableName + '  ORDER BY id DESC';
            resultSet = tx.executeSql(query, [], x, y);
        })

        function x(tx, results) {
            var len = results.rows.length,
                i;
            res = { "success": true, "data": results };

            callbackFunction(res);
            return res;

        }

        function y(error) {
            res = { "success": false, "data": error };
            return res;
        }

    })(tableName);
}

/* Offline Process */
dbo.offselectTable = function(tableName, whereClause, stIn, endIn, fields, scopeObject) {
    var fields = fields,
        whereClause = whereClause,
        resultSet, callbackFunction = scopeObject,
        res;
    console.log("fields", fields,whereClause,stIn, endIn);
    (function(whereClause, fields, tableName) {
        dbDriver.transaction(function(tx) {
            var query;
            if (whereClause) {
                void 0;
                query = "SELECT * FROM " + tableName + " WHERE code like  '%"+ whereClause +"%' LIMIT "+stIn+","+endIn;
                // query = "SELECT * FROM " + tableName + " WHERE code like  '%"+ whereClause +"%' LIMIT 1,20";
            } else {
                void 0;
                query = 'SELECT * FROM ' + tableName + ' ORDER BY id DESC LIMIT '+stIn+','+endIn;
                // query = 'SELECT * FROM ' + tableName + ' ORDER BY id DESC LIMIT 1,20';
            }
            console.log("query", query);
            resultSet = tx.executeSql(query, fields, selectTableSuccess, selectTableError);
        })
    })(whereClause, fields, tableName);

    function selectTableSuccess(tx, results) {
        var len = results.rows.length,
            i;
        res = { "success": true, "data": results };
        callbackFunction(res);
        return res;
    }

    function selectTableError(error) {
        res = { "success": false, "data": error };
        return res;
    }
}

/* Get Orders with column */
dbo.selectColumnTable = function(tableName, whereClause, Column, fields, scopeObject) {
    var fields = fields,
        whereClause = whereClause,
        resultSet, callbackFunction = scopeObject,
        res;
        var selectColumn = Column;
    (function(whereClause, fields, tableName) {
        dbDriver.transaction(function(tx) {
            var query;
            if (whereClause && fields.length > 0) {
                void 0;
                query = 'SELECT '+selectColumn+' FROM ' + tableName + ' WHERE ' + whereClause + ' ORDER BY OrderNo ASC';
            } else {
                void 0;
                query = 'SELECT '+selectColumn+' FROM ' + tableName + ' ORDER BY OrderNo ASC';
            }
 
            resultSet = tx.executeSql(query, fields, selectTableSuccess, selectTableError);
        })
    })(whereClause, fields, tableName);

    function selectTableSuccess(tx, results) {
        var len = results.rows.length,
            i;
        res = { "success": true, "data": results };
        callbackFunction(res);
        return res;

    }

    function selectTableError(error,error2) {
        console.log(error);
        console.log(error2);
        res = { "success": false, "data": error };
        callbackFunction(res);
        return res;
    }
}

/* Order Attachment Table */
dbo.OrderAttachmentTable = function(CurrentUTC, scopeObject) {
    var CurrentUTC = CurrentUTC,
        resultSet, callbackFunction = scopeObject,
        res;
    (function(CurrentUTC) {
        dbDriver.transaction(function(tx) {
            var query = 'SELECT SysTrxNo FROM OrderAttachmentMaster WHERE UTC <='+ CurrentUTC;
            resultSet = tx.executeSql(query, [], selectTableSuccess, selectTableError);
        })
    })(CurrentUTC);

    function selectTableSuccess(tx, results) {
        var len = results.rows.length,
            i;
        res = { "success": true, "data": results };
        callbackFunction(res);
        return res;

    }

    function selectTableError(error,error2) {
        console.log(error);
        console.log(error2);
        res = { "success": false, "data": error };
        callbackFunction(res);
        return res;
    }
}

