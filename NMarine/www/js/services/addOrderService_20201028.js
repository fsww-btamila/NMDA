app.service('addOrderService', function($q, $rootScope, $http, appConstants, getAllSiteService, readingService, weightVolumeService, $cordovaSQLite) {
  var customerId = appConstants.customerId;
  var companyId = appConstants.companyId;
  /* Get Products and Tanks Details are loaded on local Data */
  var loadingOffline;
  if (!window.cordova) {
    loadingOffline = false;
  } else {
    loadingOffline = appConstants.LoadingOffline;
  }

  function parameterizeWithComp(p_array) {
    $rootScope.CompanyID = ($rootScope.CompanyID != undefined && $rootScope.CompanyID != null) ? $rootScope.CompanyID : $rootScope.selectedSite.CompanyID;
    return '(' + $rootScope.CompanyID + ',' + customerId + ',' + p_array.join() + ')' + '?';
  }

  function parameterizeWithCompCalciWeight(p_array) {
    $rootScope.CompanyID = ($rootScope.CompanyID != undefined && $rootScope.CompanyID != null) ? $rootScope.CompanyID : $rootScope.selectedSite.CompanyID;
    return '(' + $rootScope.CompanyID + ',' + p_array.join() + ')' + '?';
  }

  function parameterize(p_array) {
    return '(' + customerId + ',' + p_array.join() + ')' + '?';
  }
  this.getProducts = function(lazyLoadParams, activeStatus, callback) {
    var reqData = $rootScope.CompanyID + ",";
    var searchTxt = lazyLoadParams.SearchText;
    var startIndex = lazyLoadParams.MinRecord;
    var endIndex = lazyLoadParams.MaxRecord;
    if (searchTxt) {
      reqData += customerId + "," + $rootScope.MasterSiteID + "," + '' + "," + '' + "," + searchTxt;
    } else if (startIndex && endIndex) {
      reqData += customerId + "," + $rootScope.MasterSiteID + "," + startIndex + "," + endIndex + "," + searchTxt;
    } else {
      reqData += customerId + "," + $rootScope.MasterSiteID;
    }
    if (activeStatus != 'Open') {
      if (!searchTxt) {
        reqData = reqData + '';
      }
      // reqData = reqData + ',' + 'B';
    }

    if ($rootScope.isInternet && $rootScope.online && !loadingOffline) {
      var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getProducts + "(" + reqData + ")?" + appConstants.dreamFactoryApiKeySet;
      $http.get(url)
        .success(function(data) {
          callback(data);
        }).error(function(err) {
          callback(err)
        });
    } else {
      var query = "";
      if (searchTxt) {
        endIndex = 100;
        startIndex = 0;
        query = "SELECT * FROM Products WHERE SiteID='" + $rootScope.MasterSiteID + "' AND CustomerID =" + customerId + " AND CompanyID ='" + $rootScope.CompanyID + "' AND MasterProdType IN('S','B') AND (Descr like '%" + searchTxt + "%' OR Code like '%" + searchTxt + "%') ORDER BY Code";
        if (startIndex && endIndex) {
          query += " LIMIT " + endIndex + " OFFSET " + (startIndex - 1);
        } else {
          query += "";
        }
      } else {
        query = "SELECT * FROM Products WHERE SiteID='" + $rootScope.MasterSiteID + "' AND CustomerID =" + customerId + " AND CompanyID ='" + $rootScope.CompanyID + "' AND MasterProdType IN('S','B') ORDER BY Code";
        if (startIndex && endIndex) {
          query += " LIMIT " + 20 + " OFFSET " + (startIndex - 1);
        } else {
          query += "";
        }
      }
      var proDataArr = [];
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            data['MasterProdID'] = result.MasterProdID;
            data['Code'] = result.Code;
            data['SiteID'] = result.SiteID;
            data['Descr'] = result.Descr;
            data['IsPackaged'] = result.IsPackaged;
            data['IsBillable'] = result.IsBillable;
            data['UnitPrice'] = (result.UnitPrice == "NULL" && result.UnitPrice == "undefined") ? 0 : result.UnitPrice;
            data['AvailableQty'] = (result.AvailableQty == "NULL" && result.AvailableQty == "undefined") ? 0 : result.AvailableQty;
            data['MasterProdType'] = result.MasterProdType;
            data['BIUOMID'] = result.BIUOMID == "NULL" ? null : result.BIUOMID;
            data['BIUOM'] = result.BIUOM == "NULL" ? null : result.BIUOM;
            data['BIEnableTankReadings'] = result.BIEnableTankReadings == "NULL" ? null : result.BIEnableTankReadings;
            data['AllowNegative'] = result.AllowNegative;
            data['ProdContID'] = (result.ParentID == "NULL") ? 0 : result.ParentID;
            data['ConversionFactor'] = (result.ConversionFactor == "NULL") ? null : result.ConversionFactor;
            data['CriticalDescription'] = (result.CriticalDescription == "NULL") ? null : result.CriticalDescription;
            data['DefConversionUOMID'] = (result.DefConversionUOMID == "NULL") ? null : result.DefConversionUOMID;
            data['DefOnHandUOMID'] = (result.DefOnHandUOMID == "NULL") ? null : result.DefOnHandUOMID;
            data['HazmatDesc'] = (result.HazmatDesc == "NULL") ? null : result.HazmatDesc;
            data['OnConversionUOM'] = (result.OnConversionUOM == "NULL") ? null : result.OnConversionUOM;
            data['OnCountUOM'] = (result.OnCountUOM == "NULL") ? null : result.OnCountUOM;
            data['OnCountUOMID'] = (result.OnCountUOMID == "NULL") ? null : result.OnCountUOMID;
            data['OnHandUOM'] = (result.OnHandUOM == "NULL") ? null : result.OnHandUOM;
            data['SellByUOM'] = (result.SellByUOM == "NULL") ? null : result.SellByUOM;
            data['SellByUOMID'] = (result.SellByUOMID == "NULL") ? null : result.SellByUOMID;
            data['IsBulk'] = (result.IsBulk == "NULL") ? "N" : result.IsBulk;
            proDataArr.push(data);
          }
          callback(proDataArr);
        } else {
          callback(proDataArr);
          console.log("No results found");
        }
      }, function(err) {
        callback(err);
      });

    }
  };
  this.getVessels = function(searchVesselParams, callback) {
    var reqData = $rootScope.CompanyID + ",";
    var searchTxt = searchVesselParams.SearchText;
    var startIndex = searchVesselParams.MinRecord;
    var endIndex = searchVesselParams.MaxRecord;
    if (searchTxt) {
      reqData += customerId + "," + '' + "," + '' + "," + searchTxt;
    } else if (startIndex && endIndex) {
      reqData += customerId + "," + startIndex + "," + endIndex + "," + searchTxt;
    } else {
      reqData += customerId
    }

    if ($rootScope.isInternet && $rootScope.online && !loadingOffline) {
      var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getVessels + "(" + reqData + ")?" + appConstants.dreamFactoryApiKeySet;
      $http.get(url)
        .success(function(data) {
          callback(data);
        }).error(function(err) {
          callback(err);
        });

    } else {
      var query = "";
      if (searchTxt) {
        endIndex = 100;
        startIndex = 0;
        query = "SELECT * FROM Vessel WHERE CustomerID =" + customerId + " AND CompanyID in('" + $rootScope.CompanyID + "', '00')  AND ( VesselDescr like '%" + searchTxt + "%' OR VesselCode like '%" + searchTxt + "%')  ORDER BY VesselCode";
        if (startIndex && endIndex) {
          query += " LIMIT " + endIndex + " OFFSET " + (startIndex - 1);
        } else {
          query += "";
        }
      } else {
        query = "SELECT * FROM Vessel WHERE CustomerID =" + customerId + " AND CompanyID in('" + $rootScope.CompanyID + "', '00') ORDER BY VesselCode";
        if (startIndex && endIndex) {
          query += " LIMIT " + 20 + " OFFSET " + (startIndex - 1);
        } else {
          query += "";
        }
      }
      var vesselArr = [];
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            data['CustomerName'] = result.CustomerName;
            data['CustomerNumber'] = result.CustomerNumber;
            data['GrossTonnage'] = (result.GrossTonnage == "NULL") ? '' : result.GrossTonnage;
            data['ID'] = result.ID;
            data['IMONo'] = result.IMONo;
            data['OwnershipStdAcctID'] = result.OwnershipStdAcctID;
            data['StandardAcctNo'] = result.StandardAcctNo;
            data['VesselCode'] = result.VesselCode;
            data['VesselDescr'] = result.VesselDescr;
            data['VesselID'] = result.VesselID;
            vesselArr.push(data);
          }
          callback(vesselArr);
        } else {
          callback(vesselArr);
          console.log("No results found");
        }
      }, function(err) {
        callback(err);
      });
    }
  };
  this.getDrivers = function(callback) {
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getDrivers + "(" + customerId + ")?" + appConstants.dreamFactoryApiKeySet;
    $http.get(url, { cache: true })
      .success(function(data) {
        void 0;
        callback(data);
      }).error(function(err) {
        callback(err);
      });
  };
  this.getVehicles = function(callback) {
    if ($rootScope.isInternet && $rootScope.online) {
      var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getVehicles + "(" + $rootScope.CompanyID + "," + customerId + ")?" + appConstants.dreamFactoryApiKeySet;
      $http.get(url)
        .success(function(data) {
          callback(data);
        }).error(function(err) {
          callback(err);
        });

    } else {
      var deferred = $q.defer();
      var query = "SELECT * FROM Vehicle WHERE CompanyID=" + $rootScope.CompanyID + " AND CustomerID=" + customerId;
      var vehicleArr = [];
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            data['VehicleID'] = result.VehicleID;
            data['Code'] = result.Code;
            data['EnableSubCompartment'] = result.EnableSubCompartment;
            data['EnableShipmentMarineApp'] = result.EnforceShipmentMarineApp;
            data['TankCount'] = result.TankCount;
            data['CustomerID'] = result.CustomerID;
            data['CompanyID'] = result.CompanyID;
            vehicleArr.push(data);
          }
        }
        deferred.resolve(vehicleArr);
      }, function(err) {
        console.log(err);
      });
      return deferred.promise;
    }
  };
  this.getInsites = function(callback) {
    getAllSiteService.getAllSites().then(function(response) {
      void 0;
      callback(response.data)
    });
  }
  this.getAvailability = function(details) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(details)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getAvailability + appConstants.dreamFactoryApiKeySet, JSON.stringify(parameter));
  };

  this.saveOrder = function(reqData, orderNo) {
    $rootScope.lastSyncTime = Date.now();
    var orderList = { "OrderList": { "Orders": [reqData.Orders], "CustomerID": customerId, "UserID": reqData.Orders.OrderHdr.EnteredBy, "CustomerDesc": reqData.CustomerName } };
    var json = JSON.stringify(orderList, function(key, value) {
      if (key === "$$hashKey") {
        return undefined;
      }

      return value;
    });
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        // "value": json.replace(/&/g, ''),
        "value": json,
        "orderNo": orderNo
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.saveOrder + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err, p1, p2, p3) {
        return err;
      });
  }
  this.getTanks = function(callback) {
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getTanks + "(" + customerId + ")?" + appConstants.dreamFactoryApiKeySet;
    $http.get(url, { cache: true })
      .success(function(data) {
        void 0;
        callback(data);
      }).error(function(err) {
        callback(err);
      });
  };
  this.getSourceTanks = function(insiteID, ProdContID, dt, callback) {
    if (dt) {
      var parameterString = parameterizeWithComp([insiteID, ProdContID, 'N', dt]);
    } else {
      var parameterString = parameterizeWithComp([insiteID, ProdContID]);
    }
    if ($rootScope.isInternet && $rootScope.online && !loadingOffline) {
      var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getSourceTanks + parameterString + appConstants.dreamFactoryApiKeySet;
      return $http.get(url, { cache: false })
    } else {
      var deferred = $q.defer();
      var query = "";
      var whereClause = "";
      if (ProdContID) {
        query = "SELECT INSiteTanks.* FROM (INSiteTanks) JOIN (INSiteTank_Products) ON (INSiteTanks.CustomerID = INSiteTank_Products.CustomerID  AND INSiteTanks.TankID = INSiteTank_Products.InSiteTankID AND INSiteTanks.ProdContID = INSiteTank_Products.ProdContID)  JOIN (SELECT InSiteTankID, MAX(datetime(effectivedate)) AS EffectiveDate FROM INSiteTank_Products GROUP BY InSiteTankID) AS T ON T.InSiteTankID = InSiteTank_Products.InSiteTankID AND T.effectivedate = INSiteTank_Products.effectivedate WHERE INSiteTanks.INSiteID="+ insiteID +" AND INSiteTanks.CustomerID="+ customerId +" AND IFNULL((CASE WHEN INSiteTanks.Active = '' THEN 'Y' ELSE INSiteTanks.Active END), 'Y') = 'Y'  AND (INSiteTank_Products.ProdContID = "+ ProdContID +" OR (INSiteTank_Products.ProdContID IN (SELECT SubProdContID FROM Substitutes WHERE ProdContID = "+ ProdContID +"))) ORDER BY INSiteTanks.Code";
      } else {
        query = "SELECT * FROM INSiteTanks WHERE  INSiteID=" + insiteID + " AND CustomerID=" + customerId + " GROUP BY INSiteID,TankID  ORDER BY Code";
      }
      
      var tankArr = [];
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            data['Code'] = result.Code;
            data['CustomerID'] = result.CustomerID;
            data['Denominator'] = result.Denominator;
            data['Depth'] = result.Depth;
            data['DepthFeet'] = result.DepthFeet;
            data['DepthFraction'] = result.DepthFraction;
            data['Descr'] = result.Descr;
            data['HasLinearExpansionCoeff'] = result.HasLinearExpansionCoeff;
            data['LinearExpansionCoeff'] = (result.LinearExpansionCoeff == "NULL") ? null : result.LinearExpansionCoeff;
            data['TankOperatingTemp'] = (result.TankOperatingTemp == "NULL") ? null : result.TankOperatingTemp;
            data['Insulated'] = result.Insulated;
            data['HasTrimCorrections'] = result.HasTrimCorrections;
            data['INSiteID'] = result.INSiteID;
            data['LinearUOM'] = result.LinearUOM;
            data['LinearUOMCode'] = result.LinearUOMCode;
            data['MaxDenominator'] = result.MaxDenominator;
            data['MaxInch'] = result.MaxInch;
            data['SubCompartmentID'] = result.SubCompartmentID;
            data['TankCapacity'] = result.TankCapacity;
            data['TankChartID'] = result.TankChartID;
            data['TankID'] = result.TankID;
            data['TankType'] = result.TankType;
            data['VolumeUOM'] = result.VolumeUOM;
            data['VolumeUOMCode'] = (result.VolumeUOMCode == "NULL") ? null : result.VolumeUOMCode;
            data['EffectiveTankProContDesc'] = result.EffectiveTankProContDesc;
            tankArr.push(data);
          }
        }
        var tanks = {};
        tanks.data = tankArr;
        deferred.resolve(tanks);
      }, function(err) {
        console.log(err);
      });
      return deferred.promise;
    }
  };

  this.getTankSubCompartments = function(INSiteTankID, callback) {
    var parameterString = parameterize([INSiteTankID]);
    if ($rootScope.isInternet && $rootScope.online && !loadingOffline) {
      var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getTankSubCompartments + parameterString + appConstants.dreamFactoryApiKeySet;
      return $http.get(url, { cache: false })
    } else {
      var deferred = $q.defer();
      var query = "SELECT * FROM InSiteTankSubCompartments WHERE INSiteTankID=" + INSiteTankID + " AND CustomerID=" + customerId;
      var tankSUbArr = [];
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            data['INSiteTankID'] = result.INSiteTankID;
            data['SubCompartmentID'] = result.SubCompartmentID;
            data['ReadingSide'] = result.ReadingSide;
            data['TankChartID'] = result.TankChartID;
            data['CustomerID'] = result.CustomerID;
            data['Denominator'] = result.Denominator;
            data['CompartmentCode'] = result.CompartmentCode;
            data['DepthFeet'] = result.DepthFeet;
            data['Depth'] = result.Depth;
            data['DepthFraction'] = result.DepthFraction;
            data['MaxInch'] = result.MaxInch;
            data['MaxDenominator'] = result.MaxDenominator;
            data['VolumeUOM'] = result.VolumeUOM;
            data['LinearUOM'] = result.LinearUOM;
            data['VolumeUOMCode'] = result.VolumeUOMCode;
            data['LinearUOMCode'] = result.LinearUOMCode;
            data['Code'] = result.Code;
            data['TankChartCode'] = result.TankChartCode;
            tankSUbArr.push(data);
          }
        }
        var tankSubComp = {};
        tankSubComp.data = tankSUbArr;
        deferred.resolve(tankSubComp);
      }, function(err) {
        console.log(err);
      });
      return deferred.promise;
    }
  }
  this.getVehicleCompartments = function(vehicleID, callback) {
    var parameterString = parameterize([vehicleID]);
    if ($rootScope.isInternet && $rootScope.online) {
      var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getVehicleCompartments + parameterString + appConstants.dreamFactoryApiKeySet;
      return $http.get(url, { cache: false })
    } else {
      var deferred = $q.defer();
      var query = "SELECT * FROM VehicleCompartments WHERE VehicleID=" + vehicleID + " AND CustomerID=" + customerId + " ORDER BY Code";
      var vehicleComArr = [];
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            data['VehicleID'] = result.VehicleID;
            data['CompartmentID'] = result.CompartmentID;
            data['Code'] = result.Code;
            data['Capacity'] = result.Capacity;
            data['CustomerID'] = result.CustomerID;
            vehicleComArr.push(data);
          }
        }
        var vComArr = {};
        vComArr.data = vehicleComArr;
        deferred.resolve(vComArr);
      }, function(err) {
        console.log(err);
      });
      return deferred.promise;
    }
  };
  this.getVehicleSubCompartments = function(vehicleID, compartmentID, callback) {
    var parameterString = parameterize([vehicleID, compartmentID]);
    if ($rootScope.isInternet && $rootScope.online) {
      var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getVehicleSubCompartments + parameterString + appConstants.dreamFactoryApiKeySet;
      return $http.get(url, { cache: false })
    } else {
      var deferred = $q.defer();
      var query = "SELECT * FROM VehicleSubCompartments WHERE VehicleID=" + vehicleID + " AND CompartmentID=" + compartmentID + " AND CustomerID=" + customerId;
      var vehicleSupComArr = [];
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            data['SubCompartmentID'] = result.SubCompartmentID;
            data['ReadingSide'] = result.ReadingSide;
            data['TankChartID'] = result.TankChartID;
            data['Denominator'] = result.Denominator;
            data['DepthFeet'] = result.DepthFeet;
            data['Depth'] = result.Depth;
            data['DepthFraction'] = result.DepthFraction;
            data['MaxInch'] = result.MaxInch;
            data['MaxDenominator'] = result.MaxDenominator;
            data['CustomerID'] = result.CustomerID;
            data['VehicleID'] = result.VehicleID;
            data['compartmentID'] = result.CompartmentID;
            data['VolumeUOM'] = result.VolumeUOM;
            data['Code'] = result.Code;
            vehicleSupComArr.push(data);
          }
        }
        var vsupComArr = {};
        vsupComArr.data = vehicleSupComArr;
        deferred.resolve(vsupComArr);
      }, function(err) {
        console.log(err);
      });
      return deferred.promise;
    }
  };

  this.calcShipReading = function(reqData, callback) {
    if ($rootScope.isInternet && $rootScope.online) {
      var parameter = {
        "params": [{
          "name": "JsonValue",
          "param_type": "IN",
          "value": JSON.stringify(reqData)
        }]
      };
      $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.calcShipReading + "?" + appConstants.dreamFactoryApiKeySet, parameter, { timeout: 4000 })
        .success(function(data) {
          callback(data)
        }).error(function(err) {
          // return err;
          readingService.calculateReading(reqData, 0, function(res) {
            callback(res)
          });

        });
    } else {
      readingService.calculateReading(reqData, 0, function(res) {
        callback(res)
      });
      delete reqData['vehicleCompartments'];
      var parameter = {
        "params": [{
          "name": "JsonValue",
          "param_type": "IN",
          "value": JSON.stringify(reqData)
        }]
      };
      $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.calcShipReading + "?" + appConstants.dreamFactoryApiKeySet, parameter);
    }
  }
  this.calcTankReading = function(reqData, callback) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(reqData)
      }]
    };
    if ($rootScope.isInternet && $rootScope.online) {
      $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.updateTankVolume + "?" + appConstants.dreamFactoryApiKeySet, parameter, { timeout: 4000 })
        .success(function(data) {
          callback(data)
        }).error(function(err) {
          // return err;
          readingService.calculateReading(reqData, 1, function(res) {
            callback(res)
          });
        });
    } else {
      $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.updateTankVolume + "?" + appConstants.dreamFactoryApiKeySet, parameter);
      readingService.calculateReading(reqData, 1, function(res) {
        callback(res)
      });
    }
  };

  this.getAllDoiQus = function(doicCode) {
    var doiTypeString = 'S';
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getAllDoiQus + "(" + customerId + "," + doiTypeString + ")?" + appConstants.dreamFactoryApiKeySet;
    return $http.get(url, { cache: true })
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };

  this.postDoi = function(reqData) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(reqData)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postDOI + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };
  this.postDeliveryTicket = function(reqData) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(reqData)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postDeliveryTicket + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };
  this.uploadDeliveryTicket = function(reqData) {
    var parameter = {
      "resource": [{
        "name": "test5.jpg",
        "type": "file",
        "is_base64": true,
        "content": reqData.DeliveryTicketData[0].DeliveryImage
      }]
    };
    return $http.post(appConstants.filepath + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };

  this.postShipment = function(reqData, orderNo) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(reqData),
        "orderNo": orderNo
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postShipment + "?" + appConstants.dreamFactoryApiKeySet, parameter, { timeout: 10000 })
      .success(function(data) {
        return data;
      }).error(function(err) {
        console.log(err);
        return err;
      });
  };
  this.postDelivery = function(reqData, orderNo) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(reqData),
        "orderNo": orderNo
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postDelivery + "?" + appConstants.dreamFactoryApiKeySet, parameter, { timeout: 10000 })
      .success(function(data) {

        if (!(data[0] && data[0].StatusNew == 'Success')) {

          $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postDelivery + "?" + appConstants.dreamFactoryApiKeySet, parameter, { timeout: 10000 })
        }
        return data;
      }).error(function(err) {
        return err;
      });
  };
  this.postMeterTicket = function(reqData) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(reqData)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postMeterTicket + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  };
  this.getShortcuts = function(callback) {
    if ($rootScope.isInternet && $rootScope.online && !loadingOffline) {
      var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getShortcuts + "(" + $rootScope.CompanyID + "," + customerId + "," + $rootScope.MasterSiteID + ")?" + appConstants.dreamFactoryApiKeySet;
      $http.get(url, { cache: true })
        .success(function(data) {
          callback(data);
        }).error(function(err) {
          callback(err);
        });
    } else {
      var query = "SELECT * FROM SalesPLUButtons WHERE SiteID='" + $rootScope.MasterSiteID + "' AND CompanyID='" + $rootScope.CompanyID + "' AND CustomerID='" + customerId + "' ORDER BY Position";
      var proSalesData = [];
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            data['MasterProdID'] = result.MasterProdID;
            data['Code'] = result.Code;
            data['SiteID'] = result.SiteID;
            data['Descr'] = result.Descr;
            data['IsPackaged'] = result.IsPackaged;
            data['IsBillable'] = result.IsBillable;
            data['UnitPrice'] = (result.UnitPrice == "NULL" && result.UnitPrice == "undefined") ? 0 : result.UnitPrice;
            data['AvailableQty'] = (result.AvailableQty == "NULL" && result.AvailableQty == "undefined") ? 0 : result.AvailableQty;
            data['MasterProdType'] = result.MasterProdType;
            data['BIUOMID'] = (result.BIUOMID == "NULL") ? null : result.BIUOMID;
            data['BIUOM'] = (result.BIUOM == "NULL") ? null : result.BIUOM;
            data['BIEnableTankReadings'] = (result.BIEnableTankReadings == "NULL") ? null : result.BIEnableTankReadings;
            data['AllowNegative'] = result.AllowNegative;
            data['ProdContID'] = (result.ProdContID == "NULL") ? null : result.ProdContID;
            data['ConversionFactor'] = (result.ConversionFactor == "NULL") ? null : result.ConversionFactor;
            data['CriticalDescription'] = (result.CriticalDescription == "NULL") ? null : result.CriticalDescription;
            data['DefConversionUOMID'] = (result.DefConversionUOMID == "NULL") ? null : result.DefConversionUOMID;
            data['DefOnHandUOMID'] = (result.DefOnHandUOMID == "NULL") ? null : result.DefOnHandUOMID;
            data['HazmatDesc'] = (result.HazmatDesc == "Null") ? null : result.HazmatDesc;
            data['OnConversionUOM'] = (result.OnConversionUOM == "NULL") ? null : result.OnConversionUOM;
            data['OnCountUOM'] = (result.OnCountUOM == "NULL") ? null : result.OnCountUOM;
            data['OnCountUOMID'] = (result.OnCountUOMID == "NULL") ? null : result.OnCountUOMID;
            data['OnHandUOM'] = (result.OnHandUOM == "NULL") ? null : result.OnHandUOM;
            data['SellByUOM'] = (result.SellByUOM == "NULL") ? null : result.SellByUOM;
            data['SellByUOMID'] = (result.SellByUOMID == "NULL") ? null : result.SellByUOMID;
            proSalesData.push(data);
          }
          callback(proSalesData);
        } else {
          callback(proSalesData);
          console.log("No results found");
        }
      }, function(err) {
        callback(err);
      });

    }
  };
  this.getOrderNo = function() {
    var url = (appConstants.wcfBaseUrl + appConstants.wcfServices.getOrderNo, { params: { CompanyID: companyId, CustomerID: customerId } });
    return $http.get(url, { cache: true })
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };
  this.getDocMessages = function(callback) {
    var parameter = parameterize([$rootScope.CompanyID]);
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getDocMessages + parameter + appConstants.dreamFactoryApiKeySet;
    $http.get(url, { cache: true })
      .success(function(data) {
        callback(data);
      }).error(function(err) {
        return err;
      });
  };
  this.getAttachments = function(customerId, orderNo) {
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getAttachments + '(' + customerId + ',' + orderNo + ')' + "?" + appConstants.dreamFactoryApiKeySet;
    return $http.get(url, { cache: true })
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  };
  this.deleteAttachment = function(attachmentId, orderNo) {
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.deleteAttachment + '(' + attachmentId + ',' + orderNo + ')' + "?" + appConstants.dreamFactoryApiKeySet;
    return $http.get(url, { cache: true })
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  };
  this.postAttachment = function(reqData) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(reqData)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postAttachment + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  };
  this.getActivityLog = function(customerId, orderNo) {
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getActivityLog + '(' + $rootScope.CompanyID + "," + customerId + ',' + orderNo + ')' + "?" + appConstants.dreamFactoryApiKeySet;
    return $http.get(url, { cache: false })
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  }

  this.updateOrderStatus = function(reqData, orderNo) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(reqData)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.updateOrderStatus + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  }

  /*this.calcWeightVolumeQty = function(reqData, callback) {
    var parameterString = parameterizeWithCompCalciWeight([reqData.INSiteTankID, reqData.ProdContID, reqData.Dttm, reqData.FromUOMID, reqData.ToUOMID, reqData.QtyToCalc]);
    $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.calcWeightVolumeQty + parameterString + appConstants.dreamFactoryApiKeySet)
      .success(function(data) {
        callback(data)
      }).error(function(err) {
        return err;
      });
  }*/ 
  
  /* Handling on weight volume quantity both online, offline */
  this.calcWeightVolumeQty = function(reqData, callback) {
    reqData.CompanyID = $rootScope.CompanyID;
    reqData.QtyToCalc = reqData.QtyToCalc || 0;
    var WeightVolume = {
      WeightVolume : reqData
    }; 
    console.log("WeightVolume", WeightVolume);
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(WeightVolume)
      }]
    };
    console.log(reqData, parameter);
    if ($rootScope.isInternet && $rootScope.online) {
      $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.calcWeightVolumeQty + "?" + appConstants.dreamFactoryApiKeySet, parameter, { timeout: 4000 })
        .success(function(data) {
          callback(data);
        }).error(function(err) {
          return err;
        });

    } else {
      $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.calcWeightVolumeQty + "?" + appConstants.dreamFactoryApiKeySet, parameter);
      weightVolumeService.weightVolumeReading(reqData, function(res) {
        callback(res);
      });
    }
  }

  this.deleteOrder = function(orderNo, callback) {
    var parameterString = parameterizeWithComp([orderNo]);
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.deleteOrder + parameterString + appConstants.dreamFactoryApiKeySet;
    return $http.get(url, { cache: true })
  };

  this.postAdHocVessel = function(vesselCode, grossTonnage, imo, additionalNotes) {
    var param = {
      "Vessel": {
        "VesselList": [{
          "VesselCode": vesselCode,
          "GrossTonnage": grossTonnage,
          "ActualCapacity": 0,
          "IMONo": imo,
          "AdditionalNoes": additionalNotes,
          "CompanyID": $rootScope.CompanyID,
          "CustomerId": parseInt(customerId)
        }]
      }
    };
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(param)
      }]
    };

    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postAdHocVessel + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });

  };
  this.logoutUser = function() {
    var param = { "LogOutDetails": { "CompanyID": $rootScope.CompanyID, "CustomerID": $rootScope.accSettings.customerId, "UserName": $rootScope.loginData.uname, "LogOffTime": $rootScope.getCurrentDateTime(), "SessionID": $rootScope.SessionID, "INSiteID": $rootScope.selectedSite.SiteID } }
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(param)
      }]
    };
    if ($rootScope.isInternet && $rootScope.online) {
      return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.logout + "?" + appConstants.dreamFactoryApiKeySet, parameter)
        .success(function(data) {
          return data;
        }).error(function(err) {
          return err;
        });
    }
  };

  /*Logoff another user*/
  this.ClearUserSession = function() {
    var param = { "ClearUserSession": { "CompanyID": $rootScope.CompanyID, "UserName": $rootScope.loginData.uname, "LogOffTime": $rootScope.getCurrentDateTime() } }
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(param)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.ClearUserSession + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  };

  /*Update cancel order*/
  this.CancellOrder = function(SysTrxNo, OrderStatus, UserID) {
    var param = { "CancelOrder": { "SysTrxNo": SysTrxNo, "OrderStatus": OrderStatus, "UserID": UserID } }
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(param)
      }]
    };
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.updateCancelOrders + "?" + appConstants.dreamFactoryApiKeySet, parameter)
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  };

  /* Company Logo and informations are getting */
  this.getDocLogo = function() {
    var url = appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getDocLogo + "?" + appConstants.dreamFactoryApiKeySet;
    return $http.get(url);
  };

  /*Google api hits on MDA*/
  this.updateGoogleApi = function() {
    var cmpName = ($rootScope.CompanyID == '01') ? appConstants.CompanyName[0].name : appConstants.CompanyName[1].name;
    var queryString = '?' + 'o=' + 4 + '&t=' + 5 + '&cid=' + appConstants.customerId + '&cna=' + cmpName;
    var url = "http://demandstream.firestreamonline.com/services/googleApi" + queryString;
    return $http.get(url);
  };

  /* Get Each Order Status */
  this.getOrderStatus = function(param) {
    return $http.post(appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.getOrderStatus + "?" + appConstants.dreamFactoryApiKeySet, param)
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  }

});
