app.service('readingService', function($q, $rootScope, $http, appConstants, getAllSiteService, $cordovaSQLite) {

  this.calculateReading = function(reqData, flag, callback) {
    console.log('coming', reqData, flag);
    var readingData, vehicleCompartments, comData, containerType = '';
    if (flag == 0) {
      readingData = reqData.CalcShipReading;
      vehicleCompartments = reqData.vehicleCompartments;
      comData = readingData.Compartments[0];
      containerType = comData.containerType;
    } else {
      readingData = reqData.INSiteTankVolumeList.INSiteTankVolume;
      comData = readingData.Compartments[0];
      containerType = comData.containerType;
      // vehicleCompartments = reqData.vehicleCompartments;
    }
    console.log("readingData,comData,containerType,vehicleCompartments", readingData, comData, containerType);
    var self = this;
    switch (containerType) {
      case "insiteTank":
        if (readingData.Compartments.length == 1 && readingData.Compartments[0].subCompartments.length == 0) {
          self.prepareCompartmentVolume(readingData.Compartments[0], readingData).then(function(volume) {
            console.log("volume", volume);
            var totalQty = [];
            var valueArr = {};
            valueArr['CalcQty'] = volume;
            if (readingData.Type == 'Before') {
              valueArr['QtyBefore'] = volume;
            } else if (readingData.Type == 'After') {
              valueArr['QtyAfter'] = volume;
            } else {
              valueArr['Quantity'] = volume;
            }
            totalQty.push(valueArr);
            callback(totalQty);
          });
        } else {
          this.prepareCompartmentType(readingData.Compartments, readingData, callback);
          console.log("Tank with subCompartments");
        }
        break;
      case "vehicle":
        this.prepareCompartmentType(vehicleCompartments, readingData, callback);
        console.log("vehicle");
        break;
      default:
        console.log('Default case');
    }
  }

  this.prepareCompartmentType = function(data, readingData, callback) {
    var compartmentPromises = [];
    for (var i = 0; i < data.length; i++) {
      console.log("data[i]", data[i]);
      compartmentPromises.push(this.prepareCompartmentVolume(data[i], readingData));
    }
    $q.all(compartmentPromises).then(function(data) {
      console.log(data);
      var totalVolume = 0;
      data.forEach(function(subData, idx) {
        console.log(subData);
        subData.forEach(function(subVolume) {
          console.log(subVolume);
          totalVolume = totalVolume + subVolume;
        });
      });
      var totalQty = [];
      var valueArr = {};
      if (readingData.Temp || readingData.ATemp) {
        applyTemp(readingData, totalVolume, $cordovaSQLite, function(tmp) {
          valueArr['CalcQty'] = tmp;
          if (readingData.Type == 'Before') {
            valueArr['QtyBefore'] = tmp;
          } else if (readingData.Type == 'After') {
            valueArr['QtyAfter'] = tmp;
          } else {
            valueArr['Quantity'] = tmp;
          }
          totalQty.push(valueArr);
          console.log("compartmentPromises", valueArr);
          callback(totalQty);
        });
      } else {
        valueArr['CalcQty'] = totalVolume;
        if (readingData.Type == 'Before') {
          valueArr['QtyBefore'] = totalVolume;
        } else if (readingData.Type == 'After') {
          valueArr['QtyAfter'] = totalVolume;
        } else {
          valueArr['Quantity'] = totalVolume;
        }
        totalQty.push(valueArr);
        console.log("valueArr", totalQty);
        callback(totalQty);
      }
    });
  }

  this.prepareCompartmentVolume = function(comData, readingData) {
    var deferred = $q.defer();
    //Draft B & S
    var dratParams = {};
    dratParams['BF'] = parseInt(readingData.BF);
    dratParams['BI'] = parseInt(readingData.BI);
    dratParams['SF'] = parseInt(readingData.SF);
    dratParams['SI'] = parseInt(readingData.SI);
    var type = readingData.Type
    if (comData.subCompartments.length > 0) {
      var subCompartmentPromises = [];
      for (var i = 0; i < comData.subCompartments.length; i++) {
        subCompartmentPromises.push(this.prepareSubCompartmentVolume(comData.subCompartments[i], readingData, dratParams));
      }
      $q.all(subCompartmentPromises).then(function(data) {
        console.log(data);
        deferred.resolve(data);
      });
    } else {
      var inDepth = (parseInt(comData.MF) * 12) + parseInt(comData.MI);
      var tankChartID = readingData.TankChartID;
      var inDepthFraction = parseInt(comData.MR);
      var inDenominator = parseInt(readingData.Denominator) || 4;
      var DepthExtFraction = inDepth + parseFloat(inDepthFraction / inDenominator);
      insitetankCalc(type, tankChartID, DepthExtFraction, function(data) {
        var fromUomID = comData.ToUOMID;
        var VolumeUOM = comData.VolumeUOM;
        console.log("fromUomID,VolumeUOM,data", fromUomID, VolumeUOM, data);
        var convertData = typeConversion(fromUomID, VolumeUOM, data);
        if (readingData.Temp || readingData.ATemp) {
          applyTemp(readingData, convertData, $cordovaSQLite, function(tmp) {
            var tempApply = tmp;
            console.log("prepareCompartmentVolumeTempApply", tempApply);
            deferred.resolve(tempApply);
          });
        } else {
          deferred.resolve(convertData);
        }

      });
    }
    return deferred.promise;
  }

  this.prepareSubCompartmentVolume = function(subData, readingData, dratParams, callback) {
    var deferred = $q.defer();
    var type = readingData.Type
    if (subData.ReadingSide == 'P') {
      inDepth = (parseInt(subData.PF) * 12) + parseInt(subData.PI);
      tankChartID = subData.TankChartID;
      inDepthFraction = parseInt(subData.PR);
    } else if (subData.ReadingSide == 'M' || subData.ReadingSide == 'E') {
      inDepth = (parseInt(subData.MF) * 12) + parseInt(subData.MI);
      tankChartID = subData.TankChartID;
      inDepthFraction = parseInt(subData.MR);
    } else {
      inDepth = (parseInt(subData.SF) * 12) + parseInt(subData.SI);
      tankChartID = subData.TankChartID;
      inDepthFraction = parseInt(subData.SR);
    }


    var inDenominator = parseInt(readingData.Denominator) || 4;
    var DepthExtFraction = inDepth + parseFloat(inDepthFraction / inDenominator);
    console.log("inDepth,tankChartID,inDepthFraction", inDepth, tankChartID, inDepthFraction, inDenominator, DepthExtFraction, dratParams);
    insitetankCalcWithTrim(type, tankChartID, inDepth, DepthExtFraction, inDepthFraction, inDenominator, dratParams, function(data) {
      console.log("insitetankCalcWithTrim", data);
      var fromUomID = subData.ToUOMID;
      var VolumeUOM = subData.VolumeUOM;
      var convertData = typeConversion(fromUomID, VolumeUOM, data);
      deferred.resolve(convertData);
    });
    return deferred.promise;
  }


  var insitetankCalc = function(type, tankChartID, DepthExtFraction, callback) {
    console.log("insitetankCalc", type, tankChartID, DepthExtFraction);
    var query = 'SELECT * FROM TankChartDetail WHERE TankChartID=? AND DepthExtFraction=?';
    $cordovaSQLite.execute(productDB, query, [tankChartID, DepthExtFraction]).then(function(res) {
      console.log("offlineDb", res);
      var len = res.rows.length;
      var dataArr = [];
      var volume = 0;
      if (len > 0) {
        for (var i = 0; i < len; i++) {
          var result = res.rows.item(i);
          volume = volume + result.Volume;
        }

        console.log("volume", tankChartID, volume);
        callback(volume);
      } else {

        var queryTankMax = "SELECT Depth,Volume,DepthExtFraction FROM TankChartDetail  WHERE TankChartID=? AND DepthExtFraction>? ORDER BY DepthExtFraction ASC LIMIT 1";
        console.log("queryTankMax", queryTankMax, tankChartID, DepthExtFraction);
        $cordovaSQLite.execute(productDB, queryTankMax, [tankChartID, DepthExtFraction]).then(function(res) {
          var len = res.rows.length;
          if (len > 0) {
            var MaxDepth = res.rows.item(0).Depth;
            var MaxVol = res.rows.item(0).Volume;
            var DepthMaxFraction = res.rows.item(0).DepthExtFraction;
            var queryTankMin = "SELECT Depth,Volume,DepthExtFraction FROM TankChartDetail  WHERE TankChartID=? AND DepthExtFraction<? ORDER BY DepthExtFraction DESC LIMIT 1";
            console.log("queryTankMin", queryTankMin);
            $cordovaSQLite.execute(productDB, queryTankMin, [tankChartID, DepthExtFraction]).then(function(res) {
              var len = res.rows.length, MinDepth=0, MinVol=0, DepthMinFraction=0, countVolume=0;
              if (len > 0) {
                MinDepth = res.rows.item(0).Depth;
                MinVol = res.rows.item(0).Volume;
                DepthMinFraction = res.rows.item(0).DepthExtFraction;
                countVolume = (((DepthExtFraction - DepthMinFraction) / (DepthMaxFraction - DepthMinFraction)) * (MaxVol - MinVol)) + MinVol;
              }
              volume = volume + countVolume;
              console.log("AnotherVolume", volume);
              callback(volume);
            });
          }else{
            callback(0);
          }
        });
      }
    }, function(err) {
      console.log(err);
    });
  }

  var insitetankCalcWithTrim = function(type, tankChartID, inDepth, DepthExtFraction, inDepthFraction, inDenominator, dratParams, callback) {
    var dParamsBF = (dratParams.BF && dratParams.BF != '' && dratParams.BF != null && dratParams.BF != undefined) ? dratParams.BF : 0;
    var dParamsSF = (dratParams.SF && dratParams.SF != '' && dratParams.SF != null && dratParams.SF != undefined) ? dratParams.SF : 0;

    var dParamsBI = (dratParams.BI && dratParams.BI != '' && dratParams.BI != null && dratParams.BI != undefined) ? dratParams.BI : 0;
    var dParamsSI = (dratParams.SI && dratParams.SI != '' && dratParams.SI != null && dratParams.SI != undefined) ? dratParams.SI : 0;

    var Trim = (((dParamsBF * 12) + (dParamsBI)) - ((dParamsSF * 12) + (dParamsSI)));
    console.log("Trim", Trim);
    query = 'SELECT TankChartKeelID FROM TankChartKeel WHERE TankChartID=? AND KeelTo = "E" AND KeelDegree = 0.00';
    console.log("insitetankCalcWithTrim", query, tankChartID);
    $cordovaSQLite.execute(productDB, query, [tankChartID]).then(function(res) {
      var keelLength = res.rows.length;
      if (keelLength > 0) {
        var keelID = res.rows.item(0).TankChartKeelID;
        console.log("keelID", keelID);
        var trimQuery = 'SELECT CorrInch,CorrFraction,CorrFeet FROM TankChartTrim WHERE TankChartKeelID =? AND TankChartID =? AND TrimExtFraction =?';
        console.log("trimQuery", trimQuery, keelID, tankChartID, Trim);
        $cordovaSQLite.execute(productDB, trimQuery, [keelID, tankChartID, Trim]).then(function(res) {
          console.log("TankChartTrim", res.rows);
          var len = res.rows.length;
          if (len > 0) {
            var CorrInch = res.rows.item(0).CorrInch;
            var CorrFraction = res.rows.item(0).CorrFraction;
            var CorrFeet = res.rows.item(0).CorrFeet;
            inDepth = inDepth + (CorrInch + ((CorrFeet) * 12));
            var NumeratorTemp = parseInt(((inDepthFraction) + (CorrFraction)) / (inDenominator));
            var DepthNumeratorTemp = parseInt(((inDepthFraction) + (CorrFraction)) % (inDenominator));
            inDepth = inDepth + roundNumber(NumeratorTemp, 2);
            inDepthFraction = roundNumber(DepthNumeratorTemp, 2);
            DepthExtFraction = inDepth + parseFloat(inDepthFraction / inDenominator);
            console.log("With Trim", inDepth, inDepthFraction, DepthExtFraction);
            insitetankCalc(type, tankChartID, DepthExtFraction, callback);
          } else {
            if (Trim == 0) {
              DepthExtFraction = inDepth + parseFloat(inDepthFraction / inDenominator);
              console.log("inDepth,DepthExtFraction", inDepth, DepthExtFraction);
              query = "SELECT * FROM TankChartDetail WHERE TankChartID = ? AND DepthExtFraction =? LIMIT 1"
              console.log("queryWith Trim==0", query);
              $cordovaSQLite.execute(productDB, query, [tankChartID, DepthExtFraction]).then(function(res) {
                var len = res.rows.length;
                if (len) {
                  insitetankCalc(type, tankChartID, DepthExtFraction, callback);
                }
              });
            } else {
              //missing readings Start
              calcExactTrimCorrection(keelID, tankChartID, Trim, inDepth, inDepthFraction, inDenominator, $cordovaSQLite, function(DepthExtFraction) {
                insitetankCalc(type, tankChartID, DepthExtFraction, callback);
              })
            }
          }
        }, function(err) {
          console.log(err);
        });
      } else {

        insitetankCalc(type, tankChartID, DepthExtFraction, callback);
      }
    }, function(err) {
      console.log(err);
    });

  }
});
/* UOM Conversion Gallons to Barrels */
var typeConversion = function(fromUomID, VolumeUOM, data) {
  console.log("fromUomID,VolumeUOM,data", fromUomID, VolumeUOM, data);
  var cntVolume = '';
  if (fromUomID == 1 && VolumeUOM == "1002") {

    cntVolume = data * 42;
  } else if (fromUomID == "1002" && VolumeUOM == 1) {

    cntVolume = data / 42;
  } else {
    cntVolume = data;
  }
  console.log("afterConvertVolume", cntVolume);
  return cntVolume;
}
//missing readings Start
function calcExactTrimCorrection(TankChartKeelID, tankChartID, Trim, inDepth, inDepthFraction, inDenominator, $cordovaSQLite, callback) {

  console.log("params", TankChartKeelID, tankChartID, Trim, inDepth, inDepthFraction, inDenominator);
  var queryMax = "SELECT  CorrInch, CorrFraction, CorrFeet, CorrExtFraction, TrimExtFraction, DenominatorTemp FROM TankChartTrim WHERE TankChartKeelID=? AND TankChartID=? AND TrimExtFraction > " + Trim + " ORDER BY TrimExtFraction ASC LIMIT 1";
  console.log("queryMax", queryMax);
  $cordovaSQLite.execute(productDB, queryMax, [TankChartKeelID, tankChartID]).then(function(res) {
    var len = res.rows.length;
    console.log("QueryMax", res.rows.item(0));
    if (len > 0) {
      var MaxCorrInch = res.rows.item(0).CorrInch;
      var MaxCorrFraction = res.rows.item(0).CorrFraction;
      var MaxCorrFeet = res.rows.item(0).CorrFeet;
      var MaxCorrExt = res.rows.item(0).CorrExtFraction;
      var MaxTrimEXt = res.rows.item(0).TrimExtFraction;
      var CorrDenom = res.rows.item(0).DenominatorTemp;
    }
    var queryMin = "SELECT  CorrInch, CorrFraction, CorrFeet, CorrExtFraction, TrimExtFraction, DenominatorTemp FROM TankChartTrim WHERE TankChartKeelID=? AND TankChartID=? AND TrimExtFraction < " + Trim + " ORDER BY TrimExtFraction DESC LIMIT 1";
    console.log("queryMin", queryMin);
    $cordovaSQLite.execute(productDB, queryMin, [TankChartKeelID, tankChartID]).then(function(res) {
      var len = res.rows.length;

      console.log("QueryMin", res.rows.item(0));
      if (len > 0) {
        var MinCorrInch = res.rows.item(0).CorrInch;
        var MinCorrFraction = res.rows.item(0).CorrFraction;
        var MinCorrFeet = res.rows.item(0).CorrFeet;
        var MinCorrExt = res.rows.item(0).CorrExtFraction;
        var MinTrimEXt = res.rows.item(0).TrimExtFraction;
      }
      var CorrExt = (((Trim - MinTrimEXt) / (MaxTrimEXt - MinTrimEXt)) * (MaxCorrExt - MinCorrExt)) + MinCorrExt;
      console.log("CorrExt", CorrExt);
      if (CorrExt) {
        var DepthExact = (inDepth + ((inDepthFraction) / (inDenominator) + CorrExt));
      } else {
        var DepthExact = (inDepth + ((inDepthFraction) / (inDenominator)));
      }
      console.log("DepthExact", DepthExact);
      callback(DepthExact);
    }, function(err) {
      console.log(err);
    });
  }, function(err) {
    console.log(err);
  });

}

