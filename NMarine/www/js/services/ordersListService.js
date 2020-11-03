app.service('ordersListService', function($q, $http, appConstants, $rootScope, $localstorage) {
  var customerId = appConstants.customerId,
    companyId = appConstants.companyId;
  this.getOrdersList = function() {
    //Multi Device supported
    if (appConstants.source === 'ordersNew') {
      var openSynDTM, shipSynDTM, OpenlastRequestTime, ShiplastRequestTime;
      if ($rootScope.clearDateTime && window.cordova) {
        openSynDTM = null;
        shipSynDTM = null;
      } else {
        openSynDTM = ($localstorage.get('Open-syncDateTime') != undefined) ? $localstorage.get('Open-syncDateTime') : null;
        shipSynDTM = ($localstorage.get('Ship-syncDateTime') != undefined) ? $localstorage.get('Ship-syncDateTime') : null;
      }
      OpenlastRequestTime = ($localstorage.get('OpenlastRequestTimestamp') != undefined) ? $localstorage.get('OpenlastRequestTimestamp') : 0;
      ShiplastRequestTime = ($localstorage.get('ShiplastRequestTimestamp') != undefined) ? $localstorage.get('ShiplastRequestTimestamp') : 0;
      var ordersJson = { "OrdersInp": { "CustomerID": $rootScope.accSettings.customerId, "CompanyID": $rootScope.CompanyID || $rootScope.selectedSite.CompanyID, "LastUpdatedDtTm": openSynDTM, "ShipLastUpdatedDtTm": shipSynDTM, "OpenlastRequestTs": OpenlastRequestTime, "ShiplastRequestTs": ShiplastRequestTime, "SessionID": $rootScope.SessionID, "User": $rootScope.loginData.uname } };
      var parameter = {
        "params": [{
          "name": "JsonValue",
          "param_type": "IN",
          "value": JSON.stringify(ordersJson)
        }]
      };
      return $http.post(appConstants.baseUrl + appConstants.procedureServices.getOredersNew , JSON.stringify(parameter));

    } else {
      //Single Device supported
      var syncDate = '';
      if ($localstorage.get('syncDateTime')) {
        if ($localstorage.get('syncDateTime') != 'null') {
          // syncDate = new Date($localstorage.get('syncDateTime')).toISOString(); 
          syncDate = $localstorage.get('syncDateTime');
          syncDate = syncDate.replace(/ /g, "T");
          syncDate = syncDate + ":00";
        } else {
          syncDate = null;
        }
      } else {
        syncDate = null;
      }
      return $http.get(appConstants.wcfBaseUrl + appConstants.wcfServices.getOrders, { params: { CompanyID: $rootScope.CompanyID, CustomerID: customerId, LastUpdatedDateTime: syncDate } })
        .success(function(data) {
          return data;
        }).error(function(err) {
          void 0;
          return err;
        });
    }
  };

  this.getOrdersHistory = function(arShipToID) {
    return $http.get(appConstants.wcfBaseUrl + appConstants.wcfServices.getOrdersHistory, { params: { CompanyID: companyId, CustomerID: customerId, ARShipToID: arShipToID } })
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };

  this.getCustomersList = function(lazyLoadParams) {

    if (lazyLoadParams.SearchText) {
      reqData = customerId + "," + '' + "," + '' + "," + lazyLoadParams.SearchText;
    } else if (lazyLoadParams.MinRecord && lazyLoadParams.MaxRecord) {
      reqData = customerId + "," + lazyLoadParams.MinRecord + "," + lazyLoadParams.MaxRecord + "," + lazyLoadParams.SearchText;
    } else {
      reqData = customerId;
    }

    return $http.get(appConstants.baseUrl + appConstants.procedureServices.getAllCustomers + "(" + reqData + ")?" + appConstants.dreamFactoryApiKeySet)
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };

  this.getContacts = function(lazyLoadParams, shiptoID) {
    if (lazyLoadParams.SearchText) {
      reqData = customerId + "," + '' + "," + '' + "," + lazyLoadParams.SearchText;
    } else if (lazyLoadParams.MinRecord && lazyLoadParams.MaxRecord) {
      reqData = customerId + "," + lazyLoadParams.MinRecord + "," + lazyLoadParams.MaxRecord + "," + lazyLoadParams.SearchText;
    } else {
      reqData = customerId + "," + shiptoID;
    }

    return $http.get(appConstants.baseUrl + appConstants.procedureServices.getContacts + "(" + reqData + ")?" + appConstants.dreamFactoryApiKeySet)
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };

  this.getOrderNotes = function(stNo) {
    let reqData = "SysTrxNo=" + stNo;
    return $http.get(appConstants.baseUrl + appConstants.procedureServices.getOrderNotes + "?"+ reqData)
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };

  this.updateOrderNote = function(note) {
    var noteParam = { "orderNoteUpdate": { "OderNoteList": [note] } };
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(noteParam)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.procedureServices.updateOrderNote, parameter);
  }
});