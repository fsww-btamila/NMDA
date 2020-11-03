app.controller('readingController', function($scope, $rootScope, $ionicModal, $ionicPopover, $localstorage, addOrderService, ordersListService, $stateParams, $state, $ionicHistory, $q, $timeout, Notify) {
  $scope.tankType = $stateParams.tankType;
  $scope.inputField = 0;
  $scope.tankString = 'Start Tank';
  $scope.tankError = false;
  $scope.tempValid = false;
  $scope.showDraftComp = true;

  $scope.wheelOptions = {};
  $scope.wheelOptions.nums = [];
  for (var i = 0; i < 100; i++) {
    $scope.wheelOptions.nums.push({ label: i.toString(), value: i.toString() });
  }
  $scope.draftOptions = {};
  $scope.draftOptions.draft = [];
  for (var i = 0; i < 21; i++) {
    $scope.draftOptions.draft.push({ label: i.toString(), value: i.toString() });
  }
  $scope.draftOptions.draft.push({ label: '', value: '' });
  $scope.wheelOptions.nums.push({ label: '', value: '' });
  $scope.wheelOptions.inches = [];
  for (var i = 0; i < 12; i++) {
    $scope.wheelOptions.inches.push({ label: i.toString(), value: i.toString() });
  }
  $scope.wheelOptions.inches.push({ label: '', value: '' });
  $scope.wheelOptions.fracts = [];
  $scope.wheelOptions.mainUnit = "'";
  $scope.wheelOptions.subUnit = "''";

  /**implementing new picker **/
  $scope.draftFeetParams = {
    framecount: 5,
    initIndex: 1,
    initValue: '',
    itemHeight: 30,
    width: 100
  }
  /*****************************/

  $scope.currentDraft = 'draftB';
  $scope.currReadingSide = 0;


  function reduce(numerator, denominator) {
    var gcd = function gcd(a, b) {
      return b ? gcd(b, a % b) : a;
    };
    gcd = gcd(numerator, denominator);
    // return [numerator / gcd, denominator / gcd];
    return [numerator, denominator]
  }
  $scope.generateFracts = function generateFracts(den) {
    var denominator = parseInt(den);
    var fractArr = [];
    for (var i = 1; i < denominator; i++) {
      var fract = reduce(i, denominator).join('/');
      if (fractArr.indexOf(fract) == -1) {
        fractArr.push(fract);
      }
    }
    return fractArr;
  }
  $scope.buildCompartments = function() {
    var compartments;
    $scope.wheelOptions.fracts.push({ label: '', value: '' });
    if ($scope.containerType == 'insiteTank') {
      $scope.currentTank.Denominator = $scope.tstate.Denominator;
      addOrderService.getTankSubCompartments($scope.tstate.TankID)
        .then(function(results) {
          if (results.data.length > 0) {
            compartments = [];
            $scope.currentTank.showDBS = true;
            var allSubCompartments = results.data;
            allSubCompartments.forEach(function(subC) {
              var cmpCode = subC.CompartmentCode;
              if (compartments.length == 0) {
                compartments.push({
                  CompartmentCode: cmpCode,
                  subCompartments: [subC]
                })
              } else {
                var cmpExists = false;
                compartments.forEach(function(cmp) {
                  if (cmpCode == cmp.CompartmentCode) {
                    cmpExists = true;
                    cmp.subCompartments.push(subC)
                  }
                })
                if (!cmpExists) {
                  compartments.push({
                    CompartmentCode: cmpCode,
                    subCompartments: [subC]
                  })
                }
              }
            })
            compartments.forEach(function(cmp) {
              cmp.subCompartments.forEach(function(scmp) {
                scmp.quantity = {};
                scmp.maxDepth = parseInt(scmp.DepthFeet) + 0;
                scmp.MaxInch = parseInt(scmp.MaxInch) + 0;
                scmp.MaxDenominator = parseInt(scmp.MaxDenominator) + 0;
                $scope.currentTank.Denominator = scmp.Denominator;
                if (!$scope.readingUOM) {
                  $scope.readingUOM = scmp.VolumeUOMCode;
                }
              })
              cmp.Code = cmp.Code;
              cmp.TankID = $scope.tstate.TankID;
              cmp.ftcontrol = {};
              cmp.incontrol = {};
              cmp.fractcontrol = {};
            })

          } else {
            compartments = [{}];
            var cmp = compartments[0];
            cmp.subCompartments = [{ ReadingSide: '', quantity: {}, maxDepth: parseInt($scope.tstate.DepthFeet) || 0, MaxInch: parseInt($scope.tstate.MaxInch) || 0, MaxDenominator: parseInt($scope.tstate.MaxDenominator) || 0 }];
            cmp.Code = $scope.tstate.Code;
            cmp.TankID = $scope.tstate.TankID;
            cmp.ftcontrol = {};
            cmp.incontrol = {};
            cmp.fractcontrol = {};
          }
          $scope.currentTank.Compartments = angular.copy(compartments);
          $scope.Compartments = $scope.currentTank.Compartments;
          $scope.currentCompartmentIndex = 0;
          $scope.currentCompartment = $scope.Compartments[0];
          $scope.buildFractions();
        })

    } else if ($scope.containerType == 'vehicle') {
      addOrderService.getVehicleCompartments($scope.order.OrderHdr.Vehicle.VehicleID)
        .then(getSubCompartments)
        .then(function() {
          compartments = angular.copy($scope.vehicleCompartments);
          $scope.currentTank.Compartments = compartments;
          $scope.Compartments = $scope.currentTank.Compartments;
          $scope.currentCompartmentIndex = 0;
          $scope.currentCompartment = $scope.Compartments[0];
          $scope.buildFractions();
        })
    }
    return compartments;
  }
  $scope.buildFractions = function() {
    $scope.wheelOptions.fracts = [];
    var currentDen;
    if ($scope.currentTank.Denominator != null) {
      $scope.currentDen = $scope.currentTank.Denominator;
    } else {
      if ($scope.currentCompartment) {
        $scope.currentDen = $scope.currentCompartment.subCompartments[$scope.inputField || 0].Denominator;

      }
    }
    var fractArr = $scope.generateFracts($scope.currentDen);
    $scope.wheelOptions.fracts = [];
    $scope.wheelOptions.fracts.push({ label: '0', value: '0' });
    fractArr.forEach(function(val) {
      $scope.wheelOptions.fracts.push({ label: val, value: val })
    })
    $scope.wheelOptions.fracts.push({ label: '', value: '' });
  }
  if ($stateParams.tank) {
    $scope.tank = $stateParams.tank;
    $scope.tstate = $stateParams.tstate;
    if ($scope.tstate && $scope.tstate.VolumeUOMCode) {
      $scope.readingUOM = $scope.tstate.VolumeUOMCode;
    }
    if (!$stateParams.tstate.EnableSubCompartment) {
      $scope.wheelOptions = {};
      $scope.wheelOptions.nums = [];
      var limit = (parseInt($scope.tstate.DepthFeet) + 1) || 100;
      for (var i = 0; i < limit; i++) {
        $scope.wheelOptions.nums.push({ label: i.toString(), value: i.toString() });
      }
      $scope.wheelOptions.nums.push({ label: '', value: '' });
      $scope.wheelOptions.inches = [];
      for (var i = 0; i < 12; i++) {
        $scope.wheelOptions.inches.push({ label: i.toString(), value: i.toString() });
      }
      $scope.wheelOptions.inches.push({ label: '', value: '' });
      $scope.wheelOptions.fracts = [];
      $scope.wheelOptions.mainUnit = "'";
      $scope.wheelOptions.subUnit = "''";
    }


    if ($scope.tank == 'endTank') {
      $scope.tankString = 'End Tank';
    }
    $scope.readingState = 'tank';
    if (!$scope.tstate[$scope.tank]) {
      $scope.tstate[$scope.tank] = {};
      if ($scope.tank == 'endTank') {
        $scope.tstate[$scope.tank].datetime = $rootScope.getCurrentDateTime();
      } else {
        if ($scope.order && $scope.order.OrderHdr) {
          $scope.tstate[$scope.tank].datetime = $scope.order.OrderHdr.processStartTime;
        } else {
          $scope.tstate[$scope.tank].datetime = $rootScope.getCurrentDateTime();
        }

      }

      if (!($scope.tstate[$scope.tank].datetime instanceof Date)) {
        if ($scope.activeAction == 'Ship') {
          $scope.tstate[$scope.tank].datetime = new Date($scope.tstate[$scope.tank].datetime);
        } else {
          if ($scope.tank == 'endTank') {
            $scope.tstate[$scope.tank].datetime = new Date($rootScope.getCurrentDateTime());
          } else {
            if ($scope.order && $scope.order.OrderHdr) {
              $scope.tstate[$scope.tank].datetime = $scope.order.OrderHdr.processStartTime;
            } else {
              $scope.tstate[$scope.tank].datetime = $rootScope.getCurrentDateTime();
            }
          }
        }
      }

      $scope.currentTank = $scope.tstate[$scope.tank];
      $scope.currentTank.draft = {};
      $scope.currentTank.draft.ftcontrol = {};
      $scope.currentTank.draft.incontrol = {};
      $scope.currentTank.draft.fractcontrol = {};
      $scope.currentTank.draft.draftB = {};
      $scope.currentTank.draft.draftS = {};
    } else {
      $scope.currentTank = $scope.tstate[$scope.tank];
      $scope.currentTank.datetime = new Date($scope.tstate[$scope.tank].datetime);
    }
    if ($scope.tstate.TankID) {
      $scope.containerType = 'insiteTank';
    } else {
      $scope.containerType = 'vehicle';
    }
    if (!$scope.currentTank.Compartments) {
      $scope.buildCompartments();
    } else {
      //$scope.currentTank.Compartments = compartments;
      $scope.Compartments = $scope.currentTank.Compartments;
      $scope.currentCompartmentIndex = 0;
      $scope.currentCompartment = $scope.Compartments[0];
      $scope.buildFractions();
    }

  } else if ($stateParams.meter) {
    $scope.readingState = 'stMeter';
  } else {
    $scope.readingState = 'initial';
  }
  $scope.ignoreWatch = true;

  $scope.fieldFlag = {};
  $scope.setFieldFlag = function(index, unit) {
    if ($scope.currentCompartment.subCompartments[index].SubCompartmentID == undefined)
      $scope.currentCompartment.subCompartments[index].SubCompartmentID = 0;
    $scope.fieldFlag[$scope.currentCompartment.subCompartments[index].SubCompartmentID] = unit;
    // if(index == undefined) index = 0;
    // $scope.fieldFlag[index] = "feet";
    // console.log("id is ", index);
    // $scope.subCompartFlag = index;
    // $scope.fieldFlag = unit;
  }
  // $scope.setInputField = function(field, event, compartment, subCompartment) {
  //     $scope.currReadingSide = 0;
  //     $scope.inputField = field;
  //     (subCompartment.ReadingSide == 'S') ? $scope.currReadingSide = 1: $scope.currReadingSide = 0;
  //     var positions = getItemPositions(subCompartment.quantity.feet, subCompartment.quantity.inch, subCompartment.quantity.fracts)
  //     compartment.ftcontrol.gotoItem(positions[0]);
  //     compartment.incontrol.gotoItem(positions[1]);
  //     compartment.fractcontrol.gotoItem(positions[2]);
  // }


  $scope.setDraftField = function(value) {
    // $scope.currentDraft = field; //currentTank.draft[currentDraft].feet
    // console.log($scope.currentTank.draft[field].feet);
    // var cDraft = $scope.currentTank.draft[$scope.currentDraft];
    // var positions = getItemPositions(cDraft.feet, cDraft.inch, cDraft.fracts)
    // $scope.currentTank.draft.ftcontrol.gotoItem(positions[0]);
    // $scope.currentTank.draft.incontrol.gotoItem(positions[1]);
    // $scope.currentTank.draft.fractcontrol.gotoItem(positions[2]);
    switch (value) {
      case 3:
        $scope.selectedDraftTank = "draftS";
        $scope.selectedDraftField = "inch";
        break;
      case 2:
        $scope.selectedDraftTank = "draftS";
        $scope.selectedDraftField = "feet";
        break;
      case 1:
        $scope.selectedDraftTank = "draftB";
        $scope.selectedDraftField = "inch";
        break;
      default:
        $scope.selectedDraftTank = "draftB";
        $scope.selectedDraftField = "feet";
        break;
    }

  }
  setTimeout(function() {
    $scope.setDraftField('draftB');
    $scope.setCurrentCompartment(0);
  }, 0)

  function getItemPositions(ft, inch, fr) {
    var ftpos = _.findIndex($scope.wheelOptions.nums, function(o) {
      return o.value == ft;
    });
    var inpos = _.findIndex($scope.wheelOptions.nums, function(o) {
      return o.value == inch;
    });
    var frpos = _.findIndex($scope.wheelOptions.fracts, function(o) {
      return o.value == fr;
    });
    return [ftpos, inpos, frpos];
  }
  $scope.fractionIn = {};
  $scope.fractionIn.quantity = '';
  $scope.$watch('fractionIn', function(n, v) {
    if ((n.quantity || n.quantity == '') && !$scope.ignoreWatch) {}
    $scope.ignoreWatch = false;
  }, true)
  $scope.setCurrentCompartment = function(cnumber) {
    $scope.currReadingSide = 0;
    $scope.currentCompartmentIndex = cnumber;
    $scope.currentCompartment = $scope.currentTank.Compartments[cnumber];
    var currentSubCompartment = $scope.currentCompartment.subCompartments[0];
    // console.log($scope.tstate[$scope.tank].datetime);
    // var datearr = ($scope.tstate[$scope.tank].datetime.split(/-|T|:|\.|Z/));
    // datearr = datearr.splice(-1,1);
    // console.log(datearr.toString(' '));
    // console.log(new Date(datearr.toString(' ')));
    $scope.inputField = 0;
    var positions = getItemPositions(currentSubCompartment.quantity.feet, currentSubCompartment.quantity.inch, currentSubCompartment.quantity.fracts)
    $scope.currentCompartment.ftcontrol.gotoItem(positions[0]);
    $scope.currentCompartment.incontrol.gotoItem(positions[1]);
    $scope.currentCompartment.fractcontrol.gotoItem(positions[2]);
    $scope.fractionIn.quantity = $scope.currentCompartment.subCompartments[$scope.inputField].quantity;


    if ($stateParams.tstate.EnableSubCompartment) {
      $scope.wheelOptions = {};
      $scope.wheelOptions.nums = [];
      for (var i = 0; i < (parseInt($scope.currentCompartment.subCompartments[$scope.inputField].DepthFeet) + 1); i++) {
        $scope.wheelOptions.nums.push({ label: i.toString(), value: i.toString() });
      }
      $scope.wheelOptions.nums.push({ label: '', value: '' });
      $scope.wheelOptions.inches = [];
      for (var i = 0; i < 12; i++) {
        $scope.wheelOptions.inches.push({ label: i.toString(), value: i.toString() });
      }
      $scope.wheelOptions.inches.push({ label: '', value: '' });
      $scope.wheelOptions.fracts = [];
      $scope.wheelOptions.mainUnit = "'";
      $scope.wheelOptions.subUnit = "''";
    }
    $scope.buildFractions();
  }

  function getInches(value) {
    var ret;
    if (value.feet || value.inch || value.fracts) {
      var ft = parseInt(value.feet) * 12 || 0;
      var inch = parseInt(value.inch) || 0;
      ret = (ft + inch).toString() + (eval(value.fracts) || 0);
    }
    return ret;
  }

  function calcInches(value) {
    var ret;
    var inch = value.inch;
    ret = parseInt(inch) + (eval(value.fracts) || 0);
    if (ret)
      return ret.toString();
    else
      return 0;
  }

  function calcFracts(value) {
    var ret;
    ret = (eval(value.fracts) || 0) * $scope.currentDen;
    if (ret) {
      return ret;
    } else {
      return 0;
    }
  }
  var offlineData = $localstorage.get('lastlogin');
  var data = JSON.parse(offlineData);
  var userName = '';
  if ($rootScope.loginCredentials) {
    userName = $rootScope.loginCredentials.UserName;
  } else {
    userName = data[1].uname;
  }
  $scope.allSubCompartmentsDone = false;
  $scope.allSubCompartmentsDoneError = false;
  $scope.setCompartmentStatus = function(compartment, currentTank, cb) {


    if ($scope.currentTank.draftTemp || $scope.currentTank.draftATemp) {
      if ($scope.currentTank.draftTemp < 20 || $scope.currentTank.draftTemp > 400) {
        Notify.pop('error', 'Liquid Temperature should be from 20 to 400.', 'e002');
        return;
      }
      if (Math.abs($scope.currentTank.draftATemp) / 159 > 1) {
        Notify.pop('error', 'Ambient Temperature should be from -159 to 159.', 'e006');
        return;
      }
    }
    var defer = $q.defer();
    var notDoneCount = 0;
    var tanksCount = 0;

    var validReading = true;
    
    angular.forEach(currentTank.Compartments, function(val) {
      angular.forEach(val.subCompartments, function(subVal) {

        /** validate the values for max values **/
        /****************************************/
        let maxValue = {
          feet: parseInt(subVal.maxDepth) || 0,
          inch: parseInt(subVal.MaxInch) || 0,
          denom: parseInt(subVal.MaxDenominator) || 0
        }

        // if(subVal.quantity.inch > 11){
        //     subVal.quantity.feet = parseInt(subVal.quantity.feet) + parseInt(subVal.quantity.inch / 12);
        //     subVal.quantity.inch = parseInt(subVal.quantity.inch) % 12;
        // }
        let cmpName = '';
        let subValTank = '';
        if (val.Code != undefined)
          cmpName = val.Code + ' ' + subVal.ReadingSide;
        else if (val.CompartmentCode != undefined)
          cmpName = val.CompartmentCode;
        else
          cmpName = 'tanks';

        if (cmpName) {
          cmpName = cmpName.replace(/ /g, '');
        }

        if (subVal && subVal.TankChartCode) {
          subValTank = subVal.TankChartCode.replace(/ /g, '');
        }

        var cmpNameId = cmpName.length > 2 ? cmpName : subValTank;

        if (parseInt(subVal.quantity.feet) > maxValue.feet) {
          Notify.pop('error', 'Invalid feet readings in ' + cmpNameId, 'e011' + cmpNameId);
          validReading = false;
          return;
        }

        if (parseInt(subVal.quantity.feet) >= maxValue.feet && parseInt(subVal.quantity.inch) >= maxValue.inch) {
          if (parseInt(subVal.quantity.inch) > maxValue.inch) {
            Notify.pop('error', 'Invalid inch readings in ' + cmpNameId, 'e031' + cmpNameId);
            validReading = false;
            return;
          } else if (parseInt(subVal.quantity.fracts) && parseInt(subVal.quantity.fracts[0]) > maxValue.denom) {
            Notify.pop('error', 'Invalid denominator readings in ' + cmpNameId, 'e032' + cmpNameId);
            validReading = false;
            return
          } else if (maxValue.denom > 0) {
            Notify.pop('error', 'Invalid inch readings in ' + cmpNameId, 'e033' + cmpNameId);
            validReading = false;
            return;
          }
        }


        /****************************************/
        tanksCount++;

        // Allow 0 Feet
        console.log("subVal.quantity", subVal, subVal.quantity);
        if ((typeof(subVal.quantity) == 'object') && (subVal.quantity.fracts || subVal.quantity.feet || subVal.quantity.inch)) {

          // If any values in tank reading
          if ($scope.currentItem.Qty > 0) {
            if($stateParams.tankType == 'Source' && $scope.tank == 'stTank'){
              $scope.currentItem.posSrcHideFinishBtn = 0;
            }

            if($stateParams.tankType == 'Receiving' && $scope.tank == 'endTank'){
              $scope.currentItem.posRecvHideFinishBtn = 0;
            }else{
              if($stateParams.tankType == 'Receiving'){
                if(!$scope.tstate.endTank){
                  $scope.currentItem.posRecvHideFinishBtn = 1;
                }
              }
            }
          }
          else{

            if($stateParams.tankType == 'Source' && $scope.tank == 'endTank'){
              $scope.currentItem.negSrcHideFinishBtn = 0;
            }

            if($stateParams.tankType == 'Receiving' && $scope.tank == 'stTank'){
              if(!$scope.tstate.endTank){
                $scope.currentItem.negRecvHideFinishBtn = 1;
              }
              else{
                $scope.currentItem.negRecvHideFinishBtn = 0;
              }
            }
          }
        }
        else{
          
          // If any (0) values in tank reading
          if ($scope.currentItem.Qty > 0) {

            if($stateParams.tankType == 'Source' && $scope.tank == 'stTank'){
              if (!$scope.tstate.endTank) {
                notDoneCount += 1;
                $scope.currentItem.posSrcHideFinishBtn = 1;
              }
            }
            else if( $stateParams.tankType == 'Source' && $scope.tank == 'endTank' ){
              $scope.currentItem.posSrcHideFinishBtn = 0;
            }

            if($stateParams.tankType == 'Receiving' && $scope.tank == 'endTank'){
              if (!$scope.tstate.stTank) {
                  notDoneCount += 1;
                  $scope.currentItem.posRecvHideFinishBtn = 1;
              }else{
                $scope.currentItem.posRecvHideFinishBtn = 0;
              }
            }
            else if (($stateParams.tankType == 'Receiving' && $scope.tank == 'stTank')) {
                $scope.currentItem.posRecvHideFinishBtn = 1;
            }

          } else {
              // Negative Scenario
              if ($scope.currentItem.Qty < 0) {

                if($stateParams.tankType == 'Source' && $scope.tank == 'endTank'){
                  if (!$scope.tstate.stTank) {
                      notDoneCount += 1;
                      $scope.currentItem.negSrcHideFinishBtn = 1;
                  }else{
                    $scope.currentItem.negSrcHideFinishBtn = 0;
                  }
                }
                else{
                  if($stateParams.tankType == 'Receiving' && $scope.tank == 'endTank') {
                      $scope.currentItem.negRecvHideFinishBtn  = 0;
                  } 
                  else if ($stateParams.tankType == 'Receiving' && $scope.tank == 'stTank') {
                    if(!$scope.tstate.endTank){
                      notDoneCount += 1;
                      $scope.currentItem.negRecvHideFinishBtn = 1;
                    }
                    else{
                      $scope.currentItem.negRecvHideFinishBtn = 0;
                    }
                  }
                }
              }
          }

        }
      });
    });

    if (!validReading) return false;
    // if ($scope.currentItem.Qty > 0) {
      if (notDoneCount > 0 && $scope.containerType != 'vehicle') {
        $scope.allSubCompartmentsDoneError = true;
        Notify.pop('error', 'Enter all sub-compartment readings', 'e003');
        $scope.currentEntry.stTankStatus = 'initial';
        $scope.tstate.TankQty = 0;
        $scope.currentTank.quantityShipped = 0;
        return false;
      } else {
        $scope.allSubCompartmentsDone = true;
        $scope.allSubCompartmentsDoneError = false;
      }
    // }

    // $scope.tankError = false;
    $scope.tankReadingError = false;
    $scope.currentEntry.sourceTotalTankQuantity = 0;
   
    if(!$scope.currentEntry.receivingTotalTankQuantity){
       $scope.currentEntry.receivingTotalTankQuantity = 0;
    }
   
    var allFilled = true;
    if (allFilled && !$scope.tankError) {
      $scope.currentEntry.stTankStatus = 'finished';
      var type;
      if ($scope.tank === 'stTank') {
        type = "Before";
      } else {
        type = "After";
      }
      var header = $scope.order.OrderHdr;
      if (!$scope.tstate.UniqueID) {
        $scope.tstate.UniqueID = (Math.floor(Math.random() * 90000) + 10000);
      }
      var vid;
      if ($scope.containerType == 'insiteTank') {
        vid = 0
      } else {
        vid = header.Vehicle.VehicleID
      }
      var reqData = {
        "CalcShipReading": {
          "Type": type,
          "VehicleID": vid,
          "OrderNo": header.OrderNo,
          "MarineSessionID": "1003",
          "SysTrxLine": $scope.currentItem.SysTrxLine,
          "CompanyID": $rootScope.CompanyID,
          "CustomerID": $rootScope.accSettings.customerId,
          "DateTime": getUTCDateTime($scope.currentTank.datetime),
          "UniqueID": $scope.tstate.UniqueID,
          "StartTime": $scope.tstate[$scope.tank].datetime,
          "EndTime": $scope.tstate[$scope.tank].datetime,
          "EnteredBy": $scope.order.OrderHdr.EnteredBy,
          "ReadBy": $scope.currentEntry.readBy,
          "ProcessStep": $scope.activeAction,
          "SrcDst": "S",
          "UserID": userName,
          "INSiteTankID": $scope.tstate.TankID || 0,
          "ProdID": $scope.currentItem.MasterProdID,
          "ProdContID": $scope.currentItem.ProdContID,
          "Denominator": $scope.currentTank.Denominator || 0,
          "TankChartID": $scope.tstate.TankChartID || 0,
          "Compartments": []
        }
      }
      if (!$rootScope.isInternet || !$rootScope.online) {
        reqData.CalcShipReading.Insulated = $scope.tstate.Insulated;
        reqData.CalcShipReading.HasLinearExpansionCoeff = $scope.tstate.HasLinearExpansionCoeff;
        reqData.CalcShipReading.LinearExpansionCoeff = $scope.tstate.LinearExpansionCoeff;
        reqData.CalcShipReading.TankOperatingTemp = $scope.tstate.TankOperatingTemp;
      }

      if ($scope.currentTank.draftATemp || $scope.currentTank.draftATemp == 0) {
        reqData.CalcShipReading.ATemp = $scope.currentTank.draftATemp;
      } 
      else {
        if (!$rootScope.isInternet || !$rootScope.online) {
          reqData.CalcShipReading.ATemp = 0;
        }
      }

      if ($scope.currentTank.draftTemp || $scope.currentTank.draftTemp == 0) {
        reqData.CalcShipReading.Temp = $scope.currentTank.draftTemp;
      } 
      else {
        if (!$rootScope.isInternet || !$rootScope.online) {
          reqData.CalcShipReading.Temp = 0;
        }
      }

      if ($scope.currentTank.draft.draftB.feet || $scope.currentTank.draft.draftB.feet == 0) {
        reqData.CalcShipReading.BF = ($scope.currentTank.draft.draftB.feet == '') ? 0 : $scope.currentTank.draft.draftB.feet;
      }
      if ($scope.currentTank.draft.draftB.inch || $scope.currentTank.draft.draftB.inch == 0) {
        reqData.CalcShipReading.BI = calcInches($scope.currentTank.draft.draftB);
      }
      if ($scope.currentTank.draft.draftS.feet || $scope.currentTank.draft.draftS.feet == 0) {
        reqData.CalcShipReading.SF = ($scope.currentTank.draft.draftS.feet == '') ? 0 : $scope.currentTank.draft.draftS.feet;
      }
      if ($scope.currentTank.draft.draftS.inch || $scope.currentTank.draft.draftS.inch == 0) {
        reqData.CalcShipReading.SI = calcInches($scope.currentTank.draft.draftS);
      }

      $scope.currentTank.Compartments.forEach(function(cmp) {
        var compartment = {};
        compartment.CustomerID = $rootScope.accSettings.customerId;
        compartment.UniqueID = $scope.tstate.UniqueID;
        compartment.Type = type;
        compartment.subCompartments = [];
        cmp.subCompartments.forEach(function(scmp, index) {
          compartment.containerType = $scope.containerType;
          if ($scope.containerType === 'insiteTank') {
            compartment.INSiteTankID = scmp.INSiteTankID || $scope.tstate.TankID;
            compartment.CompartmentID = scmp.SubCompartmentID;
            compartment.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
            compartment.VolumeUOM = $scope.tstate.VolumeUOM;
            if (!scmp.ReadingSide) {
              compartment.MF = scmp.quantity.feet || 0;
              compartment.MI = scmp.quantity.inch || 0;
              compartment.MR = calcFracts(scmp.quantity) || 0;
            } else {
              compartment.hasSubCompartments = "Y";
              if (scmp.ReadingSide == 'P') {
                var PF = scmp.quantity.feet || 0;
                var PI = scmp.quantity.inch || 0;
                var PR = calcFracts(scmp.quantity) || 0;
                var PID = scmp.SubCompartmentID;
                compartment.subCompartments.push({
                  "PF": PF,
                  "PI": PI,
                  "PR": PR,
                  "PID": PID,
                  "INSiteTankID": scmp.INSiteTankID || $scope.tstate.TankID,
                  "CustomerID": $rootScope.accSettings.customerId,
                  "UniqueID": $scope.tstate.UniqueID,
                  "Type": compartment.Type,
                  "ToUOMID": compartment.ToUOMID,
                  "VolumeUOM": scmp.VolumeUOM,
                  "TankChartID": scmp.TankChartID,
                  "ReadingSide": scmp.ReadingSide
                });
              } else if (scmp.ReadingSide == 'M' || scmp.ReadingSide == 'E') {
                var MF = scmp.quantity.feet || 0;
                var MI = scmp.quantity.inch || 0;
                var MR = calcFracts(scmp.quantity) || 0;
                var MID = scmp.SubCompartmentID;
                compartment.subCompartments.push({
                  "MF": MF,
                  "MI": MI,
                  "MR": MR,
                  "MID": MID,
                  "INSiteTankID": scmp.INSiteTankID || $scope.tstate.TankID,
                  "CustomerID": $rootScope.accSettings.customerId,
                  "UniqueID": $scope.tstate.UniqueID,
                  "Type": compartment.Type,
                  "ToUOMID": compartment.ToUOMID,
                  "VolumeUOM": scmp.VolumeUOM,
                  "TankChartID": scmp.TankChartID,
                  "ReadingSide": scmp.ReadingSide
                });
              } else {
                var SF = scmp.quantity.feet || 0;
                var SI = scmp.quantity.inch || 0;
                var SR = calcFracts(scmp.quantity) || 0;
                var SID = scmp.SubCompartmentID;
                compartment.subCompartments.push({
                  "SF": SF,
                  "SI": SI,
                  "SR": SR,
                  "SID": SID,
                  "INSiteTankID": scmp.INSiteTankID || $scope.tstate.TankID,
                  "CustomerID": $rootScope.accSettings.customerId,
                  "UniqueID": $scope.tstate.UniqueID,
                  "Type": compartment.Type,
                  "ToUOMID": compartment.ToUOMID,
                  "VolumeUOM": scmp.VolumeUOM,
                  "TankChartID": scmp.TankChartID,
                  "ReadingSide": scmp.ReadingSide
                });
              }
            }

          } else {
            compartment.CompartmentID = cmp.CompartmentID;
            compartment.INSiteTankID = 0;
            if (scmp.ReadingSide == 'P') {
              compartment.PF = scmp.quantity.feet || 0;
              compartment.PI = scmp.quantity.inch || 0;
              compartment.PR = calcFracts(scmp.quantity) || 0;
              compartment.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
            } else if (scmp.ReadingSide == 'M' || scmp.ReadingSide == 'E') {
              compartment.MF = scmp.quantity.feet || 0;
              compartment.MI = scmp.quantity.inch || 0;
              compartment.MR = calcFracts(scmp.quantity) || 0;
              compartment.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
            } else {
              compartment.SF = scmp.quantity.feet || 0;
              compartment.SI = scmp.quantity.inch || 0;
              compartment.SR = calcFracts(scmp.quantity) || 0;
              compartment.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
            }
          }
        })
        reqData.CalcShipReading.Compartments.push(compartment);
      })
      //Offline vehicle compartments scenario
      if (!$rootScope.isInternet || !$rootScope.online) {
        var tempCompartments = angular.copy($scope.currentTank.Compartments);
        tempCompartments.forEach(function(cmp) {
          cmp.subCompartments.forEach(function(scmp) {
            if (scmp.ReadingSide == 'P') {
              scmp.PF = scmp.quantity.feet || 0;
              scmp.PI = scmp.quantity.inch || 0;
              scmp.PR = calcFracts(scmp.quantity) || 0;
              scmp.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
            } else if (scmp.ReadingSide == 'M' || scmp.ReadingSide == 'E') {
              scmp.MF = scmp.quantity.feet || 0;
              scmp.MI = scmp.quantity.inch || 0;
              scmp.MR = calcFracts(scmp.quantity) || 0;
              scmp.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
            } else {
              scmp.SF = scmp.quantity.feet || 0;
              scmp.SI = scmp.quantity.inch || 0;
              scmp.SR = calcFracts(scmp.quantity) || 0;
              scmp.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
            }
          });
        });
        reqData.vehicleCompartments = tempCompartments;
      }
      addOrderService.calcShipReading(reqData, function(data) {
        if (type == 'Before') {
          $scope.currentTank.quantityShipped = data[0].QtyBefore;
        } else {
          $scope.currentTank.quantityShipped = data[0].QtyAfter;
        }
        if (cb) {
          cb();
        }
        defer.resolve('got data');
      })
    }
    $scope.showQuantity = true;
    return defer.promise;
  }
  $scope.calcTankReading = function(compartment, currentTank, isDone) {
    var notDoneCount = 0;
    var tanksCount = 0;
    var validReading = true;

    angular.forEach(currentTank.Compartments, function(val) {
      angular.forEach(val.subCompartments, function(subVal) {

        /** validate the values for max values **/
        /****************************************/
        let maxValue = {
          feet: parseInt(subVal.maxDepth) || 0,
          inch: parseInt(subVal.MaxInch) || 0,
          denom: parseInt(subVal.fracts)
        }

        // if(subVal.quantity.inch > 11){
        //     subVal.quantity.feet = parseInt(subVal.quantity.feet) + parseInt(subVal.quantity.inch / 12);
        //     subVal.quantity.inch = parseInt(subVal.quantity.inch) % 12;
        // }

        let cmpName = '';
        let subValTank = '';
        if (val.Code != undefined)
          cmpName = val.Code + ' ' + subVal.ReadingSide;
        else if (val.CompartmentCode != undefined)
          cmpName = val.CompartmentCode;
        else
          cmpName = 'tanks';

        if (cmpName) {
          cmpName = cmpName.replace(/ /g, '');
        }

        if (subVal && subVal.TankChartCode) {
          subValTank = subVal.TankChartCode.replace(/ /g, '');
        }
        var cmpNameId = cmpName.length > 2 ? cmpName : subValTank;

        if (subVal.quantity.feet > maxValue.feet) {
          Notify.pop('error', 'Invalid feet readings in ' + cmpNameId, 'e011' + cmpNameId);
          validReading = false;
          return;
        }

        if (subVal.quantity.feet >= maxValue.feet && subVal.quantity.inch > maxValue.inch) {
          if (subVal.quantity.inch > maxValue.inch) {
            Notify.pop('error', 'Invalid inch readings in ' + cmpNameId, 'e011' + cmpNameId);
            validReading = false;
            return;
          }
          if (subVal.quantity.fracts && parseInt(subVal.quantity.fracts[0]) > maxValue.denom) {
            Notify.pop('error', 'Invalid denominator readings in ' + cmpNameId, 'e012' + cmpNameId);
            validReading = false;
            return;
          }

          Notify.pop('error', 'Invalid inch readings in ' + cmpNameId, 'e013' + cmpNameId);
          validReading = false;
          return;
        }

        tanksCount++;
        if ((typeof(subVal.quantity) == 'object') && (subVal.quantity.fracts || subVal.quantity.feet || subVal.quantity.inch)) {} else {
          notDoneCount += 1;
        }
      });
    });
    if (!validReading) return false;
    if (notDoneCount > 0 && $scope.containerType != 'vehicle') {
      $scope.allSubCompartmentsDoneError = true;
      Notify.pop('error', 'Enter all sub-compartment readings', 'e007');
      $scope.currentEntry.stTankStatus = 'initial';
      return false;
    }

    var num, den;
    var cmp = compartment.subCompartments[0];
    if (cmp.quantity.fracts) {
      var tmp = cmp.quantity.fracts.split('/');
      num = tmp[0];
      den = tmp[1];
    }
    var inDepth = 0;
    if (cmp.quantity.feet) {
      inDepth = cmp.quantity.feet * 12;
    }
    if (cmp.quantity.inch) {
      inDepth = inDepth + cmp.quantity.inch;
    }
    var reqData = {
      "INSiteTankVolumeList": {
        "INSiteTankVolume": {
          "Type": "INSiteTankVolume",
          "INSiteTankVolumeID": $scope.INSiteTankVolumeID || 0,
          "INSiteTankID": compartment.TankID,
          "INSiteID": $stateParams.InSiteID,
          "ProdContID": 0,
          "ReadingDateTime": getUTCDateTime($scope.currentTank.datetime),
          "lastReadingDateTime": $scope.lastReadingDateTime,
          "Depth": cmp.quantity.inch || 0,
          "LastModifiedUser": $rootScope.loginData.uname,
          "DepthNumerator": num || 0,
          "Feet": cmp.quantity.feet || 0,
          "CompanyID": $rootScope.CompanyID,
          "CustomerID": 4108,
          "StartTime": $rootScope.getCurrentDateTime(),
          "EndTime": $rootScope.getCurrentDateTime(),
          "ProdID": 1901,
          "UserID": "agerhold",
          "IsReadingDone": isDone || 0,
          "TankChartID": $scope.tstate.TankChartID || 0,
          "Compartments": [],
          "comment": $scope.currentTank.comment || '',
          "Denominator": $scope.currentTank.Denominator || 0
        }
      }
    }
    if (!$rootScope.isInternet || !$rootScope.online) {
      reqData.INSiteTankVolumeList.INSiteTankVolume.Insulated = $scope.tstate.Insulated;
      reqData.INSiteTankVolumeList.INSiteTankVolume.HasLinearExpansionCoeff = $scope.tstate.HasLinearExpansionCoeff;
      reqData.INSiteTankVolumeList.INSiteTankVolume.LinearExpansionCoeff = $scope.tstate.LinearExpansionCoeff;
      reqData.INSiteTankVolumeList.INSiteTankVolume.TankOperatingTemp = $scope.tstate.TankOperatingTemp;
    }

    if ($scope.currentTank.draftATemp || $scope.currentTank.draftATemp == 0) {
      reqData.INSiteTankVolumeList.INSiteTankVolume.ATemp = $scope.currentTank.draftATemp;
    } 
    else {
      if (!$rootScope.isInternet || !$rootScope.online) {
        reqData.INSiteTankVolumeList.INSiteTankVolume.ATemp = 0;
      }
    }
    if ($scope.currentTank.draftTemp || $scope.currentTank.draftTemp == 0) {
      reqData.INSiteTankVolumeList.INSiteTankVolume.Temp = $scope.currentTank.draftTemp;
    } 
    else {
      if (!$rootScope.isInternet || !$rootScope.online) {
        reqData.INSiteTankVolumeList.INSiteTankVolume.Temp = 0;
      }
    }
    if ($scope.currentTank.draft.draftB.feet || $scope.currentTank.draft.draftB.feet == 0) {
      reqData.INSiteTankVolumeList.INSiteTankVolume.BF = ($scope.currentTank.draft.draftB.feet == '') ? 0 : $scope.currentTank.draft.draftB.feet;
    }
    if ($scope.currentTank.draft.draftB.inch || $scope.currentTank.draft.draftB.inch == 0) {
      reqData.INSiteTankVolumeList.INSiteTankVolume.BI = calcInches($scope.currentTank.draft.draftB);
    }
    if ($scope.currentTank.draft.draftS.feet || $scope.currentTank.draft.draftS.feet == 0) {
      reqData.INSiteTankVolumeList.INSiteTankVolume.SF = ($scope.currentTank.draft.draftS.feet == '') ? 0 : $scope.currentTank.draft.draftS.feet;
    }
    if ($scope.currentTank.draft.draftS.inch || $scope.currentTank.draft.draftS.inch == 0) {
      reqData.INSiteTankVolumeList.INSiteTankVolume.SI = calcInches($scope.currentTank.draft.draftS);
    }

    $scope.currentTank.Compartments.forEach(function(cmp) {
      var compartment = {};
      compartment.CustomerID = $rootScope.accSettings.customerId;
      compartment.UniqueID = $scope.tstate.UniqueID;
      compartment.subCompartments = [];
      cmp.subCompartments.forEach(function(scmp, index) {
        compartment.containerType = $scope.containerType;
        if ($scope.containerType === 'insiteTank') {
          compartment.INSiteTankID = scmp.INSiteTankID || $scope.tstate.TankID;
          compartment.CompartmentID = scmp.SubCompartmentID;
          if (!scmp.ReadingSide) {
            compartment.MF = scmp.quantity.feet || 0;
            compartment.MI = scmp.quantity.inch || 0;
            compartment.MR = calcFracts(scmp.quantity) || 0;
          } else {
            compartment.hasSubCompartments = "Y";
            if (scmp.ReadingSide == 'P') {
              var PF = scmp.quantity.feet || 0;
              var PI = scmp.quantity.inch || 0;
              var PR = calcFracts(scmp.quantity) || 0;
              var PID = scmp.SubCompartmentID;
              compartment.subCompartments.push({
                "PF": PF,
                "PI": PI,
                "PR": PR,
                "CID": PID,
                "INSiteTankID": scmp.INSiteTankID || $scope.tstate.TankID,
                "CustomerID": $rootScope.accSettings.customerId,
                "UniqueID": $scope.tstate.UniqueID,
                "TankChartID": scmp.TankChartID,
                "ToUOMID": compartment.ToUOMID,
                "VolumeUOM": scmp.VolumeUOM,
                "ReadingSide": scmp.ReadingSide
              });
            } else if (scmp.ReadingSide == 'M' || scmp.ReadingSide == 'E') {
              var MF = scmp.quantity.feet || 0;
              var MI = scmp.quantity.inch || 0;
              var MR = calcFracts(scmp.quantity) || 0;
              var MID = scmp.SubCompartmentID;
              compartment.subCompartments.push({
                "MF": MF,
                "MI": MI,
                "MR": MR,
                "CID": MID,
                "INSiteTankID": scmp.INSiteTankID || $scope.tstate.TankID,
                "CustomerID": $rootScope.accSettings.customerId,
                "UniqueID": $scope.tstate.UniqueID,
                "Type": compartment.Type,
                "TankChartID": scmp.TankChartID,
                "ToUOMID": compartment.ToUOMID,
                "VolumeUOM": scmp.VolumeUOM,
                "ReadingSide": scmp.ReadingSide
              });
            } else {
              var SF = scmp.quantity.feet || 0;
              var SI = scmp.quantity.inch || 0;
              var SR = calcFracts(scmp.quantity) || 0;
              var SID = scmp.SubCompartmentID;
              compartment.subCompartments.push({
                "SF": SF,
                "SI": SI,
                "SR": SR,
                "CID": SID,
                "INSiteTankID": scmp.INSiteTankID || $scope.tstate.TankID,
                "CustomerID": $rootScope.accSettings.customerId,
                "UniqueID": $scope.tstate.UniqueID,
                "Type": compartment.Type,
                "TankChartID": scmp.TankChartID,
                "ToUOMID": compartment.ToUOMID,
                "VolumeUOM": scmp.VolumeUOM,
                "ReadingSide": scmp.ReadingSide
              });
            }
          }

        } else {

          compartment.CompartmentID = cmp.CompartmentID;
          compartment.INSiteTankID = 0;
          compartment.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
          scmp.ToUOMID = $scope.currentItem.OnCountUOMID || $scope.currentItem.BIUOMID;
          scmp.VolumeUOM = scmp.VolumeUOM;
          if (scmp.ReadingSide == 'P') {
            compartment.PF = scmp.quantity.feet || 0;
            compartment.PI = scmp.quantity.inch || 0;
            compartment.PR = calcFracts(scmp.quantity) || 0;
          } else if (scmp.ReadingSide == 'M' || scmp.ReadingSide == 'E') {
            compartment.MF = scmp.quantity.feet || 0;
            compartment.MI = scmp.quantity.inch || 0;
            compartment.MR = calcFracts(scmp.quantity) || 0;
          } else {
            compartment.SF = scmp.quantity.feet || 0;
            compartment.SI = scmp.quantity.inch || 0;
            compartment.SR = calcFracts(scmp.quantity) || 0;
          }
        }
      })
      reqData.INSiteTankVolumeList.INSiteTankVolume.Compartments.push(compartment);
    })

    if (!$rootScope.isInternet || !$rootScope.online) {
      var tempCompartments = angular.copy($scope.currentTank.Compartments);
      tempCompartments.forEach(function(cmp) {
        cmp.subCompartments.forEach(function(scmp) {
          if (scmp.ReadingSide == 'P') {
            scmp.PF = scmp.quantity.feet || 0;
            scmp.PI = scmp.quantity.inch || 0;
            scmp.PR = calcFracts(scmp.quantity) || 0;
          } else if (scmp.ReadingSide == 'M' || scmp.ReadingSide == 'E') {
            scmp.MF = scmp.quantity.feet || 0;
            scmp.MI = scmp.quantity.inch || 0;
            scmp.MR = calcFracts(scmp.quantity) || 0;
          } else {
            scmp.SF = scmp.quantity.feet || 0;
            scmp.SI = scmp.quantity.inch || 0;
            scmp.SR = calcFracts(scmp.quantity) || 0;
          }
        });
      });
      // reqData.vehicleCompartments = tempCompartments;
    }

    //reqData.INSiteTankVolume.Compartments.push(compartment);
    addOrderService.calcTankReading(reqData, function(data) {
      $scope.INSiteTankVolumeID = data[0].INSiteTankVolumeID;
      $scope.calcQty = data[0].Quantity;
      if (isDone) {
        $scope.gotoOrders();
      }
    })

  }

  $scope.checkCompartmentStatus = function(compartment, cindex) {
    if (cindex == $scope.currentCompartmentIndex) {
      return true;
    } else {
      return (compartment.status == 'finished');
    }
  }


  function getUTCDateTime(dateVal) {
    var d = dateVal.toString();
    var dateTm = moment.parseZone(d).local().format('YYYY-MM-DD HH:mm');
    // add a random dateTm second string.
    dateTm = dateTm + ':' + Math.floor(Math.random() * 60);
    return dateTm;
  }
  $scope.getCompartmentReading = function(compartment) {
    var readingstring = '';
    compartment.subCompartments.forEach(function(cmp) {
      readingstring = readingstring + ' ' + cmp.ReadingSide + ': ' + cmp.quantity;
    })
    return readingstring;
  }
  $scope.checkTankStatus = function() {
    return ($scope.currentEntry.stTankStatus == 'finished')
  }

  $scope.unsetCompartment = function(compartment, showCompartment, index) {
    $scope.currentTank.Compartments.forEach(function(cmp, i) {
      if (cmp.set) {
        if (i != index)
          cmp.set = false;
      }
    })
    if (!compartment.set) {
      compartment.set = true;
      $scope.currentCompartmentIndex = index;

    } else {
      if (index === $scope.currentCompartmentIndex) {
        compartment.set = false;
        $scope.currentCompartmentIndex = -1;
      } else {
        compartment.set = true;
        $scope.currentCompartmentIndex = index;
      }

    }
    compartment.status = 'initial';
    $scope.showQuantity = false;
  }
  $scope.expandCompartment = function(compartmentIndex, cindex, showCompartment) {
    return (compartmentIndex === cindex)
  }

  $scope.setReadingState = function(shipppedQuantity) {
    var prom = $scope.setCompartmentStatus($scope.currentCompartment, $scope.currentTank).then(function(response) {
      $scope.setCompartmentStatus($scope.currentCompartment, $scope.currentTank, applyReadings);
    });
  }

  function applyReadings() {
    if ($scope.tstate.endTank) {
      if (!$scope.currentEntry.TankShipQty) {
        $scope.currentEntry.TankShipQty = 0;
      }
      //allow Negative
      if ($scope.currentItem.AllowNegative == 'Y') {
        if($scope.currentItem.Qty > 0){
          let diff = Math.abs($scope.tstate.endTank.quantityShipped - $scope.tstate.stTank.quantityShipped);
          $scope.currentEntry.TankShipQty = diff;
          $scope.tstate.TankQty = diff;
        }else{
          if($stateParams.tankType === 'Receiving'){
            let diff = $scope.tstate.endTank.quantityShipped - $scope.tstate.stTank.quantityShipped;
            $scope.currentEntry.TankShipQty = diff;
            $scope.tstate.TankQty = diff;
          }else{
            let diff = $scope.tstate.stTank.quantityShipped - $scope.tstate.endTank.quantityShipped;
            $scope.currentEntry.TankShipQty = diff;
            $scope.tstate.TankQty = diff;
          }
        }
      } else {
        let diff = Math.abs($scope.tstate.endTank.quantityShipped - $scope.tstate.stTank.quantityShipped);
        $scope.currentEntry.TankShipQty = diff;
        $scope.tstate.TankQty = diff;
      }

      if ($scope.currentEntry.readBy == 'Tank') {
        //$scope.currentEntry.ShipQty = $scope.currentEntry.TankShipQty;
        checkWeightVol();
      }
      if ($stateParams.tankType === 'Source' && $scope.tstate.endTank && ($scope.currentEntry.Source.length > 0)) {
        $scope.currentEntry.sourceTotalTankQuantity=0;
        angular.forEach($scope.currentEntry.Source, function(val) {
          $scope.currentEntry.sourceTotalTankQuantity += val.TankQty;
        });

        if ($scope.currentEntry.readBy == 'Tank' && !$scope.currentEntry.receivingTotalTankQuantity) {
          $scope.currentEntry.ShipQty = $scope.currentEntry.sourceTotalTankQuantity;
          checkWeightVol();
        }
      }
      if ($stateParams.tankType === 'Receiving' && $scope.tstate.endTank && ($scope.currentEntry.Receiving.length > 0)) {
        $scope.currentEntry.receivingTotalTankQuantity=0; 
        angular.forEach($scope.currentEntry.Receiving, function(val) {
          $scope.currentEntry.receivingTotalTankQuantity += val.TankQty;
        });
        
        if ($scope.currentEntry.readBy == 'Tank') {
          $scope.currentEntry.ShipQty = $scope.currentEntry.receivingTotalTankQuantity;
          checkWeightVol();
        }
      }
    }
    $scope.currentTank.status = 'finished';
    // $scope.currentItem.hideFinishBtn = 0;

    if ($scope.currentItem.AllowNegative != 'Y') {
      if ($scope.currentItem.IsBillable == 'N') {
        if ($stateParams.tankType == 'Source' && $scope.tstate.endTank) {
          //For Source Tank - Start Tank Reading > End Tank Reading
          if (parseInt($scope.tstate.endTank.quantityShipped) >= parseInt($scope.tstate.stTank.quantityShipped)) {
            $scope.tankReadingError = true;
            Notify.pop('error', 'Start Tank Reading should be greater than End Tank Reading', 'e004');
            $scope.tstate.TankQty = 0;
            $scope.currentItem.hideSourceFinishBtn = 1;
            // if ($scope.currentEntry.readBy == 'Tank'){
            //   $scope.currentItem.Deliver.shipWeightQty = $scope.currentEntry.ShipQty;
            //   $scope.currentEntry.ShipQty = null;
            // }
            $scope.currentEntry.tankError = $scope.tankReadingError;
            return false;
          } else { 
            $scope.tankReadingError = false;
            $scope.currentItem.hideSourceFinishBtn = 0;
            $scope.currentItem.posSrcHideFinishBtn = 0;
          }
        }
        if ($stateParams.tankType == 'Receiving' && $scope.tstate.endTank) {
          //For Receiving Tank - Start Tank Reading < End Tank Reading
          if (parseInt($scope.tstate.endTank.quantityShipped) <= parseInt($scope.tstate.stTank.quantityShipped)) {
            $scope.tankReadingError = true;
            Notify.pop('error', 'End Tank Reading should be greater than Start Tank Reading', 'e005');
            $scope.tstate.TankQty = 0;
            $scope.currentItem.hideReceiveFinishBtn = 1;
            // if ($scope.currentEntry.readBy == 'Tank')
            //   $scope.currentEntry.ShipQty = null;
            $scope.currentEntry.tankError = $scope.tankReadingError;
            return false;
          } else { 
            $scope.tankReadingError = false; 
            $scope.currentItem.hideReceiveFinishBtn = 0;
            $scope.currentItem.posRecvHideFinishBtn = 0;
          }
        }
      }
    } else {
      if($scope.currentItem.Qty < 0){

        if($stateParams.tankType == 'Receiving' &&  $scope.tstate.endTank){
          if (parseInt($scope.tstate.stTank.quantityShipped) <= parseInt($scope.tstate.endTank.quantityShipped)) {
            $scope.tankReadingError = true;
            Notify.pop('error', 'Start Reading must be greater than the End Reading', 'e009');
            $scope.currentItem.hideSourceFinishBtn = 1;
            $scope.currentEntry.tankError = $scope.tankReadingError;
            return false;
          }else{
            $scope.tankReadingError = false;
            $scope.currentItem.hideSourceFinishBtn = 0;
            $scope.currentItem.negRecvHideFinishBtn = 0;
          } 
        }

        if($stateParams.tankType == 'Source' &&  $scope.tstate.endTank){
          if (parseInt($scope.tstate.stTank.quantityShipped) >= parseInt($scope.tstate.endTank.quantityShipped)) {
            $scope.tankReadingError = true;
            Notify.pop('error', 'Start Reading must be less than the End Reading', 'e008');
            $scope.currentItem.hideReceiveFinishBtn = 1;
            $scope.currentEntry.tankError = $scope.tankReadingError;
            return false;
          }else{
            $scope.tankReadingError = false;
            $scope.currentItem.hideReceiveFinishBtn = 0;
            $scope.currentItem.negSrcHideFinishBtn = 0;
          }
        }

      }

      if($scope.currentItem.Qty > 0){
        if($stateParams.tankType == 'Source' &&  $scope.tstate.endTank){
          if (parseInt($scope.tstate.stTank.quantityShipped) <= parseInt($scope.tstate.endTank.quantityShipped)) {
            $scope.tankReadingError = true;
            Notify.pop('error', 'Start Reading must be greater than the End Reading', 'e009');
            $scope.currentItem.hideSourceFinishBtn = 1;
            $scope.currentEntry.tankError = $scope.tankReadingError;
            return false;
          }else{
            $scope.tankReadingError = false;
            $scope.currentItem.hideSourceFinishBtn = 0;
            $scope.currentItem.posSrcHideFinishBtn = 0;
          } 
        }

        if($stateParams.tankType == 'Receiving' &&  $scope.tstate.endTank){
          if (parseInt($scope.tstate.stTank.quantityShipped) >= parseInt($scope.tstate.endTank.quantityShipped)) {
            $scope.tankReadingError = true;
            Notify.pop('error', 'Start Reading must be less than the End Reading', 'e020');
            $scope.currentItem.hideReceiveFinishBtn = 1;
            $scope.currentEntry.tankError = $scope.tankReadingError;
            return false;
          }else{
            $scope.tankReadingError = false;
            $scope.currentItem.hideReceiveFinishBtn = 0;
            $scope.currentItem.posRecvHideFinishBtn = 0;
          } 
        }

      }
      $scope.allSubCompartmentsDone = true;
      $scope.allSubCompartmentsDoneError = false;
    }
    $scope.currentEntry.tankError = $scope.tankReadingError;
    $scope.checkTankQty();
    if (!$scope.tankError && !$scope.tankReadingError && $scope.allSubCompartmentsDone) {
      $state.go('shiporder.reading', { tank: null });
    } else if ($scope.currentEntry.tankError) {
      $state.go('shiporder.reading', { tank: null });
    }
  }

  function getSubCompartments(compartments) {
    var promises = [];
    $scope.vehicleCompartments = compartments.data;
    $scope.vehicleCompartments.forEach(function(element) {
      element.ftcontrol = {};
      element.incontrol = {};
      element.fractcontrol = {};
      var promise = addOrderService.getVehicleSubCompartments($scope.order.OrderHdr.Vehicle.VehicleID, element.CompartmentID);
      promises.push(promise.then(function(subCompartments) {
        element.subCompartments = subCompartments.data;
        subCompartments.data.forEach(function(scmp) {
          scmp.quantity = '';
          scmp.maxDepth = parseInt(scmp.DepthFeet) + 0;
        });


        if (subCompartments.data.length == 0) {
          element.subCompartments = [{ ReadingSide: '', quantity: '' }];
        }
      }))
    })
    return $q.all(promises);
  }

  if ($scope.containerType == 'insiteTank') {
    if ($rootScope.selectedSite.SiteType == "F") {
      if ($scope.currentTank.HasTrimCorrections === 'Y')
        $scope.currentTank.showDBS = true;
    } else {
      if (!$scope.currentTank.showDBS)
        $scope.currentTank.showDBS = false;
    }
  } else {
    $scope.currentTank.showDBS = true;
  }
  var calcWeightVol = function(reqData) {
    addOrderService.calcWeightVolumeQty(reqData, function(data) {
      $scope.currentEntry.shipWeightQty = data[0].Qty;
      $rootScope.hideNodeLoader();
    })
  }
  var checkWeightVol = function() {
    var INSiteTankID = 0;
    if ($scope.currentItem.Ship.Source[0] && $scope.currentItem.Ship.Source[0].TankID) {
      INSiteTankID = $scope.currentItem.Ship.Source[0].TankID;
    }else{
      if ($scope.currentItem.Deliver.Source[0] && $scope.currentItem.Deliver.Source[0].TankID)
        INSiteTankID = $scope.currentItem.Deliver.Source[0].TankID;
    }
    var reqData = {
      INSiteTankID: INSiteTankID,
      ProdContID: $scope.currentItem.ProdContID,
      Dttm: $rootScope.getCurrentDateTime('w'),
      FromUOMID: $scope.currentItem.SellByUOMID,
      ToUOMID: $scope.currentItem.OnCountUOMID,
      QtyToCalc: $scope.currentItem.Qty
    }
    reqData.FromUOMID = $scope.currentItem.OnCountUOMID;
    reqData.ToUOMID = $scope.currentItem.SellByUOMID;
    reqData.QtyToCalc = $scope.currentEntry.ShipQty;
    if(reqData.FromUOMID!=reqData.ToUOMID){
      calcWeightVol(reqData);
    }
    
  }
  $scope.goTankBack = function() {
    setTimeout(function() {
      $state.go('tanks');
    }, 0);
  }

  $scope.gotoOrders = function() {
    $state.go('orders');
  }

  // var isFeetMax = {},
  //     isInchMax = {},
  //     maxinch = {},
  //     maxdenom = {};

  // $scope.checkFinalReading = function(cv, unit, subCId) {

  //     // getting the current sub compartment
  //     var currentSubComp = {};
  //     angular.forEach($scope.currentCompartment.subCompartments, function(subCompartment, key){
  //         var thisSubCId = subCompartment.SubCompartmentID != undefined ? subCompartment.SubCompartmentID : 0;
  //         if(thisSubCId == subCId)
  //             currentSubComp = subCompartment;
  //     });

  //     //defining side that is used to set the value to the view
  //     var side = parseInt($scope.currReadingSide || 0);

  //     //appending corresponding values
  //     maxinch[subCId] = parseInt(currentSubComp.MaxInch),
  //         maxdenom[subCId] = parseInt(currentSubComp.MaxDenominator);

  //     //checking max reached and setting true/false flag
  //     if (unit == 'feet') {
  //         if (maxinch[subCId] == null) maxinch[subCId] = 0;
  //         (cv == currentSubComp.maxDepth && (maxinch[subCId] > 0 || maxinch[subCId] != null)) ? isFeetMax[subCId] = true: isFeetMax[subCId] = false;
  //     } else if (unit == 'inch') { // triggers when inch is changed and set max frac
  //         if (maxdenom[subCId] == null) maxdenom[subCId] = 0;
  //         (cv == currentSubComp.MaxInch && (maxdenom[subCId] > 0 || maxdenom[subCId] != null)) ? isInchMax[subCId] = true: isInchMax[subCId] = false;
  //     }

  //     //appyling the values to the view
  //     if (isFeetMax[subCId] && isInchMax[subCId]) {
  //         $scope.currentCompartment.subCompartments[side].maxInchOn = maxinch[subCId];
  //         $scope.currentCompartment.subCompartments[side].maxDenomOn = maxdenom[subCId];
  //     }else if(isFeetMax[subCId]){
  //         $scope.currentCompartment.subCompartments[side].maxInchOn = maxinch[subCId];         
  //         $scope.currentCompartment.subCompartments[side].maxDenomOn = maxinch[subCId] == 0 ? maxdenom[subCId] : null;
  //     }else{
  //         $scope.currentCompartment.subCompartments[side].maxInchOn = null;            
  //         $scope.currentCompartment.subCompartments[side].maxDenomOn = null;
  //     }
  // }

  $scope.resetSide = function() {
    $scope.currReadingSide = 0;
  }

  /* Check draftTemp values between -299 to 299*/
  $scope.checkDraftTemp = function(e) {
    let val = e.target.value;
    if (val) {
      if (val >= 20 && val <= 400) {
        $scope.currentTank.draftTemp = val;
        $scope.tempError = false;
      } else {
        Notify.pop('error', 'Liquid Temperature should be from 20 to 400.', 'e002');
        $scope.tempError = true;
      }
    }
  }
  $scope.checkDraftATemp = function(e) {
    let val = e.target.value;
    if (val) {
      if (val >= -159 && val <= 159) {
        $scope.currentTank.draftATemp = val;
        $scope.tempError = false;
      } else {
        Notify.pop('error', 'Ambient Temperature should be from -159 to 159.', 'e006');
        $scope.tempError = true;
      }
    }
  }
  $scope.$watch('currentTank.draftTemp', function(n, v) {
    if ($scope.tstate.Insulated == 'Y') {
      $scope.currentTank.draftATemp = n;
    }
  });

  $scope.checkTankQty = function(){
    //Check Source/Receiving tankQty is zero
    if($scope.currentEntry.Source.length >=0){
      $scope.currentItem.srcTankGaugedQty = 0;
      angular.forEach($scope.currentEntry.Source, function(val) {
        console.log("SourceVal", val)
        if(val.TankQty === 0){
          $scope.currentItem.srcTankGaugedQty  = 1;
        }
      });
    }

    if($scope.currentEntry.Receiving.length >=0){
      $scope.currentItem.recvTankGaugedQty = 0;
      angular.forEach($scope.currentEntry.Receiving, function(val) {
        console.log("ReceivingVal", val)
        if(val.TankQty === 0){
          $scope.currentItem.recvTankGaugedQty  = 1;
        }
      });
    }

  }

});
