app.controller('meterController', function($scope, $rootScope, $ionicModal, $ionicPopover, $localstorage, addOrderService, ordersListService, appConstants, $stateParams, $state, $ionicHistory, $cordovaCamera, dbService, $timeout, $http, $filter) {
  $scope.meterString = 'Start Meter';
  $rootScope.shipWeightQty=null;
  if ($stateParams.meter) {
    $scope.meter = $stateParams.meter;
    $scope.currentMeter = $stateParams.currentMeter;
    if ($scope.meter == 'endMeter') {
      $scope.tankString = 'End Meter';
    }
    $scope.readingState = 'stMeter';
    if (!$scope.currentMeter[$scope.meter]) {
      $scope.currentMeter[$scope.meter] = {};

      var currentDate = new Date();
      $scope.currentMeter[$scope.meter].datetime = $rootScope.getCurrentDateTime();
    }
    if ($scope.activeAction == 'Ship') {
      $scope.currentItem.Deliver.meterReadings = $scope.currentItem.Ship.meterReadings;
    }
    if (!($scope.currentMeter[$scope.meter].datetime instanceof Date)) {
      $scope.currentMeter[$scope.meter].datetime = new Date($scope.currentMeter[$scope.meter].datetime);
    }
  }
  if (!window.cordova) {
    $scope.imgURI = 'http://www.firestream.com/wp-content/themes/FireStreamWW2016/images/logo_6.png';
  }
  if (!$scope.currentMeter.mid) {
    $scope.currentMeter.mid = Math.floor(Math.random() * (999999 - 100000) + 100000)
  }
  $scope.setMeterState = function(fromMeter) {
    $scope.currentMeter[$scope.meter].status = 'finished';
    if ($scope.meter == 'endMeter') {
      if ($scope.currentMeter.stMeter.reading > $scope.currentMeter.endMeter.reading) {
        var temp = 0;
        temp = $scope.currentMeter.stMeter.reading;
        $scope.currentMeter.stMeter.reading = $scope.currentMeter.endMeter.reading;
        $scope.currentMeter.endMeter.reading = temp;
      }
      $scope.shipping.shippingString = 'Metered Shipping Complete';
      var endTime = moment($scope.currentMeter.endMeter.datetime);
      var stTime = moment($scope.currentMeter.stMeter.datetime);
      var diff = moment.duration(endTime.diff(stTime)).asMilliseconds();
      $scope.shipping.timeDiff = humanizeDuration(diff);
      $scope.currentEntry.ShipQty = 0;
      $scope.currentEntry.meterReadings.forEach(function(mreading) {
        if (mreading.stMeter && mreading.endMeter)
          $scope.currentEntry.ShipQty = $scope.currentEntry.ShipQty + Math.abs((mreading.endMeter.reading - mreading.stMeter.reading));
      })
      if ($scope.currentMeter.ticketNumber != '' && $scope.currentMeter.ticketNumber != undefined) {
        $scope.order.OrderHdr.ticketNumber = $scope.currentMeter.ticketNumber;
      } else {
        $scope.order.OrderHdr.ticketNumber = '';
        $scope.currentMeter.ticketNumber = '';
      }
      $scope.uploadMeterTicket();
    }

    $state.go('shiporder.reading', { meter: null });
  }

  $scope.meterLabel = {};
  $scope.Math = window.Math;
  $scope.checkMeterStatus = function(meter) {
    if (meter.stMeter.reading != undefined && meter.endMeter.reading != undefined) {
      if (parseFloat(meter.stMeter.reading) > parseFloat(meter.endMeter.reading)) {
        // $scope.meterLabel.stMeter = "End Meter";
        // $scope.meterLabel.endMeter = "Start Meter";
        // $scope.meterLabel.tNumber = "Ticket Number";
        var tmp = meter.endMeter.reading;
        meter.endMeter.reading = meter.stMeter.reading;
        meter.stMeter.reading = tmp;
      } else {
        // $scope.meterLabel.endMeter = "End Meter";
        // $scope.meterLabel.stMeter = "Start Meter";
        // $scope.meterLabel.tNumber = "Ticket Number";
      }
    }
  }

  $scope.uploadMeterTicket = function() {
    var vessel, location, transfer;
    if ($scope.activeAction == 'Ship') {
      vessel = $scope.order.OrderHdr.Vehicle.Code;
      transfer = $scope.order.OrderHdr.INSiteCode;
      location = $scope.order.OrderHdr.INSiteAddress;
    } else {
      //Vessel Conditions
      if (!($scope.order.OrderHdr.InternalTransferOrder == 'Y')) {
        vessel =
          $scope.order.OrderHdr.Vessels[0].dfVesselCode ||
          $scope.currentEntry.vessel.VesselCode;
      } else if ($scope.order.OrderHdr.InternalTransferOrder == 'Y' && $scope.general.Vehicle.EnforceShipmentMarineApp === 'Y') {
        vessel = $scope.order.OrderHdr.Vehicle.Code;
      } else {
        vessel = $scope.order.OrderHdr.ToSiteCode;
      }

      //Transfer Conditions
      if ($scope.general.Vehicle.EnforceShipmentMarineApp === 'Y' && $scope.general.InternalTransferOrder == 'N') {
        transfer = $scope.order.OrderHdr.Vehicle.Code
      } else if ($scope.general.Vehicle.EnforceShipmentMarineApp === 'Y' && $scope.general.InternalTransferOrder == 'Y') {
        transfer = $scope.order.OrderHdr.ToSiteCode
      } else {
        transfer = $scope.order.OrderHdr.INSiteCode
      }

      //Location Conditions
      if ($scope.general.InternalTransferOrder == 'N') {
        if ($scope.general.Vehicle.EnforceShipmentMarineApp === 'Y') {
          location = $scope.order.OrderHdr.Destination.Code
        } else {
          location = $scope.order.OrderHdr.INSiteAddress;
        }
      } else {
        if (!$scope.general.Destination) {
          location = $scope.general.ToSiteAddress;
        } else {
          location = $scope.general.Destination.Code;
        }
      }

    }
    var meteredQty = Math.abs($scope.currentMeter.stMeter.reading - $scope.currentMeter.endMeter.reading).toString();
    var currentDate = $rootScope.getCurrentDateTime();
    $scope.currDate = moment(currentDate).format("YYYY-MM-DD");
    $scope.currHours = moment(currentDate).format("HH-mm-A");
    $scope.currDT = $scope.currDate + '_' + $scope.currHours;
    $scope.orderType = ($scope.activeAction == 'Ship') ? 'Ship' : 'Deliver';
    var tNumber = ($scope.currentMeter.ticketNumber) ? '_' + $scope.currentMeter.ticketNumber : '';
    $scope.ticketName = $scope.orderType + '_' + $scope.order.OrderHdr.OrderNo + tNumber;

    var url = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.ticketName + '_' + $scope.currDT + '_METER_TICKET.pdf';
    var thumbUrl = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.ticketName + '_' + $scope.currDT + '_METER_TICKET_THUMBNAIL.png';
    var localFilePath = $rootScope.DevicePath + $scope.order.OrderHdr.OrderNo + '/';
    var offlineUrl = localFilePath + $scope.ticketName + '_' + $scope.currDT + '_METER_TICKET.pdf';
    var offlineThumb = localFilePath + $scope.ticketName + '_' + $scope.currDT + '_METER_TICKET_THUMBNAIL.png';
    $scope.qtyLabel = $scope.currentItem.OnCountUOM || $scope.currentItem.BIUOM;
    var reqData = {
      "MeterTicketData": [{
        "OrderNo": $scope.order.OrderHdr.OrderNo,
        "SysTrxNo": $scope.currentItem.SysTrxNo,
        "SysTrxLine": $scope.currentItem.SysTrxLine,
        "startMeter": $scope.currentMeter.stMeter.reading,
        "endMeter": $scope.currentMeter.endMeter.reading,
        "vessel": $filter('escape')(vessel),
        "transfer": $filter('escape')(transfer),
        "location": $filter('escape')(location),
        "mQnty": meteredQty,
        "mImage": $scope.imgURI,
        "MeterImage": $scope.imgURI || "ABC",
        "DeviceTime": $rootScope.getCurrentDateTime(),
        "CustomerID": appConstants.customerId,
        "AttachmentNumber": $scope.currentMeter.ticketNumber,
        "UserID": $rootScope.loginData.uname,
        "ticketName": $filter('escape')($scope.ticketName),
        "dTime": $scope.currDT,
        "MeterTicketID": $scope.currentMeter.mid,
        "CompanyID": $rootScope.CompanyID,
        "offlineUrl": offlineUrl,
        "offlineThumb": offlineThumb,
        "meterQtyLbl": $scope.qtyLabel,
        "itemNotes": $scope.currentItem.Notes,
        "itemCode": $scope.currentItem.Code,
        "itemDescr": $scope.currentItem.Descr 
      }]
    }; 

    var config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
      },
      timeout: 20000
    };
    var data = {
      url: appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postMeterTicket + "?" + appConstants.dreamFactoryApiKeySet,
      requestData: reqData,
      OrderNo: $scope.order.OrderHdr.OrderNo,
      itemId: $stateParams.itemId,
      env: appConstants.env,
      type: "MT"
    };
    /* Offline Activity Logs */
    if (!$rootScope.isInternet || !$rootScope.online) {
      var formActivityData = {};
      formActivityData.DtTm = moment(currentDate).format("YYYY-MM-DD HH:mm");
      formActivityData.ID = 1;
      formActivityData.Type = $scope.ticketName + '_METER_TICKET.pdf';
      formActivityData.UserID = $rootScope.loginData.uname;
      if ($scope.order.OrderHdr.OrderActivityLogs)
        $scope.order.OrderHdr.OrderActivityLogs.push(formActivityData);
    }


    $scope.newDoc = {};
    $scope.attachedDocument = [];
    $scope.newDoc.OrderNo = $scope.order.OrderHdr.OrderNo;
    $scope.newDoc.SysTrxNo = $scope.order.OrderHdr.SysTrxNo;
    $scope.newDoc.dataURL = url;
    $scope.newDoc.dataThumb = thumbUrl;
    $scope.newDoc.offlineUrl = offlineUrl;
    $scope.newDoc.offlineThumb = offlineThumb;
    $scope.newDoc.id = Math.floor(Math.random() * (999999 - 100000) + 100000);
    $scope.newDoc.dateTime = new Date();
    $scope.newDoc.type = "P";
    $scope.newDoc.name = $scope.ticketName + '_' + $scope.currDT + '-Meter Ticket';
    $scope.newDoc.MeterTicketID = $scope.currentMeter.mid
    $scope.attachedDocument.push($scope.newDoc);
    if ($scope.order.OrderHdr.OrderAttachment == undefined) {
      $scope.order.OrderHdr.OrderAttachment = $scope.attachedDocument;
    } else {
      $scope.order.OrderHdr.OrderAttachment.forEach(function(attachement, idx) {
        if ($scope.newDoc.MeterTicketID == attachement.MeterTicketID) {
          $scope.order.OrderHdr.OrderAttachment.splice(idx, 1);
        }
      })
      $scope.order.OrderHdr.OrderAttachment = $scope.order.OrderHdr.OrderAttachment.concat($scope.attachedDocument);
    }

    $rootScope.showNodeLoader();
    $http.post(appConstants.nodeURL + 'meterTicket', data, config)
      .success(function(res) {

        if ($scope.currentItem.SellByUOMID != $scope.currentItem.OnCountUOMID) {
          if ($scope.currentItem.Ship)
            checkWeightVol();
        } else {
          $rootScope.hideNodeLoader();
        }

      })
      .error(function(err) {
        //Offline WeightVolume calculate
        if ($scope.currentItem.SellByUOMID != $scope.currentItem.OnCountUOMID) {
          if ($scope.currentItem.Ship)
            checkWeightVol();
        }
        $rootScope.hideNodeLoader();
        $rootScope.showToastMessage('ERR - Meter Ticket - Attachment not added');
        console.log('err', err);
      });


  }

  function getBase64Image(imgElem) {
    if (imgElem) {
      return imgElem.replace(/^data:image\/(png|jpg);base64,/, "")
    } else {
      return false;
    }

  }


  (function() {
    $timeout(function() {
      if ($scope.currentMeter.imgId) {
        $rootScope.loading = true;
        dbo.selectTable('DataMaster', "id=?", [$scope.currentMeter.imgId], function(results) {
          $rootScope.loading = false;
          $scope.imgURI = "data:image/jpg;base64," + results.data.rows[0].data;
          $scope.$apply();
        });
      }
    }, 500);
  })();
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
    calcWeightVol(reqData);
  }
  $scope.takePicture = function() {
    $scope.userOnline = $rootScope.online;
    dbo.createTable('DataMaster', ['id INTEGER PRIMARY KEY', 'orderNo', 'SysTrxNo UNIQUE', 'data', 'type']);

    var options = {
      quality: 70,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      popoverOptions: CameraPopoverOptions,
      targetWidth: 800,
      targetHeight: 800,
      saveToPhotoAlbum: false
    };

    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.imgURI = "data:image/jpg;base64," + imageData;
      dbService.upsertData($scope.currentMeter.imgId, $scope.order.OrderHdr.OrderNo, $scope.order.OrderHdr.SysTrxNo, imageData, 'MT', function(val) {
        if (val) {
          $scope.currentMeter.imgId = val;
        }
        setTimeout(function() {
          $rootScope.online = $scope.userOnline;
        }, 30);
      });

    }, function(err) {});
  }

});