function roundNumber(num, scale) {
  if (!("" + num).includes("e")) {
    return +(Math.round(num + "e+" + scale) + "e-" + scale);
  } else {
    var arr = ("" + num).split("e");
    var sig = ""
    if (+arr[1] + scale > 0) {
      sig = "+";
    }
    return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
  }
}

/* Liquid temp && ampient temp  logic for offline*/

function applyTemp(data, totalVolume, $cordovaSQLite, callback) {
  console.log("data", data);
  var LTemp = parseFloat(data.Temp);
  var ATemp = parseFloat(data.ATemp);
  if (data.INSiteTankID != null) {
    if (data.Insulated == 'Y') {

      TempDiffBefore = LTemp - data.TankOperatingTemp;
      correctionFactorBefore = roundNumber(1 + ((data.LinearExpansionCoeff * 2) * TempDiffBefore) + (data.LinearExpansionCoeff * data.LinearExpansionCoeff * TempDiffBefore * TempDiffBefore), 5);
      if (correctionFactorBefore != 0) {
        BeforeQty = totalVolume * correctionFactorBefore;
      } else {
        BeforeQty = totalVolume * 1;
      }

    } else {
      if (data.ProdContID != 0 && data.Compartments[0].subCompartments.length >= 0) {

        if (LTemp != 0 && ATemp != 0) {
          TankShellTempBefore = roundNumber((((7 * LTemp) + ATemp) / 8), 0);
          TempDiffBefore = TankShellTempBefore - data.TankOperatingTemp;
          correctionFactorBefore = roundNumber(1 + ((data.LinearExpansionCoeff * 2) * TempDiffBefore) + (data.LinearExpansionCoeff * data.LinearExpansionCoeff * TempDiffBefore * TempDiffBefore), 5);
        } else {
          TankShellTempBefore = 0;
          TempDiffBefore = 0;
          correctionFactorBefore = 0;
        }

        if (correctionFactorBefore != 0) {
          BeforeQty = totalVolume * correctionFactorBefore;
        } else {
          BeforeQty = totalVolume * 1;
        }
      } else {
        BeforeQty = totalVolume;
      }
    }
    BeforeQty = (BeforeQty && BeforeQty != null && BeforeQty != undefined) ? BeforeQty : totalVolume;

    // BeforeDate = moment.utc().format("M/DD/YYYY HH:mm:ss A"); // Current Date & time
    BeforeDate = moment.utc().valueOf(); // Current Date & time
    console.log("data.Compartments.subCompartments", data.Compartments[0].subCompartments.length);
    if (data.Compartments[0].subCompartments.length == 0 && data.ProdContID == 0) {
      // StandAlone with Product
      getStandAloneVolume(data, BeforeDate, BeforeQty, $cordovaSQLite, function(stdVolume) {
        console.log("stdVolume", stdVolume);
        callback(stdVolume);
      });
    } else {
      if (data.ProdContID == 0) {
        // StandAlone with Product
        getStandAloneVolume(data, BeforeDate, BeforeQty, $cordovaSQLite, function(stdVolume) {
          console.log("stdVolume", stdVolume);
          callback(stdVolume);
        });
      } else {
        // Order with product 
        GetAPIRating(data.INSiteTankID, data.ProdContID, BeforeDate, data.CustomerID, $cordovaSQLite, function(BeforeAPIRating) {
          console.log("BeforeAPIRating", BeforeAPIRating);
          //Get vcf
          FSGetTempVCF(BeforeAPIRating, LTemp, 0, data.ProdID, data.CustomerID, $cordovaSQLite, function(BeforeVCF) {
            console.log('BeforeVCF', BeforeVCF);
            if (BeforeVCF != 0) {
              BeforeNetQty = (BeforeQty * BeforeVCF);
            } else {
              BeforeNetQty = BeforeQty;
            }
            console.log("BeforeNetQty", BeforeNetQty);
            callback(BeforeNetQty);
            // Standalone with ambient
            /*if (data.ATemp) {
            GetShellTemperatureCorrection(data.INSiteTankID, LTemp, ATemp, BeforeNetQty, data.CompanyID, data.ProdContID, $cordovaSQLite, function(stdQty) {
            console.log("stdQty", stdQty);
            callback(stdQty);
            });
            } else {
            callback(BeforeNetQty);
            }*/
          });
        });

      }
    }

  }
}

