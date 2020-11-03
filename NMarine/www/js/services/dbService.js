app.service('dbService', function($q, $http, appConstants, addOrderService, $rootScope) {
  this.upsertOrder = function(order, callback) {
    var getOrderData = { "Orders": order };
    dbo.selectTable('OrdersMaster', "SysTrxNo=?", [order.OrderHdr.SysTrxNo], function(results) {
      if (!results.success) {
        return false;
      }
      var len = results.data.rows.length;
      var orderHdrData = $rootScope.formOrderHeaderJson(order.OrderHdr);
      if (len > 0) {
        dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [order.OrderHdr.SysTrxNo, order.OrderHdr.Status, JSON.stringify(getOrderData), JSON.stringify(orderHdrData), order.OrderHdr.SysTrxNo], callback);
      } else {
        dbo.insertTableData('OrdersMaster', ['orderNo', 'SysTrxNo', 'status', 'orderData', 'orderHdrData', 'dateTime'], [order.OrderHdr.OrderNo, order.OrderHdr.SysTrxNo, order.OrderHdr.Status, JSON.stringify(getOrderData), JSON.stringify(orderHdrData), new Date()], callback);
      }
    });
  };
  this.upsertData = function(id, orderNo, SysTrxNo, data, type, callback) {
    dbo.selectTable('DataMaster', "id=?", [id], function(results) {
      if (!results.success) {
        return false;
      }
      var len = results.data.rows.length;
      if (len > 0) {
        dbo.updateTableData('DataMaster', ['data=?'], ['id=?'], [data, id], function(res) {
          callback(null);
        });
      } else {
        dbo.insertTableData('DataMaster', ['orderNo', 'SysTrxNo', 'data', 'type'], [orderNo, SysTrxNo, data, type], function(tx, res) {
          callback(res.insertId);
        });
      }
    });
  }

  this.upsertDTData = function(orderNo, SysTrxNo, data, type, callback) {
    dbo.selectTable('DataMaster', "SysTrxNo=?", [SysTrxNo], function(results) {
      if (!results.success) {
        return false;
      }
      var len = results.data.rows.length;
      if (len > 0) {
        dbo.updateTableData('DataMaster', ['data=?'], ['SysTrxNo=?'], [data, SysTrxNo], function(res) {
          // callback(null);
        });
      } else {
        dbo.insertTableData('DataMaster', ['orderNo', 'SysTrxNo', 'data', 'type'], [orderNo, SysTrxNo, data, type], function(tx, res) {
          // callback(res.insertId);
        });
      }
    });
  }
  this.upsertAndSave = function(order, callback) {
    this.upsertOrder(order, function() {
      var o = { Orders: order };
      addOrderService.saveOrder(o, order.OrderHdr.OrderNo).then(function(response) {});
      callback();
    })
  }
});