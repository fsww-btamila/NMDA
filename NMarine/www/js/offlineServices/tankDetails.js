app.service('tankDetails', function($q, $rootScope, $http, appConstants, getAllSiteService) {
  this.initialize = function() {
    var customerId = appConstants.customerId;
    var SiteID = 1015;
    dbo.createTable('TankChartDetail', ['id INTEGER PRIMARY KEY', `TankChartID INTEGER`, `DepthFeet INTEGER`, `Depth NUMERIC`, `DepthFraction INTEGER`, `DepthExtFraction NUMERIC`, `Volume NUMERIC`, `CustomerID TEXT`, 'dateTime']);

    dbo.createTable('TankChartTrim', ['id INTEGER PRIMARY KEY', `TankChartID INTEGER`, `TankChartKeelID INTEGER`, `TrimFeet INTEGER`, `TrimInch INTEGER`, `TrimExtFraction NUMERIC`, `CorrFeet INTEGER`, `CorrInch INTEGER`, `CorrFraction INTEGER`, `CorrExtFraction INTEGER`, `DenominatorTemp INTEGER`, `CustomerID TEXT`, 'dateTime']);

    dbo.createTable('TankChartKeel', ['id INTEGER PRIMARY KEY', `TankChartKeelID INTEGER`, `TankChartID INTEGER`, `KeelTo TEXT`, `KeelDegree NUMERIC`, `CustomerID TEXT`, 'dateTime']);

    // dbo.createTable('Products', ['id INTEGER PRIMARY KEY', 'code TEXT', 'description TEXT', 'productData', 'dateTime']);

    // dbo.createTable('Vessels', ['id INTEGER PRIMARY KEY', 'code TEXT', 'description TEXT', 'vesselsData', 'dateTime']);

    dbo.createTable('Vehicle', ['id INTEGER PRIMARY KEY', 'code TEXT', 'description TEXT', 'vehicleData', 'dateTime']);

    // dbo.createTable('Sites', ['id INTEGER PRIMARY KEY', 'sitesData', 'dateTime']);

    dbo.createTable('InSiteTanks', ['id INTEGER PRIMARY KEY', 'TankID', 'TankChartID', 'Code TEXT', 'Description TEXT', 'tData', 'dateTime']);

    dbo.createTable('InSiteTankSubCompartments', ['id INTEGER PRIMARY KEY', 'SubCompartmentID', 'INSiteTankID', 'TankChartID', 'tSubData', 'dateTime']);

    dbo.createTable('VehicleCompartments', ['id INTEGER PRIMARY KEY', 'CompartmentID', 'vCData', 'dateTime']);

    dbo.createTable('VehicleSubCompartments', ['id INTEGER PRIMARY KEY', 'SubCompartmentID', 'TankChartID', 'vSubData', 'dateTime']);



    /*TankChartDetail*/
    dbo.selectTable('TankChartDetail', "TankChartID=?", [], function(results) {
      var deferred = $q.defer();
      var len = results.data.rows.length;
      if (len > 0) {

      } else {
        /*Offline Services*/
        var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.offlineTankChart + "(" + customerId + "," + SiteID + ")?" + appConstants.dreamFactoryApiKeySet;

        console.log("url", url);
        $http.get(url)
          .success(function(data) {
            void 0;
            console.log("data", data);
            var tcd = data[0];
            for (var i = 0, len = tcd.length; i < len; i++) {
              var TankChartID = tcd[i].TankChartID;
              var DepthFeet = tcd[i].DepthFeet;
              var Depth = tcd[i].Depth;
              var DepthFraction = tcd[i].DepthFraction;
              var DepthExtFraction = tcd[i].DepthExtFraction;
              var Volume = tcd[i].Volume;
              var CustomerID = tcd[i].CustomerID;
              dbo.insertTableMultipleData('TankChartDetail', ['TankChartID', 'DepthFeet', 'Depth', 'DepthFraction', 'DepthExtFraction', 'Volume', 'CustomerID', 'dateTime'], [TankChartID, DepthFeet, Depth, DepthFraction, DepthExtFraction, Volume, CustomerID, new Date()], function(tx, res) {
                console.log("dfsdfsd");
                deferred.resolve();
              });
            }
          }).error(function(err) {
            callback(err);
          });
      }
    });

    /* TankChartTrim */
    dbo.selectTable('TankChartTrim', "TankChartID=?", [], function(results) {
      var deferred = $q.defer();
      var len = results.data.rows.length;
      if (len > 0) {

      } else {
        /*Offline Services*/
        var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.offlineTankChart + "(4108,1015)?" + appConstants.dreamFactoryApiKeySet;
        $http.get(url)
          .success(function(data) {
            void 0;
            console.log("data", data);
            var tct = data[1];
            for (var j = 0, len = tct.length; j < len; j++) {
              var TankChartID = tct[j].TankChartID;
              var TankChartKeelID = tct[j].TankChartKeelID;
              var TrimFeet = tct[j].TrimFeet;
              var TrimInch = tct[j].TrimInch;
              var TrimExtFraction = tct[j].TrimExtFraction;
              var CorrFeet = tct[j].CorrFeet;
              var CorrInch = tct[j].CorrInch;
              var CorrFraction = tct[j].CorrFraction;
              var CorrExtFraction = tct[j].CorrExtFraction;
              var DenominatorTemp = tct[j].DenominatorTemp;
              var CustomerID = tct[j].CustomerID;

              dbo.insertTableMultipleData('TankChartTrim', ['TankChartID', 'TankChartKeelID', 'TrimFeet', 'TrimInch', 'TrimExtFraction', 'CorrFeet', 'CorrInch', 'CorrFraction', 'CorrExtFraction', 'DenominatorTemp', 'CustomerID', 'dateTime'], [TankChartID, TankChartKeelID, TrimFeet, TrimInch, TrimExtFraction, CorrFeet, CorrInch, CorrFraction, CorrExtFraction, DenominatorTemp, CustomerID, new Date()], function(tx, res) {
                console.log("TankChartTrim");
                deferred.resolve();
              });
            }
          }).error(function(err) {
            callback(err);
          });
      }
    });

    /* TankChartKeel */
    dbo.selectTable('TankChartKeel', "TankChartID=?", [], function(results) {
      var deferred = $q.defer();
      var len = results.data.rows.length;
      if (len > 0) {

      } else {
        /*Offline Services*/
        var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.offlineTankChart + "(4108,1015)?" + appConstants.dreamFactoryApiKeySet;
        $http.get(url)
          .success(function(data) {
            void 0;
            console.log("data", data);
            var tck = data[2];
            for (var k = 0, len = tck.length; k < len; k++) {
              var TankChartKeelID = tck[k].TankChartKeelID;
              var TankChartID = tck[k].TankChartID;
              var KeelTo = tck[k].KeelTo;
              var KeelDegree = tck[k].KeelDegree;
              var CustomerID = tck[k].CustomerID;
              dbo.insertTableMultipleData('TankChartKeel', ['TankChartKeelID', 'TankChartID', 'KeelTo', 'KeelDegree', 'CustomerID', 'dateTime'], [TankChartKeelID, TankChartID, KeelTo, KeelDegree, CustomerID, new Date()], function(tx, res) {
                console.log("TankChartKeel");
                deferred.resolve();
              });
            }
          }).error(function(err) {
            callback(err);
          });
      }
    });

    // /* Products */
    // dbo.selectTable('Products', "id=?", [], function(results) {
    //     var deferred = $q.defer();
    //     var len = results.data.rows.length;
    //     if (len > 0) {

    //     } else {
    //         /*Offline Services*/
    //         var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getProducts + "(01,4108,1014,1,80,)?" + appConstants.dreamFactoryApiKeySet;
    //         console.log("ProductUrl:", url);
    //         $http.get(url)
    //             .success(function(data) {
    //                 for (var p = 0, len = data.length; p < len; p++) {
    //                     var proCode = data[p].Code;
    //                     var proDescr = data[p].Descr;
    //                     var pData = JSON.stringify(data[p]);
    //                     dbo.insertTableMultipleData('Products', ['code', 'description', 'productData', 'dateTime'], [proCode, proDescr, pData, new Date()], function(tx, res) {
    //                         deferred.resolve();
    //                     });
    //                 }
    //             }).error(function(err) {
    //                 console.log(err)
    //             });
    //     }
    // });

    // /* Vessels */
    // dbo.selectTable('Vessels', "id=?", [], function(results) {
    //     var deferred = $q.defer();
    //     var len = results.data.rows.length;
    //     if (len > 0) {

    //     } else {
    //         /*Offline Services*/
    //         var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getVessels + "(01,4108,1,200,)?" + appConstants.dreamFactoryApiKeySet;
    //         console.log("Vessels", url);
    //         $http.get(url)
    //             .success(function(data) {
    //                 for (var v = 0, len = data.length; v < len; v++) {
    //                     var vesCode = data[v].VesselCode;
    //                     var vesDescr = data[v].VesselDescr;
    //                     var vData = JSON.stringify(data[v]);
    //                     dbo.insertTableMultipleData('Vessels', ['code', 'description', 'vesselsData', 'dateTime'], [vesCode, vesDescr, vData, new Date()], function(tx, res) {
    //                         console.log("Vessels");
    //                         deferred.resolve();
    //                     });
    //                 }
    //             }).error(function(err) {
    //                 console.log(err)
    //             });
    //     }
    // });

    /* Vehicle */
    dbo.selectTable('Vehicle', "id=?", [], function(results) {
      var deferred = $q.defer();
      var len = results.data.rows.length;
      if (len > 0) {

      } else {
        /*Offline Services*/
        var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getVehicles + "(01,4108)?" + appConstants.dreamFactoryApiKeySet;
        console.log("Vehicle", url);
        $http.get(url)
          .success(function(data) {
            for (var o = 0, len = data.length; o < len; o++) {
              var vehCode = data[o].Code;
              var vehDescr = data[o].Descr;
              var vehData = JSON.stringify(data[o]);
              dbo.insertTableMultipleData('Vehicle', ['code', 'description', 'vehicleData', 'dateTime'], [vehCode, vehDescr, vehData, new Date()], function(tx, res) {
                console.log("GetVehicle");
                deferred.resolve();
              });
            }
          }).error(function(err) {
            console.log(err)
          });
      }
    });

    // /* Sites */
    // dbo.selectTable('Sites', "id=?", [], function(results) {
    //     var deferred = $q.defer();
    //     var len = results.data.rows.length;
    //     if (len > 0) {

    //     } else {
    //         /*Offline Services*/
    //         getAllSiteService.getAllSites().then(function(response) {
    //             if (response.data.length > 0) {
    //                 dbo.insertTableMultipleData('Sites', ['sitesData', 'dateTime'], [JSON.stringify(response.data), new Date()], function(tx, res) {
    //                     console.log("Sites");
    //                     deferred.resolve();
    //                 });

    //             } else {
    //                 console.log(response);
    //             }
    //         });

    //     }
    // });

    /*
    InSiteTanks
    */
    dbo.selectTable('InSiteTanks', "id=?", [], function(results) {
      var deferred = $q.defer();
      var len = results.data.rows.length;
      if (len > 0) {

      } else {
        /*Offline Services*/
        var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getSourceTanks + "(01,4108,1014,1900,N,2017-10-31)?" + appConstants.dreamFactoryApiKeySet;
        $http.get(url)
          .success(function(data) {
            console.log(data);
            for (var i = 0, len = data.length; i < len; i++) {
              var tCode = data[i].Code;
              var tDescr = data[i].Descr;
              var tcId = data[i].TankChartID;
              var tid = data[i].TankID;
              var tData = data[i];
              dbo.insertTableMultipleData('InSiteTanks', ['Code', 'Description', 'TankID', 'TankChartID', 'tData', 'dateTime'], [tCode, tDescr, tcId, tid, JSON.stringify(tData), new Date()], function(tx, res) {
                console.log(res);
                deferred.resolve();
              });
            }
          }).error(function(err) {
            console.log(err)
          });
      }
    });


    dbo.selectTable('InSiteTankSubCompartments', "id=?", [], function(results) {
      var deferred = $q.defer();
      var len = results.data.rows.length;
      if (len > 0) {

      } else {
        /*Offline Services*/
        var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getTankSubCompartments + "(4108,1195)?" + appConstants.dreamFactoryApiKeySet;
        $http.get(url)
          .success(function(data) {
            console.log(data);
            for (var i = 0, len = data.length; i < len; i++) {
              var tid = data[i].INSiteTankID;
              var tSubId = data[i].SubCompartmentID;
              var tcId = data[i].TankChartID;
              var tSubData = data[i];
              dbo.insertTableMultipleData('InSiteTankSubCompartments', ['INSiteTankID', 'SubCompartmentID', 'TankChartID', 'tSubData', 'dateTime'], [tid, tSubId, tcId, JSON.stringify(tSubData), new Date()], function(tx, res) {
                console.log(res);
                deferred.resolve();
              });
            }
          }).error(function(err) {
            console.log(err)
          });
      }
    });
    dbo.selectTable('VehicleCompartments', "id=?", [], function(results) {
      var deferred = $q.defer();
      var len = results.data.rows.length;
      if (len > 0) {

      } else {
        /*Offline Services*/
        var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getVehicleCompartments + "(4108,1012)?" + appConstants.dreamFactoryApiKeySet;
        $http.get(url)
          .success(function(data) {
            console.log(data);
            for (var i = 0, len = data.length; i < len; i++) {
              var vCId = data[i].CompartmentID;
              var vCData = data[i];
              dbo.insertTableMultipleData('VehicleCompartments', ['CompartmentID', 'vCData', 'dateTime'], [vCId, JSON.stringify(vCData), new Date()], function(tx, res) {
                console.log(res);
                deferred.resolve();
              });
            }
          }).error(function(err) {
            console.log(err)
          });
      }
    });
    dbo.selectTable('VehicleSubCompartments', "id=?", [], function(results) {
      var deferred = $q.defer();
      var len = results.data.rows.length;
      if (len > 0) {

      } else {
        /*Offline Services*/
        var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getVehicleSubCompartments + "(4108,1012,1048)?" + appConstants.dreamFactoryApiKeySet;
        $http.get(url)
          .success(function(data) {
            console.log(data);
            for (var i = 0, len = data.length; i < len; i++) {
              var vSubId = data[i].SubCompartmentID;
              var vTCId = data[i].TankChartID;
              var vSubData = data[i];
              dbo.insertTableMultipleData('VehicleSubCompartments', ['SubCompartmentID', 'TankChartID', 'vSubData', 'dateTime'], [vSubId, vTCId, JSON.stringify(vSubData), new Date()], function(tx, res) {
                console.log(res);
                deferred.resolve();
              });
            }
          }).error(function(err) {
            console.log(err)
          });
      }
    });


    //http://dreamfactory.firestreamonline.com/api/v2/MarineDeliveryLive/_proc/MN_GetInSiteTankSubCompartments(4108,1195)?api_key=0e504ed885ffa7c895e95e6a1487823522ef8dd6259cef702e285f737bca4f2e

  }
});