/* StandAlone */
function getStandAloneVolume(data, BeforeDate, BeforeQty, $cordovaSQLite, callback) {
  var LTemp = parseFloat(data.Temp);
  var ATemp = parseFloat(data.ATemp);
  getStdProdId(data.INSiteTankID, BeforeDate, $cordovaSQLite, function(newProContID) {
    console.log("newProContID", newProContID);
    GetAPIRating(data.INSiteTankID, newProContID, BeforeDate, data.CustomerID, $cordovaSQLite, function(BeforeAPIRating) {
      console.log("BeforeAPIRating", BeforeAPIRating);
      //Get vcf
      FSGetTempVCF(BeforeAPIRating, LTemp, 0, data.ProdID, data.CustomerID, $cordovaSQLite, function(BeforeVCF) {
        console.log('BeforeVCF', BeforeVCF);
        if (BeforeVCF != 0) {
          BeforeNetQty = (BeforeQty * BeforeVCF);
        } else {
          BeforeNetQty = BeforeQty;
        }
        console.log("BeforeNetQty", BeforeNetQty);
        // Standalone with ambient
        if (data.ATemp) {
          GetShellTemperatureCorrection(data.INSiteTankID, LTemp, ATemp, BeforeNetQty, data.CompanyID, newProContID, $cordovaSQLite, function(stdQty) {
            console.log("stdQty", stdQty);
            callback(stdQty);
          });
        } else {
          callback(BeforeNetQty);
        }
      });
    });
  });
}

