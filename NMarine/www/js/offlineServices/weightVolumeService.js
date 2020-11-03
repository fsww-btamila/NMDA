app.service('weightVolumeService', function($q, $rootScope, $http, appConstants, getAllSiteService, $cordovaSQLite) {
  this.weightVolumeReading = function(reqData, callback) {
    console.log("reqData", reqData);
    var API_Rating;
    API_Rating = null;
    var Qty;
    var totalQty = [];
    var valueArr = {};
    var currentDT = moment.utc().valueOf(); // Current Date & time
    var query = 'SELECT API_Rating FROM InSiteTank_ProductAPI WHERE INSiteTankID=? AND ProdContID=? AND EffDtTm<="' + currentDT + '" ORDER BY EffDtTm DESC LIMIT 1';
    console.log("query", query);
    $cordovaSQLite.execute(productDB, query, [reqData.INSiteTankID, reqData.ProdContID]).then(function(res) {
        console.log('res', res);
        var len = res.rows.length;
        if (len > 0) {
          API_Rating = res.rows.item(0).API_Rating;
          CalcAPIQty(reqData.FromUOMID, reqData.ToUOMID, reqData.QtyToCalc, API_Rating, $cordovaSQLite, function(volume) {
              console.log("volume", volume);
              valueArr['Qty'] = volume;
              totalQty.push(valueArr);
              console.log("volume", volume, valueArr, totalQty);
              callback(totalQty);
            },
            function(err) {
              console.log(err);
            });
        }
        console.log('API_Rating', API_Rating);

        if (API_Rating == null) {
          var query2 = "SELECT Products.SpecificGravity FROM ProdCont JOIN Products ON ProdCont.ProdID = Products.ProdID WHERE ProdCont.ProdContID =" + reqData.ProdContID + " AND ProdCont.CompanyID='" + reqData.CompanyID + "' ORDER BY Products.SpecificGravity DESC LIMIT 1";
          console.log("query2", query2);
          $cordovaSQLite.execute(productDB, query2, []).then(function(res) {
            var len = res.rows.length;
            console.log('res', res);
            if (len > 0) {
              API_Rating = res.rows.item(0).SpecificGravity;
              CalcAPIQty(reqData.FromUOMID, reqData.ToUOMID, reqData.QtyToCalc, API_Rating, $cordovaSQLite, function(volume) {
                  console.log("volume", volume);
                  valueArr['Qty'] = volume;
                  totalQty.push(valueArr);
                  console.log("volume", volume, valueArr, totalQty);
                  callback(totalQty);
                },
                function(err) {
                  console.log(err);
                });
            }
            console.log('API_Rating', API_Rating);

          });
        }
      },
      function(err) {
        console.log(err);
      });
  }

  function CalcAPIQty(FromUOMID, ToUOMID, fQtyToCalc, API_Rating, $cordovaSQLite, callback) {
    var fFromConversionFactor, fToConversionFactor, fTempQty, NewQty, FromVolume, ToVolume, API, SG, wfrom, wto, vfrom, vto, fromqty, densityW, densityFA, densityFV, weight, volume;
    var self = this;
    NewQty = fQtyToCalc;

    if (API_Rating != 0) {
      if (FromUOMID != ToUOMID) {
        if (FromUOMID != 0) {
          var query3 = "SELECT Volume FROM UOM WHERE UOMID=?";
          console.log("query3", query3, FromUOMID);
          $cordovaSQLite.execute(productDB, query3, [FromUOMID]).then(function(res) {
            var len = res.rows.length;
            console.log("res", res, res.rows);
            if (len > 0) {
              FromVolume = res.rows.item(0).Volume;
            }
            if (ToUOMID != 0 && ToUOMID != null) {
              var query4 = "SELECT Volume FROM UOM WHERE UOMID=?";
              console.log("query4", query4, ToUOMID);
              $cordovaSQLite.execute(productDB, query4, [ToUOMID]).then(function(res) {
                var len = res.rows.length;
                console.log("res", res, res.rows);
                if (len > 0) {
                  ToVolume = res.rows.item(0).Volume;
                }
                if (FromVolume == 'W' && ToVolume == 'V' && API_Rating != 0) {
                  var query5 = "SELECT UOMID FROM UOM WHERE CODE LIKE 'Kilogram%'";
                  console.log("query5", query5);
                  $cordovaSQLite.execute(productDB, query5).then(function(res) {
                    var len = res.rows.length;
                    console.log("res", res);
                    if (len > 0) {
                      wto = res.rows.item(0).UOMID;
                    }
                    console.log("---", FromUOMID, wto, fQtyToCalc)
                    CalcQty(FromUOMID, wto, fQtyToCalc, function(res) {
                      if (res) {
                        console.log("res", res);
                        weight = res;

                        console.log("weight", weight);
                        var query6 = "SELECT UOMID FROM UOM WHERE CODE LIKE 'cubic meters%'";
                        console.log("query6", query6);
                        $cordovaSQLite.execute(productDB, query6).then(function(res) {
                          var len = res.rows.length;
                          console.log("res", res);

                          if (len > 0) {
                            vfrom = res.rows.item(0).UOMID;
                          }
                          console.log("vfrom", vfrom);
                          densityW = 999.016;
                          SG = ((141.5) / (parseFloat(API_Rating) + 131.5));
                          console.log("SG", SG);
                          densityFV = (SG * densityW);
                          densityFA = ((1.000149926 * densityFV) - 1.199407795);

                          let weightDensity = (weight / densityFA);
                          console.log(vfrom, ToUOMID, weightDensity);
                          CalcQty(vfrom, ToUOMID, weightDensity, function(res) {
                            if (res) {
                              console.log("res", res);
                              NewQty = res;
                              if ((FromVolume == 'W' && ToVolume == 'V') || (FromVolume == 'V' && ToVolume == 'W')) {
                                NewQty = roundNumber(roundNumber(NewQty, 4), 2);
                              } else {
                                console.log("---", FromUOMID, ToUOMID, fQtyToCalc)
                                CalcQty(FromUOMID, ToUOMID, fQtyToCalc, function(res) {
                                  if (res) {
                                    NewQty = res;
                                  }
                                })
                              }
                              callback(NewQty);
                            }
                          });
                        });
                      }
                    });
                  });

                } else if (FromVolume == 'V' && ToVolume == 'W' && API_Rating != 0) {
                  var query7 = "SELECT UOMID FROM UOM WHERE CODE LIKE 'Kilogram%'";
                  console.log("query7", query7);
                  $cordovaSQLite.execute(productDB, query7).then(function(res) {
                    var len = res.rows.length;
                    console.log("res", res);
                    if (len > 0) {
                      wfrom = res.rows.item(0).UOMID;
                    }
                    var query8 = "SELECT UOMID FROM UOM WHERE CODE LIKE 'cubic meters%'";
                    console.log("query8", query8);
                    $cordovaSQLite.execute(productDB, query8).then(function(res) {
                      var len = res.rows.length;
                      console.log("res", res);
                      if (len > 0) {
                        vto = res.rows.item(0).UOMID;
                          console.log('wfrom', wfrom);
                          CalcQty(FromUOMID, vto, fQtyToCalc, function(res) {
                            if (res) {
                              console.log("res", res);
                              volume = res;
                              var query8 = "SELECT UOMID FROM UOM WHERE CODE LIKE 'cubic meters%'";
                              console.log("query8", query8);
                              $cordovaSQLite.execute(productDB, query8).then(function(res) {
                                var len = res.rows.length;
                                console.log("res", res);
                                if (len > 0) {
                                  vto = res.rows.item(0).UOMID;
                                }
                                console.log('vto', vto);
                                densityW = 999.016;
                                SG = ((141.5) / (parseFloat(API_Rating) + 131.5));
                                console.log("SG", SG);
                                densityFV = (SG * densityW);
                                densityFA = ((1.000149926 * densityFV) - 1.199407795);
                                CalcQty(wfrom, ToUOMID, (volume * densityFA), function(res) {
                                  if (res) {
                                    console.log("res", res);
                                    NewQty = res;
                                    if (FromUOMID != 0) {
                                      if ((fFromConversionFactor == undefined || fFromConversionFactor == null || fFromConversionFactor == 0) && (!((FromVolume == 'V' && ToVolume == 'W') || (FromVolume == 'W' && ToVolume == 'V')))) {
                                        var query11 = "SELECT BaseUOMFactor FROM UOM WHERE UOMID=?";
                                        console.log("query11", query11, FromUOMID);
                                        $cordovaSQLite.execute(productDB, query11, [FromUOMID]).then(function(res) {
                                          var len = res.rows.length;
                                          console.log("res", res);
                                          if (len > 0) {
                                            fFromConversionFactor = res.rows.item(0).BaseUOMFactor;
                                            NewQty = (fQtyToCalc * fFromConversionFactor);
                                            NewQty = roundNumber(NewQty, 2);
                                            console.log('NewQty', fFromConversionFactor, NewQty);
                                            if ((FromVolume == 'W' && ToVolume == 'V') || (FromVolume == 'V' && ToVolume == 'W')) {
                                              NewQty = roundNumber(roundNumber(NewQty, 4), 2);
                                            } else {
                                              console.log("---", FromUOMID, ToUOMID, fQtyToCalc)
                                              CalcQty(FromUOMID, ToUOMID, fQtyToCalc, function(res) {
                                                if (res) {
                                                  NewQty = res;
                                                }
                                              })
                                            }
                                            callback(NewQty);
                                          }
                                        });
                                      }
                                    }

                                      if (ToUOMID != 0 && ToUOMID != null) {
                                        if ((fToConversionFactor == undefined || fToConversionFactor == null || fToConversionFactor == 0) && (!((FromVolume == 'V' && ToVolume == 'W') || (FromVolume == 'W' && ToVolume == 'V')))) {
                                          var query12 = "SELECT BaseUOMFactor FROM UOM WHERE UOMID=?";
                                          console.log("query12", query12, ToUOMID);
                                          $cordovaSQLite.execute(productDB, query12, [ToUOMID]).then(function(res) {
                                            var len = res.rows.length;
                                            console.log("res", res);
                                            if (len > 0) {
                                              fToConversionFactor = res.rows.item(0).BaseUOMFactor;
                                              NewQty = roundNumber(roundNumber(NewQty * fToConversionFactor), 7);
                                            }
                                            console.log('NewQty', fToConversionFactor, NewQty);
                                            if ((FromVolume == 'W' && ToVolume == 'V') || (FromVolume == 'V' && ToVolume == 'W')) {
                                              NewQty = roundNumber(roundNumber(NewQty, 4), 2);
                                            } else {
                                              console.log("---", FromUOMID, ToUOMID, fQtyToCalc)
                                              CalcQty(FromUOMID, ToUOMID, fQtyToCalc, function(res) {
                                                if (res) {
                                                  NewQty = res;
                                                }
                                              })
                                            }
                                            callback(NewQty);
                                          });
                                        }
                                      } 
                                  }
                                  if ((FromVolume == 'W' && ToVolume == 'V') || (FromVolume == 'V' && ToVolume == 'W')) {
                                    NewQty = roundNumber(roundNumber(NewQty, 4), 2);
                                  } else {
                                    console.log("---", FromUOMID, ToUOMID, fQtyToCalc)
                                    CalcQty(FromUOMID, ToUOMID, fQtyToCalc, function(res) {
                                      if (res) {
                                        NewQty = res;
                                      }
                                    })
                                  }
                                  callback(NewQty);
                                });

                              });
                            }
                          });
                      }
                    });

                  });
                }
              }, function(err) {
                console.log("toVolume", err);
              });

            }

          }, function(err) {
            console.log("fromVolume", err);
          });
        }
      } else {
        callback(NewQty);
      }
    }
  }

  function CalcQty(FromUOMID, ToUOMID, fQtyToCalc, callback) {
    console.log(FromUOMID, ToUOMID, fQtyToCalc);
    var fFromConversionFactor, fToConversionFactor, fTempQty, NewQty;
    NewQty = fQtyToCalc;
    if (FromUOMID != ToUOMID) {
      if (FromUOMID != 0) {
        var query9 = "SELECT BaseUOMFactor FROM UOM WHERE UOMID=?";
        console.log("query9", query9, FromUOMID);
        $cordovaSQLite.execute(productDB, query9, [FromUOMID]).then(function(res) {
          var len = res.rows.length;
          console.log("res", res);
          if (len > 0) {
            fFromConversionFactor = res.rows.item(0).BaseUOMFactor;
            NewQty = (fQtyToCalc * fFromConversionFactor);
          }
          console.log("fFromConversionFactor", fFromConversionFactor, NewQty);
          if (ToUOMID != 0 && ToUOMID != null) {
            var query10 = "SELECT BaseUOMFactor FROM UOM WHERE UOMID=?";
            console.log("query10", query10, ToUOMID);
            $cordovaSQLite.execute(productDB, query10, [ToUOMID]).then(function(res) {
                var len = res.rows.length;
                console.log("res", res);
                if (len > 0) {
                  fToConversionFactor = res.rows.item(0).BaseUOMFactor;
                  if (fToConversionFactor != 0) {
                    console.log(NewQty, fToConversionFactor);
                    NewQty = (NewQty / fToConversionFactor);
                    console.log("afterConversion", NewQty);
                  }
                  console.log("fToConversionFactor", fToConversionFactor, NewQty);
                }
                callback(NewQty);
              },
              function(err) {
                console.log(err);
              });
          } else {
            callback(NewQty);
          }
        }, function(err) {
          console.log(err);
        });
      }
    }
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

});