function GetAPIRating(pINSiteTankID, pProdContID, pDtTm, CustomerID, $cordovaSQLite, callback) {
  console.log("pINSiteTankID, pProdContID", pINSiteTankID, pProdContID);
  var API_Rating;
  API_Rating = null;

  var query1 = "SELECT API_Rating FROM InSiteTank_ProductAPI WHERE InSiteTank_ProductAPI.INSiteTankID = " + pINSiteTankID + " AND InSiteTank_ProductAPI.ProdContID = " + pProdContID + " AND InSiteTank_ProductAPI.EffDtTm <= '" + pDtTm + "' AND InSiteTank_ProductAPI.CustomerID=" + CustomerID + " ORDER BY EffDtTm DESC LIMIT 1";
  console.log("query1", query1);

  $cordovaSQLite.execute(productDB, query1, []).then(function(res) {
    var len = res.rows.length;
    if (len > 0) {
      API_Rating = res.rows.item(0).API_Rating;
    }
    if (API_Rating == null) {
      var query2 = "SELECT SpecificGravity FROM ProdCont JOIN Products ON ProdCont.ProdID = Products.ProdID WHERE ProdCont.ProdContID =" + pProdContID + " AND ProdCont.CustomerID=" + CustomerID + " AND Products.MasterProdType='P'";
      console.log("query2", query2);
      $cordovaSQLite.execute(productDB, query2, []).then(function(res) {
        console.log("res", res);
        var len = res.rows.length;
        console.log("len", res.rows.item(0));
        if (len > 0) {
          API_Rating = (res.rows.item(0).SpecificGravity ? (res.rows.item(0).SpecificGravity) : 0);
        } else {
          API_Rating = 0;
        }
        console.log("API_Rating1", API_Rating);
        callback(API_Rating);
      }, function(err) {
        console.log(err);
      });

    } else {
      console.log("API_Rating2", API_Rating);
      callback(API_Rating);
    }

  }, function(err) {
    console.log(err);
  });

}

function FSGetTempVCF(pGrav, pTemp, pTempGrpID, pMasterProdID, CustomerID, $cordovaSQLite, callback) {
  pGrav = parseFloat(pGrav);
  var Vcf = MAx_GRAVITy = MIN_GRAVITy = MIN_TEMP = TempGrpID = k0 = k1 = x = y = alpha = rho = char10 = rnd4 = rnd5 = delta_t = pErrCode = '';
  var MAx_GRAVITy = 84;
  var MIN_GRAVITy = 0;
  var MIN_TEMP = 0;
  var Vcf = 1.0;
  var pErrCode = 0;
  var holdVcf;

  if (pGrav == null || pGrav == 0 || pGrav < MIN_GRAVITy || pGrav > MAx_GRAVITy) {
    pErrCode = -1;
    callback(1)
  } else if (pTemp == null || pTemp <= MIN_TEMP) {
    pErrCode = -2;
    callback(1)
  } else if (pMasterProdID != 0 && pTempGrpID == 0) {
    var query = "SELECT TemperatureCorrectID FROM Products WHERE Products.MasterProdID = " + pMasterProdID + " AND Products.CustomerID='" + CustomerID + "'";
    $cordovaSQLite.execute(productDB, query, []).then(function(res) {
      console.log("res", res);

      var len = res.rows.length;
      console.log("len", res.rows.item(0));
      if (len > 0) {
        pTempGrpID = res.rows.item(0).TemperatureCorrectID;
      } else {
        pTempGrpID = 0;
      }
      var vcfData = vcfCalculating(pGrav, pTemp, TempGrpID, pTempGrpID, Vcf, k0, k1, x, y, alpha, rho, char10, rnd4, rnd5, delta_t, pErrCode);
      console.log("vcfData", vcfData);
      callback(vcfData);
    }, function(err) {
      console.log(err);
    });

  } else {
    var vcfData = vcfCalculating(pGrav, pTemp, TempGrpID, pTempGrpID, Vcf, k0, k1, x, y, alpha, rho, char10, rnd4, rnd5, delta_t, pErrCode);
    console.log("vcfData", vcfData);
    callback(vcfData);
  }

}

function vcfCalculating(pGrav, pTemp, TempGrpID, pTempGrpID, Vcf, k0, k1, x, y, alpha, rho, char10, rnd4, rnd5, delta_t, pErrCode) {
  var holdVcf;
  if (pGrav <= 40 && pTemp > 300) {
    pErrCode = -3;
    holdVcf = 1;
  } else if (pGrav > 40 && pGrav <= 50 && pTemp > 250) {
    pErrCode = -4;
    holdVcf = 1;
  } else if (pGrav > 50 && pTemp > 200) {
    pErrCode = -5;
    holdVcf = 1;
  }


  if (pGrav <= 37.0) {
    TempGrpID = 4; //Diesel
    if (pTempGrpID == 3) { //'LUBE'
      if (pGrav > 18.0 && pGrav < 32.0) {
        TempGrpID = pTempGrpID;
      } else if (pTempGrpID == 2) { //'CRUDE'
        if (pGrav > 11.0) {
          TempGrpID = TempGrpID;
        }
      }
    }
  } else if (pGrav < 48.0) {
    TempGrpID = 5; //Kerosene
  } else if (pGrav <= 52.0) {
    TempGrpID = 6; //Jet
  } else {
    TempGrpID = 7; //Gasoline
  }


  if (pTempGrpID != TempGrpID) {
    if (pTempGrpID == 5) {
      if (TempGrpID != 6) {
        pErrCode = -6;
        holdVcf = 1;
      }
    } else if (pTempGrpID == 7) {
      if (TempGrpID != 6) {
        pErrCode = -6;
        holdVcf = 1;
      }
    }
  }

  //Set the Coefficients according to the product group 
  if (TempGrpID == 2) { //'CRUDE'
    var k0 = 341.0957;
    var k1 = 0.0;
  } else if (TempGrpID == 3) { //'LUBE'
    var k0 = 0.0;
    var k1 = .3488;
  } else if (TempGrpID == 4) { //'DIESEL'
    var k0 = 103.872;
    var k1 = .2701;
  } else if (TempGrpID == 5) { //'KEROSENE'
    var k0 = 330.301;
    var k1 = 0.0;
  } else if (TempGrpID == 6) { //'JET'
    var k0 = 1489.067;
    var k1 = -.0018684;
  } else if (TempGrpID == 7) { //'GASOLINE'
    var k0 = 192.4571;
    var k1 = .2438;
  } else {
    pErrCode = -7;
    holdVcf = 1;
  }

  // Conversion to densit@y in Kg/m3 calculate @rho
  var rho = 141360.198 / (pGrav + 131.5);
  var x = ((k0 / rho) / rho);

  if (TempGrpID == 6) {
    alpha = k1 + x;
  } else {
    alpha = (k1 / rho) + x;
  }

  //Calculate delta-T
  var delta_t = pTemp - 60.0;
  var y = alpha * delta_t;
  //truncate
  var char10 = y;
  var y = char10;
  var x = (((y * y) * .8) + y) * -1.0;
  //truncate

  var char10 = x;
  var x = char10;
  //Solve volume correction factor e^@x (vcf)
  var y = Math.exp(x);
  if (y >= 1) {
    rnd4 = y;
    Vcf = roundNumber(rnd4, 4);
  } else {
    rnd5 = y;
    Vcf = roundNumber(rnd5, 5);
  }
  if (holdVcf == 1) {
    return holdVcf
  } else {
    Vcf = roundNumber(Vcf, 5);
    return Vcf;
  }

}

/* Standalone Reading */
function GetShellTemperatureCorrection(INSiteTankID, Temp, ATemp, inQty, CompanyID, prodConID, $cordovaSQLite, callback) {
  var CorrCoefficient = isInsulated = TankShellTemp = OpTemparature = TempDiff = correctionFactor = correctionFactorBefore = AfterTemp = BeforeTemp = AfterATemp = BeforeATemp = CorrectedQty = '';
  var query = "SELECT LinearExpansionCoeff, Insulated, TankOperatingTemp FROM INSiteTanks where TankID =" + INSiteTankID + " AND ProdContID = " + prodConID + " AND CompanyID='" + CompanyID + "'";
  console.log("query", query);
  $cordovaSQLite.execute(productDB, query, []).then(function(res) {
    console.log("res", res);
    var len = res.rows.length;
    console.log("API_Rating", res.rows.item(0));
    if (len > 0) {
      LinearExpansionCoeff = res.rows.item(0).LinearExpansionCoeff;
      Insulated = res.rows.item(0).Insulated;
      TankOperatingTemp = res.rows.item(0).TankOperatingTemp;
      if (Insulated == 'Y') {
        var TempDiff = null;
        var TempDiff = (Temp - TankOperatingTemp);
        var correctionFactor = roundNumber(1 + ((LinearExpansionCoeff * 2) * TempDiff) + (LinearExpansionCoeff * LinearExpansionCoeff * TankOperatingTemp * TankOperatingTemp), 5);
        CorrectedQty = (inQty * correctionFactor);

      } else {
        var TempDiff = null;
        var TankShellTemp = roundNumber(((7 * Temp) + ATemp) / 8, 0);
        var TempDiff = (TankShellTemp - TankOperatingTemp);
        var correctionFactor = roundNumber(1 + ((LinearExpansionCoeff * 2) * TempDiff) + (LinearExpansionCoeff * LinearExpansionCoeff * TankOperatingTemp * TankOperatingTemp), 5);
        CorrectedQty = (inQty * correctionFactor);
      }
    } else {
      CorrectedQty = inQty;
    }
    console.log("CorrectedQty", CorrectedQty);
    callback(CorrectedQty);
  }, function(err) {
    console.log(err);
  });
}

/* StandAlone ProdContent id */
function getStdProdId(tankId, currDtm, $cordovaSQLite, callback) {
  var ProdContID;
  var query = "SELECT MAX(EffectiveDate) AS EffectiveDate,ProdContID AS ProdContID FROM INSiteTank_Products WHERE InSiteTankID=" + tankId;
  console.log("getStdProdIdQuery", query);
  $cordovaSQLite.execute(productDB, query, []).then(function(res) {
    console.log("res", res);
    var len = res.rows.length;
    console.log("API_Rating", res.rows.item(0));
    if (len > 0) {
      ProdContID = res.rows.item(0).ProdContID;
    }
    callback(ProdContID);
  }, function(err) {
    console.log(err);
  });

}
