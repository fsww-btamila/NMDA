app.controller('shipOrderController', function($ionicPlatform, $scope, $rootScope, $ionicModal, $ionicPopover, $localstorage, addOrderService, ordersListService, getAllSiteService, dbService, $stateParams, $state, $ionicHistory, $q, $ionicPopup, OrderList, $timeout, Notify, $window, $filter) {
  $scope.pageTitle = 'Ship Order';
  $scope.numericIn = {};
  $scope.numericIn.quantity = '';
  $scope.finishText = "En Route";
  $scope.appState = "Ship";
  $scope.valInit = true;
  $scope.settings = {};
  $scope.settings.showOptions = true;
  $scope.doiVessels = [];

  function shipTag() {

  }

  $scope.__tag = new shipTag();
  $scope.test = function(val) {
    $scope.valInit = val;
  }
  //  $scope.isBulk = function(){
  //  var bulk;
  //   angular.forEach($scope.itemList, function(item) {
  //   if (item.IsPackaged == 'N') {
  //     bulk = true;
  //   }
  //   if(item.IsBillable=='Y'){
  //     if(item.BIUOM!='Gallons'){
  //       bulk = false;
  //     }
  //   }
  // })
  //   return bulk;
  // }
  $scope.isBulk = function() {
    //try to determine if entire order is Bulk
    var orderBulk
    var bulk;
    angular.forEach($scope.itemList, function(item) {
      if (item.IsPackaged == 'N') {
        bulk = true;
      }
      if (item.IsBillable == 'Y') {
        if (item.BIUOM != 'Gallons') {
          bulk = false;
        }
      }
      if (item.IsBulk == 'Y') {
        bulk = true;
      }
      if (bulk) {
        orderBulk = true;
      }
    })
    return orderBulk;
  }

  $scope.errorObj = {};
  $scope.handleSwipe = function(e) {
    $scope.cancelBtnHide = true;
    $scope.orderItemLength = $scope.order.OrderItems.length;
    var cnt = 0;
    $scope.cancelCnt = 0;
    for (var i = 0; i < $scope.orderItemLength; i++) {
      if ($scope.order.OrderItems[i].cancelDelivery == true) {
        cnt++;
        $scope.cancelCnt++;
      }
    }
    if (cnt && ($scope.orderItemLength - 1) == cnt) {
      $scope.cancelBtnHide = false;
    }
    if ($scope.currentItem.IsPackaged !== 'Y') {
      if ($scope.currentItem.IsBillable == 'Y' && $scope.currentItem.BIUOM == 'Each') {
        //$scope.unsetPkg();
        $scope.isBiuom = true;
        $scope.cancelShipmentModal.show();
      } else {
        $scope.isBiuom = false;
        $scope.cancelShipmentModal.show();
      }

    } else {
      // $scope.unsetPkg();
      $scope.isBiuom = true;
      $scope.cancelShipmentModal.show();
    }
    if ($scope.currentItem.cancelDelivery == true) {
      $scope.unCancellItem = true;
      $scope.cancelShipmentModal.show();
    } else {
      $scope.unCancellItem = false;
    }
  }
  $scope.handleDecline = function() {
    $scope.currentEntry.hideBack = false;
    $scope.deleteDoiData();
    $scope.currentEntry.status = 'initial';
    $scope.currentEntry.overallStatus = 'initial';
    $scope.routeItem();
  }
  $scope.deleteDoiData = function() {
    var shipId = '';
    if ($scope.order.activeAction == 'Ship') {
      shipId = $scope.order.OrderHdr.VehicleID
    } else if ($scope.order.activeAction == 'Deliver') {
      if ($scope.order.OrderHdr.InternalTransferOrder == "N") {
        shipId = $scope.currentEntry.vessel.VesselID;
      }
    }
    dbo.deleteTableData('DoiMaster', "SysTrxNo=? AND shipId=? AND itemId=?", [$scope.order.OrderHdr.SysTrxNo, shipId, $scope.currentItem.MasterProdID]);
  }
  /* HandleCancellation */
  $scope.handleCancellation = function() {
    var proName = ($scope.activeAction == 'Ship') ? 'shipment' : 'delivery';
    var title = "";
    if ($scope.cancelBtnHide) {
      title = "Are you sure you want to cancel " + proName + " of item?";
    } else {
      title = "Are you sure you want to cancel entire Order?";
    }
    $ionicPopup.confirm({
      title: 'Cancel Order',
      template: title,
      cssClass: 'modal-backdrop',
      okText: 'Yes',
      cancelText: 'No'
    }).then(function(res) {
      if (res) {
        $scope.cancelShipmentModal.hide();
        $rootScope.loading = true;
        var SysTrxNo = $scope.order.OrderHdr.SysTrxNo;
        var odrStsCode = $scope.order.OrderHdr.StatusCode;
        var userId = $rootScope.uid;
        if ($scope.orderItemLength == 1) {
          $scope.updateCancellOrders(SysTrxNo, odrStsCode, userId);
        } else {
          if ($scope.cancelBtnHide) {
            $scope.currentItem.cancelDelivery = true;
            $scope.setItemFinished();
            $scope.activeView = 'cancelled';
            $scope.currentItem.Notes = $scope.getCurrentString() + " was cancelled";
            $scope.currentItem.showCancel = false;
            $scope.currentItem.Ship.ShipQty = 0;
            $scope.currentItem.Deliver.ShipQty = 0;
            $scope.saveOrder(function() {
              $state.go('shiporder.canceldelivery');
            });
          } else {
            $scope.updateCancellOrders(SysTrxNo, odrStsCode, userId);
          }
        }
        $scope.clearDlSign();
      }
    })
  }
  /* ReprocessItem item */
  $scope.reprocessItem = function() {
    $ionicPopup.confirm({
      title: 'Reprocess Item!',
      template: "Are you sure you want to reprocess?",
      cssClass: 'modal-backdrop',
      okText: 'Yes',
      cancelText: 'No'
    }).then(function(res) {
      if (res) {
        for (var variableKey in $scope.currentEntry) {
          if ($scope.currentEntry.hasOwnProperty(variableKey)) {
            if (variableKey != 'vessel' && variableKey != 'doiMarker')
              delete $scope.currentEntry[variableKey];
          }
        }
        $scope.currentEntry.status = 'initial';
        $scope.currentEntry.overallStatus = 'initial';
        $scope.currentEntry.Source = [];
        $scope.currentEntry.Receiving = [];
        if ($scope.activeAction == 'Ship') {
          $scope.currentEntry.meterReadings = [{}];
        } else {
          if ($scope.currentItem.Ship.meterReadings && $scope.currentItem.Ship.meterReadings.length > 0 && $scope.currentItem.Ship.meterReadings[0].mid) {
            $scope.currentEntry.meterReadings = $scope.currentItem.Ship.meterReadings;
          } else {
            $scope.currentEntry.meterReadings = [{}]
          }
        }
        $scope.currentEntry.statusList = ['initial', 'inprogress', 'finished'];
        $scope.order.doiCompleted = false;
        $scope.order.hideDoiButton = false;
        if ($scope.activeAction == 'Deliver') {
          $scope.order.ClearDeliveryTicketSign = true;
        }
        $scope.saveOrder(function() {
          $scope.routeItem();
        });
        $scope.currentItem.showCancel = false;
        $rootScope.shipWeightQty=null;
        $scope.currentItem.hideSourceFinishBtn = 0;
        $scope.currentItem.hideReceiveFinishBtn = 0;
        $scope.currentItem.srcTankGaugedQty = 0;
        $scope.currentItem.recvTankGaugedQty = 0;
        $scope.currentItem.posSrcHideFinishBtn = 0;
        $scope.currentItem.posRecvHideFinishBtn = 0;
        $scope.currentItem.negSrcHideFinishBtn = 0;
        $scope.currentItem.negRecvHideFinishBtn = 0;
        $scope.clearDlSign();
      }
    })
  }
  /* un cancelled item */
  $scope.handleUnCancellation = function() {
    $ionicPopup.confirm({
      title: 'Undo Cancellation of Item!',
      template: "Are you sure you want to undo cancellation of item?",
      cssClass: 'modal-backdrop',
      okText: 'Yes',
      cancelText: 'No'
    }).then(function(res) {
      if (res) {
        $scope.cancelShipmentModal.hide();
        for (var variableKey in $scope.currentEntry) {
          if ($scope.currentEntry.hasOwnProperty(variableKey)) {
            if (variableKey != 'vessel' && variableKey != 'doiMarker')
              delete $scope.currentEntry[variableKey];
          }
        }
        $scope.currentEntry.status = 'initial';
        $scope.currentEntry.overallStatus = 'initial';
        $scope.currentEntry.Source = [];
        $scope.currentEntry.Receiving = [];
        if ($scope.activeAction == 'Ship') {
          $scope.currentEntry.meterReadings = [{}];
        } else {
          $scope.currentEntry.meterReadings = $scope.currentItem.Ship.meterReadings;
        }
        $scope.currentEntry.statusList = ['initial', 'inprogress', 'finished'];
        $scope.saveOrder(function() {
          $scope.routeItem();
        });
        $scope.unCancellItem = false;
        $scope.currentItem.showCancel = false;
        $scope.currentItem.cancelDelivery = false;
        $scope.clearDlSign();
      }
    })
  }
  /*Update cancel orders service and local sqllite*/
  var deferred = $q.defer();
  $scope.updateCancellOrders = function(SysTrxNo, odrStsCode, userId) {
    dbo.deleteTableData('DoiMaster', "SysTrxNo=?", [SysTrxNo]);
    dbo.deleteTableData('OrdersMaster', "SysTrxNo=?", [SysTrxNo], function(tx, res) {
      deferred.resolve();
    });
    addOrderService.CancellOrder(SysTrxNo, odrStsCode, userId).then(function(response) {
      if (response.status == 200) {
        $state.go('orders');
      }
    });
  }
  $scope.getCurrentString = function() {
    if ($scope.activeAction == 'Ship') {
      return 'Shipping';
    } else
      return 'Delivery';
  }
  $scope.getCurrentAction = function() {
    if ($scope.activeAction == 'Ship') {
      return 'Shipped';
    } else
      return 'Delivered';
  }
  $scope.wheelOptions = {};
  $scope.wheelOptions.nums = [{ label: '0', value: '0' }, { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '0', value: '0' }];
  $scope.wheelOptions.fracts = [{ label: '0', value: '0' }, { label: '1/8', value: '1/8' }, { label: '1/4', value: '1/4' }, { label: '3/8', value: '3/8' }, { label: '1/2', value: '1/2' }, { label: '5/8', value: '5/8' }, { label: '3/4', value: '3/4' }]
  $scope.wheelOptions.mainUnit = "'";
  $scope.wheelOptions.subUnit = "''";

  $scope.enableDOI = true;
  var d = new Date().toString();
  $scope.gotoHeader = function() {
    var orderTemp = { "Orders": $scope.order };
    $scope.order.OrderHdrData = $rootScope.formOrderHeaderJson(orderTemp.Orders.OrderHdr);
    dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [$scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), $scope.order.OrderHdr.SysTrxNo], function() {
      $state.go('addorder', { 'order': $scope.order.OrderHdr.OrderNo, 'systrxno': $scope.order.OrderHdr.SysTrxNo });
    });

  }



  $scope.routeItem = function() {
    $rootScope.loading = false;
    if ($scope.enableDOI) {
      if ($scope.activeAction == 'Deliver' && !$scope.order.doiCompleted && $scope.isBulk()) {
        $scope.doiText = 'DOI';
      } else {
        $scope.doiText = '';
      }
    }
    _.each($scope.itemList, function(data, idx) {
      if (_.isEqual(data, $scope.currentItem)) {
        setTimeout(function() {
          $scope.itemList.move(idx, 0);
        }, 0);
      }
    });
    $scope.numericIn.quantity = '';
    $scope.numericIn.quantity = $scope.currentEntry.quantityShipped || '';
    if ($scope.currentItem.IsPackaged == 'Y' && $scope.currentItem.IsBulk != 'Y') {
      $scope.activeView = 'packaged';
      $state.go('shiporder.packaged', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
    } else if ($scope.currentItem.IsBillable == 'Y' && ($scope.currentItem.status == 'initial' || $scope.currentItem.BIUOM == 'Each' || $scope.currentItem.Deliver.readBy == 'DirectBilling')) {
      if ($scope.currentItem.BIUOM != 'Each' && $scope.currentItem.Deliver.readBy != 'DirectBilling') {
        $scope.activeView = 'bulk';
        $state.go('shiporder.bulk', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      } else {
        $scope.activeView = 'billing';
        $state.go('shiporder.billing', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      }
    } else if (!$scope.order.skipDOIStart && $scope.enableDOI) {
      $scope.activeView = 'doi';
      $state.go('shiporder.doi', { isDoiComplete: null, itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
    } else if ($scope.currentItem.cancelDelivery) {
      $scope.activeView = 'cancelled';
      $state.go('shiporder.canceldelivery');
    } else {
      if (!$scope.order.skipDOIStart && $scope.enableDOI) {
        $scope.activeView = 'doi';
        $state.go('shiporder.doi', { isDoiComplete: null, itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      } else if ($scope.currentEntry.status == 'doi' && $scope.IsPackaged == 'N') {
        $scope.activeView = 'bulk';
        $state.go('shiporder.bulk', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      }
      // else if ($scope.currentEntry.status == 'doi') {
      //       var isDoiShown;
      //       var shipId;
      //       if ($scope.activeAction == 'Ship') {
      //           shipId = $scope.order.OrderHdr.VehicleID;
      //           if ($scope.order.shippingVessels.indexOf(shipId) == -1) {
      //               isDoiShown = true;
      //           }
      //       } else {
      //           if ($scope.currentEntry.vessel && $scope.currentEntry.vessel.VesselID) {
      //               shipId = $scope.currentEntry.vessel.VesselID;
      //           } else {
      //               shipId = $scope.order.OrderHdr.VehicleID;
      //           }
      //           if ($scope.order.deliveryVessels.indexOf(shipId) == -1) {
      //               isDoiShown = true;
      //           }
      //       }
      //       if (isDoiShown || $scope.currentEntry.doiMarker) {
      //           $scope.activeView = 'doi';
      //           $state.go('shiporder.doi', { isDoiComplete: null, itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      //       } else {
      //           $scope.activeView = 'reading';
      //           $state.go('shiporder.reading', { itemId: $scope.currentItem.MasterProdID, tank: null, uniqueId: Math.random() });
      //       }
      //   }
      else if($scope.currentEntry.status == 'reading' && $scope.currentItem.IsPackaged == 'Y' && $scope.currentItem.IsBulk == 'Y' ){
        $scope.currentEntry.overallStatus = 'initial';
        $scope.activeView = 'packaged';
        $state.go('shiporder.packaged', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      }
      else if ($scope.currentEntry.status == 'reading' || $scope.currentEntry.status == 'doi') {
        $scope.activeView = 'reading';
        $state.go('shiporder.reading', { itemId: $scope.currentItem.MasterProdID, tank: null, uniqueId: Math.random() });
      } 
      else if ($scope.currentEntry.status == 'partially delivered' || $scope.currentEntry.status == 'summaryChange') {
        $scope.activeView = 'summary';
        $state.go('shiporder.summary', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      } else {
        if ($scope.currentEntry.status == 'finalSign' || $scope.currentEntry.status == 'finished') {
          if ($scope.currentItem.doiEnder || $scope.order.newDoiActive) {
            $scope.activeView = 'doi';
            $state.go('shiporder.doi', { isDoiComplete: true, itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() })
          } else {
            if ($scope.currentItem.IsPackaged === 'Y') {
              $scope.activeView = 'packaged';
              $state.go('shiporder.packaged', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
            } else {
              $scope.activeView = 'reading';
              $state.go('shiporder.reading', { itemId: $scope.currentItem.MasterProdID, tank: null });
            }

          }

        } else if ($scope.currentItem.IsPackaged == 'Y') {
          $scope.activeView = 'packaged';
          $state.go('shiporder.packaged', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
        } else {
          $scope.activeView = 'bulk';
          $state.go('shiporder.bulk', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
        }
      }
    }
  }


  if (OrderList) {
    $scope.order = OrderList.Orders;
    $scope.activeAction = $scope.order.activeAction;
    $scope.itemList = $scope.order.OrderItems;
    $scope.general = $scope.order.OrderHdr;
    $scope.enableShipping = true;
    $scope.enableDelivery = true;
    $scope.enableHighlight = true;
    if ($scope.order.OrderHdr.AllowDOI == 'N' || $scope.order.OrderHdr.AllowDOIShipTo == 'N' || $rootScope.EnableElectronicDOI == 'N' || !$scope.isBulk()) {
      $scope.enableDOI = false;
    }

    if ($scope.enableDOI) {
      if ($scope.isBulk()) {
        if ($scope.general.Vehicle.EnforceShipmentMarineApp == 'N' && $scope.order.OrderHdr.InternalTransferOrder === 'N') {
          // $scope.order.transferDetails['Delivering'].name = $rootScope.loginData.uname;
          // $scope.order.shiftDetails[$scope.activeAction].Delivering[0] = $scope.order.transferDetails.Delivering;

          $scope.order.transferDetails['Delivering'].name = $rootScope.loginData.uname;
          var shiftLen = $scope.order.shiftDetails[$scope.activeAction].Delivering.length - 1;
          $scope.order.shiftDetails[$scope.activeAction].Delivering[shiftLen] = $scope.order.transferDetails.Delivering;
        }
      }
    }

    $rootScope.transferDetails = $scope.order.transferDetails;
    $scope.bulkItemList = _.filter($scope.itemList, function(item) {
      if ($scope.activeAction == 'Ship') {
        if (item.IsPackaged === 'N' && item.IsBillable === 'N') {
          return true;
        } else {
          return item.IsBulk === 'Y';
        }
        // return (item.IsBillable === 'N' && item.IsPackaged === 'N' );
      } else {
        if (item.IsBillable === 'N') {
          if (item.IsPackaged === 'N') {
            return true;
          } else {
            return item.IsBulk === 'Y';
          }
        } else {
          return (item.BIUOM != 'Each')
        }

      }
    });
    $scope.header = $scope.order.OrderHdr;
    if ($scope.header.Status != "Open" && $scope.header.Status != "Shipping in Progress") {
      setTimeout(function() {
        $("ol.cd-breadcrumb").animate({ scrollLeft: $("ol.cd-breadcrumb").width() }, 1000);
      }, 1000);
    }
    if (!$scope.sourceTanks);
    $scope.sourceTanks = [];
    if ($stateParams.item) {
      for (var i = 0; i < $scope.itemList.length; i++) {
        if ($scope.itemList[i].MasterProdID == $stateParams.item.MasterProdID && $scope.itemList[i].SysTrxLine == $stateParams.item.SysTrxLine) {
          $scope.currentItem = $scope.itemList[i];
          $scope.currentEntry = $scope.currentItem[$scope.activeAction];
        }
      }
    } else {
      $scope.currentItem = $scope.itemList[0];
      $scope.currentEntry = $scope.currentItem[$scope.activeAction];
    }

    if ($scope.activeAction == 'Deliver') {
      $scope.showBilling = true;
      $scope.activeString = "Delivery";
      if ($scope.order.OrderHdr.Status == 'Delivered') {
        $scope.finishText = "Sign";
        if ($scope.order.signedOrder) {
          $scope.finishText = "View Delivery Ticket"
        }
        $scope.pageTitle = "Review";
      } else {
        $scope.pageTitle = 'Deliver Order';
        $scope.finishText = "Finish";
      }
    } else {
      $scope.activeString = "Shipping";
    }
    $scope.routeItem();

  } else {
    $scope.order = $localstorage.getObject('orders')['92976'].Orders;
    $scope.itemList = $scope.order.OrderItems;
    $scope.enableShipping = true;
    $scope.enableHighlight = true;
    $scope.currentItem = $scope.order.OrderItems[0];
    $scope.routeItem();
  }

  $ionicModal.fromTemplateUrl('meterExceptionModal.html', {
    scope: $scope,
    animation: 'none',

  }).then(function(modal) {
    $scope.meModal = modal;
  });
  $ionicModal.fromTemplateUrl('cancelShipmentModal.html', {
    scope: $scope,
    animation: 'none',

  }).then(function(modal) {
    $scope.cancelShipmentModal = modal;
  });
  if (!$scope.order.overallStatus)
    $scope.order.overallStatus = 'inprogress';
  $ionicModal.fromTemplateUrl('addVesselModal.html', {
    scope: $scope,
    animation: 'none',

  }).then(function(modal) {
    $scope.vesselmodal = modal;
  });
  $ionicModal.fromTemplateUrl('orderVesselModal.html', {
    scope: $scope,
    animation: 'none',
  }).then(function(modal) {
    $scope.ordervesselmodal = modal;
  });
  $ionicModal.fromTemplateUrl('addVehicleModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.vehiclemodal = modal;
  });

  $ionicModal.fromTemplateUrl('addInsiteModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.insitemodal = modal;
  });
  $scope.addVehicle = function(vehicle) {
    $scope.order.OrderHdr.Vehicle = angular.copy(vehicle);
  }
  $scope.orderVessels = $scope.order.OrderHdr.Vessels;

  var loadVehicles = function() {
    addOrderService.getVehicles(function(vehicles) {
      $scope.vehicles = vehicles;
    })
  }
  //loadVehicles();
  $scope.addVessel = function(vessel) {
    $scope.currentEntry.vessel = vessel;
    if ($scope.order.deliveryCodes.indexOf($scope.currentEntry.vessel.VesselCode) == -1)
      $scope.order.deliveryCodes.push($scope.currentEntry.vessel.VesselCode);
    $scope.closeModal('vesselmodal');

  }
  $scope.openModal = function(name) {
    $scope[name].show()
  };
  $scope.closeModal = function(name) {
    if (name === 'file') {
      $scope.filePickerModal.hide();
    } else {
      $scope[name].hide();
    }
  };
  $scope.goBack = function() {
    $ionicHistory.goBack();
  }
  $scope.vessels = [];
  $scope.moreVessels = true;
  $scope.vslSearch = { "searchText": "" };
  var searchVesselParams = { 'MinRecord': 1, 'MaxRecord': 20, 'SearchText': "" };

  $scope.clearLazyParams = function() {
    searchVesselParams = { 'MinRecord': 1, 'MaxRecord': 20, 'SearchText': "" };
  }
  $scope.loadMoreVessels = function() {
    searchVesselParams = { 'MinRecord': searchVesselParams.MinRecord + 20, 'MaxRecord': searchVesselParams.MaxRecord + 20, 'SearchText': "" }
    $scope.loadVessels();
  }

  $scope.notOnList = false;
  $scope.loadSearchVessels = function(newSearch) {
    $scope.vessels = [];
    var searchVesselText = $scope.vslSearch.searchText;
    if (searchVesselText == newSearch) {
      searchVesselParams.SearchText = newSearch;
      addOrderService.getVessels(searchVesselParams, function(vessels) {
        $scope.vessels = vessels;
      });
    }
  };
  $scope.$watch('vslSearch', function(newVal, oldVal) {
    if (newVal != oldVal && (newVal.searchText.length == 0 || newVal.searchText.length > 2)) {
      (function(st) {
        if (st) {
          $scope.$broadcast('scroll.infiniteScrollComplete');
          $scope.moreVessels = false;
        } else {
          $scope.moreVessels = true;
          $scope.clearLazyParams();
        }
        setTimeout(function() {
          $scope.loadSearchVessels(st);
        }, 1000)
      })(newVal.searchText)

    }
  }, true);
  $scope.setVesselType = function(type) {
    $scope.vesselType = type;
    $scope.newvessel = {};
    $scope.newvessel.name = $scope.vslSearch.searchText;
  }
  $scope.createVessel = function(vessel) {
    if (vessel.name != undefined) {
      addOrderService.postAdHocVessel(vessel.name, vessel.grosstonnage, vessel.imo).then(function(response) {
        if (response.data[0].StatusNew == "Success") {
          var vsl = { VesselID: Math.floor(Math.random() * 90000) + 10000, VesselCode: vessel.name, IMO: vessel.imo, GrossTonnage: vessel.grosstonnage, AdditionNotes: vessel.additionalnotes };
          $scope.addVessel(vsl);
        } else {
          $rootScope.showAlert('Error', 'Could Not Add Vessel');
        }
      });
    }

  }
  $scope.uom = $scope.currentItem.OnCountUOM;
  $scope.setUOM = function(uom) {
    $scope.uom = uom;
  }
  $scope.origStatusCode;
  if (!$scope.order.OrderStatusCode) {
    $scope.order.OrderStatusCode = "L";
    $scope.origStatusCode = $scope.order.OrderStatusCode;
  } else {
    $scope.origStatusCode = $scope.order.OrderStatusCode;
  }
  $scope.initiateDoi = function() {
    if ($scope.currentEntry.vessel) {
      var vessel = $scope.currentEntry.vessel;
    }
    if ($scope.enableDOI && $scope.currentItem.Deliver.readBy !== 'DirectBilling') {
      // $scope.currentEntry.status = 'doi';
      $scope.currentEntry.overallStatus = 'inprogress';
      $scope.startReading();
      // dbService.upsertOrder($scope.order, function() {
      //     $scope.routeItem();
      // })

    } else {
      if (!$scope.currentItem.BIUOM || $scope.currentItem.Deliver.readBy !== 'DirectBilling') {
        $scope.currentEntry.overallStatus = 'inprogress';
        $scope.startReading();
      } else {
        $scope.routeItem();
      }

    }

  }

  $scope.startReading = function() {
    $scope.order.skipDOIStart = true;
    $scope.activeView = 'reading';
    $scope.currentEntry.status = 'reading';
    $state.go('shiporder.reading', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
  }

  if (!$scope.currentEntry.quantityShipped) {
    $scope.currentEntry.quantityShipped = '';
  }
  $scope.$watch('numericIn', function(n, v) {
    if ((n.quantity || n.quantity == '') && $scope.currentItem) {
      $scope.currentEntry.quantityShipped = n.quantity;
    }
  }, true)
  $scope.checkFinished = function() {
    return ($scope.currentEntry.overallStatus == 'finished');
  }
  /* Remove Bulk item on current order */
  $scope.unsetPkg = function() {
    var itemEditable = $scope.order.OrderItems[$scope.delIndex].Editable;
    var productName = $scope.order.OrderItems[$scope.delIndex].Descr;
    var confirmPopup = $ionicPopup.confirm({
      title: "Alert!",
      template: "Do you wish to remove the Line item for " + productName + " ?",
      cssClass: 'modal-backdrop reset-item-popup',
      okText: 'Yes',
      cancelText: 'No'
    });
    confirmPopup.then(function(res) {
      if (res) {
        $scope.cancelShipmentModal.hide();
        $scope.order.doiCompleted = false;
        var index = $scope.delIndex;
        if (!$scope.order.currentSystrxLine) {
          $scope.order.currentSystrxLine = $scope.order.OrderHdr.maxSystrxLine;
        }
        $scope.order.OrderItems.splice(index, 1);
        $scope.saveUpdateOrder(function() {
          $state.go('addorder.general', { 'systrxno': $scope.order.OrderHdr.SysTrxNo });
        });
      }
    });

  }
  /* Reset billing and package item on current order */
  $scope.resetPkgItem = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: "Alert!",
      template: "Are you sure you want to reset item?",
      cssClass: 'modal-backdrop reset-item-popup',
      okText: 'Yes',
      cancelText: 'No'
    });
    confirmPopup.then(function(res) {
      if (res) {
        $scope.cancelShipmentModal.hide();
        $scope.currentEntry.overallStatus = "initial";
        $scope.currentEntry.quantityShipped = '';
        $scope.currentEntry.finalQty = '';
        $scope.currentItem.showCancel = false;
        $scope.numericIn.quantity = 0;
        if($scope.currentItem.IsBillable == "N" && $scope.currentItem.IsPackaged == "Y" && $scope.currentItem.IsBulk == "Y" ){
          $scope.order.doiCompleted = false;
          $scope.order.hideDoiButton = false;
        }
        $scope.clearDlSign();
      }
    });
  }
  $scope.setReadingState = function() {
    $scope.readingState = 'initial';
  }
  $scope.setBulkItemStatus = function() {
    $scope.currentEntry.overallStatus = 'finished';
  }
  $scope.initiateFinalDoi = function() {
    $scope.activeView = 'doi';
    $scope.order.overallStatus = 'completedDoi';
    $state.go('shiporder.doi', { isDoiComplete: true })
  }
  $scope.goToReading = function(tstate, name, tnkType) {
    $state.go('shiporder.tank', { itemId: $scope.currentItem.MasterProdID, tank: name, tstate: tstate, tankID: tstate.TankID || Math.random(), tankType: tnkType, uniqueId: Math.random() });

  }

  $scope.setStMeter = function(meter, currentMeter) {
    $scope.meter = meter;
    $scope.currentMeter = currentMeter;
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
    $scope.currentMeter[$scope.meter].status = 'finished';
  }

  $scope.goToMeter = function(name, cmeter) {
    $state.go('shiporder.meter', { itemId: $scope.currentItem.MasterProdID, meter: name, currentMeter: cmeter, uniqueId: Math.random() });
  }
  $scope.goToDirectEntry = function() {
    $state.go('shiporder.directEntry', { itemId: $scope.currentItem.MasterProdID });
  }
  $scope.setReadBy = function(val) {
    //$scope.currentEntry.readBy = val;
  }

  $scope.finishItemReading = function() {
    if ($scope.checkTankReadingFinished()) {
      $scope.proceedwithReading();
    } else {
      $ionicPopup.confirm({
        title: 'Warning!',
        template: 'Start gauge started but end gauge not given ,do you want to input end gauge?',
        cssClass: 'modal-backdrop',
        okText: 'Yes',
        cancelText: 'No'
      }).then(function(res) {
        if (!res) {
          $scope.proceedwithReading();
        }
      })
    }

  }



  $scope.proceedwithReading = function() {
    if ($scope.enableDOI) {
      $scope.currentEntry.status = 'finalSign';
      var vesselDoiFinished = true;
      var vessel;
      if ($scope.activeAction === 'Ship') {
        $scope.currentVessels = $scope.order.shippingVessels;
        vessel = $scope.order.OrderHdr.VehicleID;
      } else {
        $scope.currentVessels = $scope.order.deliveryVessels;
        if ($scope.currentEntry.vessel) {
          vessel = $scope.currentEntry.vessel.VesselID;
        } else {
          if ($scope.order.OrderHdr.InternalTransferOrder === 'Y')
            vessel = $scope.order.OrderHdr.VehicleID;
        }
      }
      var targetID;
      var transferStartDate;
      $scope.bulkItemList.forEach(function(item) {
        var entry = item[$scope.activeAction];
        if (entry.transferStartDate)
          transferStartDate = entry.transferStartDate;
        if ($scope.activeAction == "Ship") {
          targetID = $scope.order.OrderHdr.VehicleID;
        } else {
          if (entry.vessel) {
            targetID = entry.vessel.VesselID;
          } else {
            if ($scope.order.OrderHdr.InternalTransferOrder === 'Y')
              targetID = $scope.order.OrderHdr.VehicleID;
          }
        }
        if (targetID && targetID == vessel) {
          if (entry.status != 'finished' && entry.status != 'finalSign') {
            if ($scope.activeAction == 'Deliver') {
              if (entry.status != 'partially delivered') {
                vesselDoiFinished = false;
              }
            } else {
              vesselDoiFinished = false;
            }

          }
        }
      })
      if (!vesselDoiFinished) {
        $scope.currentEntry.status = 'finished';
        if ($scope.activeAction == 'Ship') {
          $scope.setItemFinished();
        } else {
          $scope.setPartialDelivery();
        }
      } else {
        $scope.currentItem.doiEnder = true;
        if (!$scope.order.shiftDetails[$scope.activeAction].transferStartDate)
          $scope.order.shiftDetails[$scope.activeAction].transferStartDate = transferStartDate;

        $scope.routeItem();
      }
    } else {
      if ($scope.activeAction == 'Ship') {
        $scope.setItemFinished();
      } else {
        $scope.setPartialDelivery();
      }
    }
  }

  $scope.finishDoi = function() {
    if($scope.order.OrderHdr.Vessels && $scope.order.OrderHdr.Vessels[0] && $scope.order.OrderHdr.Vessels[0].VesselCode){
      $scope.addMdoiVessel();  
    }
    if ($scope.currentEntry.transferEndDate >= $scope.order.shiftDetails[$scope.activeAction].transferStartDate) {
      $scope.currentEntry.status = 'finished';
      $scope.startConversion();
      if ($scope.activeAction == 'Deliver') {
        $scope.order.doiCompleted = true;
        $scope.order.forceDoiComplete = false;
        $scope.order.newDoiActive = false;
        
        /* Check first doi completed or not, after we introduce a Edit Item button on item swipe */
        if($scope.order.OrderHdr.firstDoiComplete === undefined || $scope.order.OrderHdr.firstDoiComplete === false){
          $scope.order.OrderHdr.firstDoiComplete = true;
        }
      } else {
        $scope.order.shipdoiCompleted = true;
      }
      if ($scope.activeAction == 'Ship') {
        $scope.setItemFinished();
      } else {
        // $scope.setPartialDelivery();
      }
    } else {
      $ionicPopup.alert({
        title: 'Alert!',
        template: "End time should always be greater than or equal to Start time."
      });
    }
  }
  $scope.setItemFinished = function() {
    if ($scope.enableDOI) {
      //Check bulk items are exists or not
      if ($scope.isItemBulk($scope.currentItem) && $scope.isBulkExists()) {
        $scope.order.newDoiActive = false;
      }
      if ($scope.activeAction == 'Deliver' && !$scope.order.doiCompleted && $scope.isBulk()) {
        $scope.doiText = 'DOI';
      } else {
        $scope.doiText = '';
      }
    }
    if ($scope.isItemBulk($scope.currentItem)) {
      $localstorage.set('lastEditedSysTrxLine', $scope.currentItem.SysTrxLine);
    }
    $scope.currentEntry.overallStatus = 'finished';
    var completed = true;
    var bulk = false;
    angular.forEach($scope.itemList, function(item) {

      if (item.IsPackaged == 'N' && !item.cancelDelivery) {
        bulk = true;
      }
      if (item.IsBulk == 'Y' && !item.cancelDelivery) {
        bulk = true;
      }
      if (!(item[$scope.activeAction].overallStatus == 'finished') && !item.cancelDelivery) {
        completed = false;
      }
    })
    if (!bulk) {
      $scope.enableDOI = false;
    }
    if (completed) {
      if ($scope.currentItem.IsBillable === 'Y' && $scope.currentItem.Deliver && $scope.currentItem.Deliver.readBy === 'DirectBilling')
        $scope.startConversion();
      if ($scope.enableDOI) {
        $scope.order.overallStatus = 'completedDoi';
      } else {
        $scope.order.overallStatus = 'completedDoi';
      }
    }
  }

  $scope.setItemUnFinished = function() {
    var completed = true;
    var bulk = false;
    angular.forEach($scope.itemList, function(item) {
      if (item.IsBillable == 'N' || $scope.activeAction == 'Deliver') {
        if (!(item[$scope.activeAction].overallStatus == 'finished') && !item.cancelDelivery) {
          completed = false;
        }
      }
    })
    return (completed);
  }

  $rootScope.setPartialDelivery = function() {
    $scope.currentEntry.status = 'partially delivered';
    if (!$scope.currentItem.TotalDeliverQty) {
      $scope.currentItem.TotalDeliverQty = 0;
    }

    //  $scope.currentItem.TotalDeliverQty = $scope.currentItem.TotalDeliverQty + $scope.currentEntry.TankShipQty;
    //$scope.currentItem.deliveryList.push(angular.copy($scope.currentEntry));
    //$scope.currentEntry.Source = [];
    //$scope.currentEntry.Receiving = [];
    if (!$scope.currentEntry.ShipQty)
      $scope.currentEntry.ShipQty = 0;
    //$scope.currentEntry.TankShipQty = 0;
    if ($scope.currentItem.cancelDelivery) {
      $scope.routeItem();
    } else {
      if($scope.currentItem.IsBillable == "N" && $scope.currentItem.IsPackaged == "Y" && ($scope.currentItem.IsBulk == "Y" || $scope.currentItem.IsBulk == "N")){
        $scope.currentEntry.status = 'finished';
        $scope.activeView = 'packaged';
        $state.go('shiporder.packaged', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      }
      else if($scope.currentItem.IsBillable == "N" && $scope.currentEntry.status == 'partially delivered' && $scope.currentEntry.overallStatus == 'initial'){
        $scope.activeView = 'bulk';
        $state.go('shiporder.bulk', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      }
      else{
        $scope.activeView = "summary";
        $state.go('shiporder.summary', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
      }
    }

  }

  $scope.shipping = {};
  if ($scope.currentEntry.endMeter && $scope.currentEntry.endMeter.status == 'finished') {
    $scope.shipping.shippingString = 'Metered Shipping Complete';
  } else {
    $scope.shipping.shippingString = 'Metered Shipping in Progress';
  }

  $scope.startConversion = function() {
    if ($scope.enableDOI) {
      var doiData = $('.html2canvasDiv').get(0);
      doiData = encodeURIComponent(doiData.innerHTML);
      $rootScope.postDOIData(doiData, 1);
    }
  }
  $scope.addInsite = function(insite) {
    $scope.order.OrderHdr.ToSiteCode = insite.Code;
    $scope.order.OrderHdr.ToSiteID = insite.SiteID;
  }
  $scope.saveOrder = function(cb) {
    $rootScope.loading = false;
    $scope.orderDT = moment.utc(); // Current Date & time
    $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
    $scope.order.cTs = $scope.orderTs;
    $scope.order.DeviceID = $rootScope.deviceUid || null;
    var OrderNo = $scope.order.OrderNo;
    // $scope.updateCurrentLocation($scope.order);
    var orderTemp = { "Orders": $scope.order };
    $scope.updateSuccess = function(results) {
      if (!$scope.backEnabled) {
        if (cb) {
          cb();
        }
      } else {
        if (cb) {
          cb();
        } else {
          $scope.gotoHeader();
        }
      }
    }
    $scope.insertSuccess = function(results) {
      if (!$scope.backEnabled) {
        if (cb) {
          cb();
        }
      } else {
        if (cb) {
          cb();
        } else {
          $scope.gotoHeader();
        }

      }

    }

    $scope.order.OrderHdrData = $rootScope.formOrderHeaderJson(orderTemp.Orders.OrderHdr);
    $scope.getCount = function(results) {
      if (!results.success) {
        return false;
      }
      var len = results.data.rows.length;
      if (len > 0) {
        dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [$scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), $scope.order.OrderHdr.SysTrxNo], $scope.updateSuccess);
      } else {
        dbo.insertTableData('OrdersMaster', ['orderNo', 'SysTrxNo', 'status', 'orderData', 'orderHdrData', 'dateTime'], [$scope.order.OrderHdr.OrderNo, $scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), new Date()], $scope.insertSuccess);
      }

    };
    $localstorage.set('lastStatus', $scope.order.OrderHdr.Status);
    dbo.selectTable('OrdersMaster', "orderNo=?", [$scope.order.OrderHdr.OrderNo], $scope.getCount);
  };

  $scope.addDelivery = function() {
    if (!$scope.currentEntry.ShipQty)
      $scope.currentEntry.ShipQty = 0;
    $scope.activeView = "bulk";
    $state.go('shiporder.bulk', { itemId: $scope.currentItem.MasterProdID, tank: Math.random() });
  }
  $scope.vesselType = 'vessel';

  $scope.updateCurrentLocation = function(order) {
    var posOptions = { timeout: 5000, enableHighAccuracy: false };
    var location_timeout = setTimeout(function() {
      order.OrderHdr.CurrLat = '';
      order.OrderHdr.CurrLong = '';
      // $scope.formShipmentJson(order)
    }, 10000);
    navigator.geolocation.getCurrentPosition(
      function(position) {
        clearTimeout(location_timeout);
        order.OrderHdr.CurrLat = position.coords.latitude;
        order.OrderHdr.CurrLong = position.coords.longitude;
        $scope.formShipmentJson(order);
      },
      function(err) {
        clearTimeout(location_timeout);
        order.OrderHdr.CurrLat = '';
        order.OrderHdr.CurrLong = '';
        $scope.formShipmentJson(order);
      }, posOptions);
  }

  $scope.formShipmentJson = function(order) {
    if (!$scope.order.deliveredOnce) {
      d = new Date().toString();
      var dateTm = moment.parseZone(d).local().format('YYYY-MM-DD HH:mm:ss');
      //$scope.order.OrderHdr.ShipmentDtm = $scope.order.OrderHdr.ShipmentDtm || dateTm;
      var json = {
        "ShipmentList": {
          "Shipments": [{
            "ShipDoc": {
              "DtTm": dateTm,
              "PrintDtTm": dateTm,
              "ShipDtTm": $rootScope.formatForAscend($scope.order.OrderHdr.processOrginalTime) || $scope.order.OrderHdr.ShipmentDtm,
              "DocType": "D",
              "DocNo": order.OrderHdr.ticketNumber || order.OrderHdr.OrderNo,
              "VehicleID": order.OrderHdr.VehicleID || order.OrderHdr.Vehicle.VehicleID,
              // "DriverID": order.OrderHdr.DriverID,
              "BOLNo": order.OrderHdr.OrderNo,
              "Status": "En Route",
              "StatusCode": "O",
              "SessionNo": "",
              "DiversionState": "test",
              "DiversionShipToID": order.OrderHdr.ToSiteID,
              "LoadNo": order.OrderHdr.OrderNo,
              "DefCarrierID": order.OrderHdr.DefCarrierID,
              "Longitude": order.OrderHdr.CurrLong || 0,
              "Latitude": order.OrderHdr.CurrLat || 0,
              "DeviceID": 'Browser',
              "DeviceTime": $rootScope.getCurrentDateTime(),
              "SessionID": $rootScope.SessionID
            },
            "ShipDocItem": [],
          }],
          "CompanyID": $rootScope.CompanyID,
          "CustomerID": $rootScope.accSettings.customerId,
          "UserID": $rootScope.loginData.uname,
          "CustomerDesc": "Hinkle Floting",
          "OrderNo": order.OrderHdr.OrderNo,
          "OrderStatusCode": order.OrderStatusCode
        }
      };
      angular.forEach(order.OrderItems, function(data, index) {

        function checkProperty(ppty) {
          var ret = "";
          try {
            var pptytest = eval(ppty);
            if (pptytest === undefined || pptytest === "")
              pptytest = "0";
            ret = pptytest;
          } catch (e) {
            if (e instanceof TypeError) {
              ret = "0";
            }
          }
          return ret;
        }
        var ccShipQty;
        var ccDelivQty
        if (data.cancelDelivery) {
          ccShipQty = 0;
          ccDelivQty = 0;
        } else {
          ccShipQty = data.Ship.shipWeightQty || data.Ship.ShipQty || data.Ship.quantityShipped || data.Deliver.ShipQty || data.Qty || 0;
          ccDelivQty = data.Deliver.shipWeightQty || data.Deliver.ShipQty || data.Deliver.quantityShipped || data.Qty || 0;
        }
        var item = {
          "MasterProdID": data.MasterProdID,
          "MasterSiteID": data.MasterSiteID || 0,
          "DtTm": dateTm,
          "ShipQty": ccShipQty,
          "DelivDtTm": $rootScope.formatForAscend($scope.order.OrderHdr.processOrginalTime) || dateTm,
          "DelivQty": ccDelivQty,
          "Status": "Shipping in Progress",
          "StatusCode": "O",
          "OrderQty": data.Qty,
          "ShipNetQty": ccShipQty,
          "BOLQtyVarianceReason": "test",
          "DeliveryQtyVarianceReason": "test",
          "ARShipToTankID": checkProperty('data.Ship.Source[0].TankID'),
          "VesselID": checkProperty('data.Deliver.vessel.VesselID') || 0,
          "MarineLocID": checkProperty('order.OrderHdr.Destination.MarineLocID') || 0,
          "FromTankID": checkProperty('data.FromCsTankFuelHistoryID'),
          "ToTankID": checkProperty('data.ToCsTankFuelHistoryID'),
          "MarineSessionID": order.OrderHdr.SysTrxNo,
          "Notes": (data.Notes ? data.Notes.trim() : data.Notes),
          "IsBillable": data.IsBillable,
          "OnCountUOMID": data.OnCountUOMID || 0,
          "SellByUOMID": data.SellByUOMID || 0,
          "SysTrxLine": data.SysTrxLine || 0

        };
        json.ShipmentList.Shipments[0].ShipDocItem.push(item);

      });
      if ($scope.activeAction == 'Ship') {
        addOrderService.postShipment(json, $scope.order.OrderHdr.OrderNo).then(function(response) {
          $scope.order.OrderHdr.shipDocPost = true;
          $scope.updateOrderToDb();
          $scope.saveOrder();
        });
      }
    }
  }


  $scope.initReadBy = function() {
    if (!$scope.currentItem.Ship.readBy) {
      $scope.currentEntry.readBy = undefined;
    }else{
      var radios = angular.element(document.querySelector("#readBy-wrapper"));
      $timeout(function() {
        var radio = radios.find('label');
        if (radio.length == 1) {
          $scope.currentEntry.readBy = radio.attr('ng-value').replace(/['"]+/g, '');
        }
      });
      if (!$scope.currentEntry.readBy) {
        if ($scope.activeAction == 'Deliver') {
          if ($scope.currentItem.Ship.readBy) {
            $scope.currentEntry.readBy = $scope.currentItem.Ship.readBy;
          } else {
            if ($scope.currentItem.IsBillable === 'Y') {}
          }

        }
      }
      else{
        $scope.currentEntry.readBy = $scope.currentItem.Ship.readBy;
      }
    }
  }

  let errorChecking = false;
  $scope.checkReadingFinished = function() {

    errorChecking = true;
    if ($scope.currentEntry.ShipQty || $scope.currentEntry.quantityShipped) {
      return true;
    } else if ($scope.currentEntry.Source[0] != undefined && !errorChecking) {
      if ($scope.currentEntry.Source[0].stTank != undefined && $scope.currentEntry.Source[0].endTank != undefined) {
        if ($scope.currentEntry.Source[0].stTank.status == 'finished' && $scope.currentEntry.Source[0].endTank.status == 'finished' && $scope.currentEntry.tankError) {
          Notify.pop('error', 'Invalid Tank Readings !', 'e010');
          $timeout(function() { errorChecking = false }, 1000);
        }
      }
    } else if ($scope.currentEntry.Receiving[0] != undefined && !errorChecking) {
      if ($scope.currentEntry.Receiving[0].stTank != undefined && $scope.currentEntry.Receiving[0].endTank != undefined) {
        if ($scope.currentEntry.Receiving[0].stTank.status == 'finished' && $scope.currentEntry.Receiving[0].endTank.status == 'finished' && $scope.currentEntry.tankError) {
          Notify.pop('error', 'Invalid Tank Readings !', 'e010');
          $timeout(function() { errorChecking = false }, 1000);
        }
      }
    }

  }
  $scope.checkTankReadingFinished = function() {
    if (!$scope.currentEntry.Source) {
      return true;
    }
    if ($scope.currentEntry.Source[0] && ($scope.currentEntry.Source[0].stTank) && $scope.currentEntry.Source[0].stTank.quantityShipped) {
      if ($scope.currentEntry.Source[0].stTank && $scope.currentEntry.Source[0].stTank.status == 'finished' && $scope.currentEntry.Source[0].endTank && $scope.currentEntry.Source[0].endTank.status == 'finished') {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  $scope.checkReceivingTankReadingFinished = function() {
    if (!$scope.currentEntry.Receiving) {
      return true;
    }
    if ($scope.currentEntry.Receiving[0] && ($scope.currentEntry.Receiving[0].stTank && $scope.currentEntry.Receiving[0].stTank.quantityShipped)) {
      if ($scope.currentEntry.Receiving[0].stTank && $scope.currentEntry.Receiving[0].stTank.status == 'finished' && $scope.currentEntry.Receiving[0].endTank && $scope.currentEntry.Receiving[0].endTank.status == 'finished') {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }


  $scope.checkOrderFinished = function() {
    return ($scope.order.overallStatus == 'completedDoi')
  }

  $scope.finishOrderProcessing = function() {
    angular.forEach($scope.order.OrderItems, function(order, key) {
      order.PONo = $scope.rTrim(order.PONo);
      order.Notes = $scope.rTrim(order.Notes);
      order.PONo = order.PONo;
      order.Notes = order.Notes;
      if (order.Deliver != undefined && order.Deliver.ShippingInstruction != undefined) {
        order.Deliver.ShippingInstruction = $scope.rTrim(order.Deliver.ShippingInstruction);
      }
      if (order.Ship != undefined && order.Ship.ShippingInstruction != undefined) {
        order.Ship.ShippingInstruction = $scope.rTrim(order.Ship.ShippingInstruction);
      }
    });
    if ($scope.finishText == "View Delivery Ticket") {
      let foundTicket = false;
      angular.forEach($scope.order.OrderHdr.OrderAttachment, function(value, key) {
        if (value.dataURL.indexOf('DELIVERY_TICKET') >= 0) {
          foundTicket = true;
          window.cordova ? $scope.openDTicketModal(value.type, value) : $window.open(value.dataURL);
        }
      });
      if (foundTicket) return true;
    }
    if ($scope.order.OrderHdr.Status == 'Delivered') {
      $state.go('printDeliveryTicket', { 'order': $scope.order.OrderHdr.OrderNo, 'systrxno': $scope.order.OrderHdr.SysTrxNo });

    } else {
      if ($scope.activeAction == 'Ship') {
        if ($scope.order.overallStatus == 'completedDoi') {

          var dt = new Date().toString();
          var dateTm = moment.parseZone(dt).local().format('YYYY-MM-DD HH:mm:ss');
          if (!$scope.order.OrderHdr.ShipmentDtm) {
            $scope.order.OrderHdr.ShipmentDtm = dateTm;
          }
          $scope.order.OrderHdr.Status = "En Route";
          $scope.order.OrderHdr.StatusCode = "E";
          $scope.order.overallStatus = 'inprogress';
          $scope.order.OrderStatusCode = "E";
          if ($scope.order.shipdoiCompleted || !$scope.enableDOI) {
            $scope.order.skipDOIStart = false;
            $scope.order.activeAction = "Deliver";
          }

        } else {
          if ($scope.order.overallStatus == 'completedDoi') {
            $scope.order.OrderStatusCode = "S";
          } else {

            $scope.order.OrderStatusCode = "L";
          }
        }
      } else {
        if ($scope.order.overallStatus == 'completedDoi') {}
      }
      if (($scope.order.OrderStatusCode == 'S') && !$scope.order.deliveredOnce) {
        var d = new Date().toString();
        //if(!$scope.order.OrderHdr.ShipmentDtm)
        // $scope.order.OrderHdr.ShipmentDtm = moment.parseZone(d).local().format('YYYY-MM-DD HH:mm:ss');
        // console.log('orderdt', $scope.order.OrderHdr.ShipmentDtm)
      }
      dbService.upsertOrder($scope.order, function() {

        // $scope.updateCurrentLocation($scope.order);
        $localstorage.set('lastStatus', $scope.order.OrderHdr.Status);
        $scope.updateOrderToDb();
        if ($scope.order.OrderHdr.Status != "Delivered") {
          if ($scope.order.overallStatus == 'completedDoi') {
            if (!$scope.order.doiCompleted && $scope.enableDOI) {
              $scope.activeView = 'doi';
              if ($scope.currentItem.IsPackaged === 'Y') {
                $scope.currentEntry.overallStatus = 'initial';
              } else {
                $scope.currentEntry.overallStatus = 'inprogress';
              }
              $scope.currentEntry.status = 'finalSign';
              $scope.order.hideDoiButton = true; //Check if item is special package item on new doi generated.
              $state.go('shiporder.doi', { isDoiComplete: true, itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() })
            } else {
              $state.go('printDeliveryTicket', { 'order': $scope.order.OrderHdr.OrderNo, 'systrxno': $scope.order.OrderHdr.SysTrxNo });
            }

          } else {
            if ($scope.activeAction == 'Deliver' && !$scope.order.doiCompleted) {
              $scope.activeView = 'doi';
              if ($scope.currentItem.IsPackaged === 'Y') {
                $scope.currentEntry.overallStatus = 'initial';
              } else {
                $scope.currentEntry.overallStatus = 'inprogress';
              }
              $scope.currentEntry.status = 'finalSign';
              $scope.order.hideDoiButton = true; //Check if item is special package item on new doi generated.
              $state.go('shiporder.doi', { isDoiComplete: true, itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() })
            } else {
              if ($scope.activeAction == 'Ship' && !$scope.order.shipdoiCompleted && $scope.enableDOI) {
                $scope.activeView = 'doi';
                if ($scope.currentItem.IsPackaged === 'Y') {
                  $scope.currentEntry.overallStatus = 'initial';
                } else {
                  $scope.currentEntry.overallStatus = 'inprogress';
                }
                $scope.currentEntry.status = 'finalShipSign';
                $state.go('shiporder.doi', { isDoiComplete: true, itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() })
              } else {
                $scope.updateCurrentLocation($scope.order);
                $state.go('orders');
              }
            }

          }

        }

      })
    }

  }

  $scope.updateOrderToDb = function() {
    $scope.orderDT = moment.utc(); // Current Date & time
    $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
    $scope.order.cTs = $scope.orderTs;
    $scope.order.DeviceID = $rootScope.deviceUid || null;
    var o = { Orders: $scope.order }
    addOrderService.saveOrder(o, $scope.order.OrderHdr.OrderNo).then(function(response) {});
  }

  $scope.handleException = function(handler) {
    if (handler == 'MeterReading') {
      $scope.currentEntry.meterReadings.push({})
    } else {
      $scope.currentEntry.ShipQty = '';
      $scope.currentEntry.readBy = 'Tank';
    }
    $scope.currentEntry.meterException = true;
  }

  $scope.removeMeter = function(meter) {
    var index = $scope.currentEntry.meterReadings.indexOf(meter);
    $scope.currentEntry.meterReadings.splice(index, 1);
    $scope.currentEntry.ShipQty = 0;
    $scope.currentEntry.meterReadings.forEach(function(mreading) {
      if (mreading.stMeter && mreading.endMeter)
      $scope.currentEntry.ShipQty = $scope.currentEntry.ShipQty + Math.abs((mreading.endMeter.reading - mreading.stMeter.reading));
    });
  }

  $scope.disableProgress = function() {
    if ($scope.currentEntry.readBy) {
      if ($scope.activeAction == "Ship") {
        return ($scope.currentEntry.Source.length < 1);
      } else {
        if ($scope.order.OrderHdr.InternalTransferOrder == 'Y') {
          return ($scope.currentEntry.Receiving.length < 1);
        } else {
          return (!$scope.currentEntry.vessel);
        }

      }
    } else {
      return false;
    }
  }
  $rootScope.changeShift = function(role) {
    dbService.upsertOrder($scope.order, function() {
      $rootScope.shiftChangeModal.hide();
      if (role == 'otherRole') {
        var sc;
        $scope.order.OrderItems.forEach(function(item) {
          var currentEntry = item[$scope.activeAction];
          if (item.IsPackaged == 'N' && item.IsBillable == 'N') {
            sc = true;
          }
	  /* Special bulk item */
          if (item.IsBulk == 'Y') {
            sc = true;
          }
          // if (currentEntry.status == 'reading' && currentEntry.doiMarker) {
          //     sc = true;
          //
          // }
        })
        if (sc) {
          var changedShift = $scope.transferDetails[role];
          $scope.transferDetails = $scope.order.transferDetails;
          $scope.transferDetails.changedShift = changedShift;
          $state.go('shiftchange', { order: $scope.order, item: null, shiftChange: true, role: 'otherRole' });
        } else {
          var alertPopup = $ionicPopup.alert({
            title: 'Shift Change',
            template: 'Shift Change not applicable for this Order'
          });
        }

      } else {
        $rootScope.changeShiftForLoginUser();
      }
    })

  }

  $scope.calcWeightVol = function(reqData) {
    addOrderService.calcWeightVolumeQty(reqData, function(data) {
      $scope.currentEntry.shipWeightQty = data[0].Qty;
      $rootScope.hideNodeLoader();
    })
  }
  $scope.checkWeightVol = function() {
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
    reqData.QtyToCalc = $scope.currentEntry.ShipQty || $scope.currentEntry.quantityShipped;
    $scope.calcWeightVol(reqData);
  }

  $scope.finishEntry = function() {
    if ($scope.currentItem.SellByUOMID != $scope.currentItem.OnCountUOMID) {
      if ($scope.currentItem.Ship && $scope.activeAction == 'Ship'){
          $scope.checkWeightVol();
      }
      else{
        // Non Meter WeightVolumeQty
          if ($scope.currentEntry.weightQty && $scope.activeAction == 'Deliver')
            $scope.checkWeightVol();
      }
    }
    if (parseInt($scope.currentEntry.quantityShipped) > parseInt($scope.currentItem.Ship.ShipQty)) {
      $ionicPopup.confirm({
        title: 'Warning!',
        template: 'Delivered quantity is greater than shipped quantity. Are you sure you want to proceed?',
        cssClass: 'modal-backdrop',
        okText: 'Yes',
        cancelText: 'No'
      }).then(function(res) {
        if (res) {
          $state.go('shiporder.reading', { meter: null });
        }
      })
    } else {
      $state.go('shiporder.reading', { meter: null });
    }
  }


  $scope.loadTanks = function(type, site, cb) {

    if ($scope.currentItem.IsBillable == 'N') {
      var siteID;
      if (site) {
        siteID = site;
      } else {
        if (type == 'Receiving') {
          siteID = $scope.order.OrderHdr.ToSiteID;
        } else {
          siteID = $scope.order.OrderHdr.MasterSiteID;
        }
      }

      let ProdContID;
      if(type === 'Receiving'){
        // Receiving Tank
        ProdContID = $scope.currentItem.ProdContID;
      } else{
        // Source Tank
        ProdContID = $scope.currentItem.SrcProdContID  || $scope.currentItem.ProdContID;
      }

      if ($scope.currentItem.IsBillable == 'Y') {
        ProdContID = ',' + 'Y';
      } else {
        var dt = $scope.order.OrderHdr.OrderDtTm.split(' ');
        var unfDt = dt[0].split('/');
        var formDt = unfDt[2] + '-' + unfDt[0] + '-' + unfDt[1];
      }

      addOrderService.getSourceTanks(siteID, ProdContID, formDt)
        .then(getCompartments)

      function getCompartments(tanks) {
        if (tanks.data.length < 1) {
          if (type === 'Source') {
            $scope.currentEntry.hasSource = false;
          } else {
            $scope.currentEntry.hasReceiving = false;
          }

        }

        $scope.sourceTanks = tanks.data;
        if (cb) {
          cb();
        }
      }
    }
  }
  $scope.addTank = function(tank) {
    if ($scope.order.OrderHdr.InternalTransferOrder == 'Y' && $scope.activeAction == "Deliver") {
      if ($scope.general.Vehicle.EnforceShipmentMarineApp == 'Y') {
        $scope.currentEntry.Receiving[0] = angular.copy(tank);
        $scope.currentItem.ToCsTankFuelHistoryID = tank.TankID;
      } else {
        if ($scope.activeTankInput == 'Receiving') {
          $scope.currentEntry.Receiving[0] = angular.copy(tank);
          $scope.currentItem.ToCsTankFuelHistoryID = tank.TankID;
        } else {
          if ($scope.activeView == 'bulk') {
            $scope.currentEntry.Source[0] = angular.copy(tank);
            $scope.currentItem.FromCsTankFuelHistoryID = tank.TankID;
          } else {
            $scope.currentEntry.Source.push(angular.copy(tank));
          }

        }
      }
    } else {
      if ($scope.activeView == 'bulk') {
        $scope.currentEntry.Source[0] = angular.copy(tank);
      } else {
        var alreadyExists = false;
        angular.forEach($scope.currentEntry.Source, function(val) {
          if (val.TankID == tank.TankID) {
            alreadyExists = true;
          }
        });
        if (alreadyExists) {
          $rootScope.showAlert('Alert', tank.Code + ' already exists');
        } else {
          $scope.currentEntry.Source.push(angular.copy(tank));
        }
      }
      $scope.currentItem.FromCsTankFuelHistoryID = tank.TankID;
    }
  }

  $scope.removeTank = function(tank) {
    var index = $scope.currentEntry.Source.indexOf(tank);
    $scope.currentEntry.Source.splice(index, 1);
    $scope.currentEntry.sourceTotalTankQuantity -= tank.TankQty;
  }

  $scope.showTankModal = function(tankInput, site) {
    $scope.activeTankInput = tankInput;
    $scope.loadTanks(tankInput, site, function() {
      $scope.addtankmodal.show();
    })
  }

  $ionicModal.fromTemplateUrl('addTankModal.html', {
    scope: $scope,
    animation: 'none',

  }).then(function(modal) {
    $scope.addtankmodal = modal;
  });

  /* cancel order menu item it's open or not*/
  if ($scope.order.OrderHdr.Status != 'Delivered' && $scope.order.OrderHdr.Status != 'Open' && $scope.order.OrderHdr.shipDocPost != true ) {
    $rootScope.showSIP = true;
    $rootScope.EnableElectronicDOI = $scope.order.OrderHdr.EnableElectronicDOI;
  }
  $rootScope.cancelOrder = function() {
    $ionicPopup.confirm({
      title: 'Cancel Order',
      template: 'Do you want to cancel this order?',
      cssClass: 'modal-backdrop',
      okText: 'Yes',
      cancelText: 'No'
    }).then(function(res) {
      if (res) {
        $rootScope.closeSettingsPopover();
        $rootScope.loading = true;
        var SysTrxNo = $scope.order.OrderHdr.SysTrxNo;
        var odrStsCode = $scope.order.OrderHdr.StatusCode;
        var userId = $rootScope.uid || '123';
        setTimeout(function() {
          $scope.updateCancellOrders(SysTrxNo, odrStsCode, userId)
        }, 500)

      }
    })
  }
  $ionicModal.fromTemplateUrl('file-picker.html', {
    scope: $scope,
    animation: 'none',
    backdropClickToClose: true
  }).then(function(modal) {
    $scope.filePickerModal = modal;
  });

  $scope.openDTicketModal = function(modal, doc) {
    if (modal == 'file') {
      $scope.filePickerModal.show();
    } else {
      $scope.displayDoc = doc;
      var url = '';
      if (!$rootScope.isInternet || !$rootScope.online) {
        url = doc.offlineUrl;
      } else {
        url = doc.dataURL;
      }
      if (doc.type == "P") {
        window.cordova.plugins.FileOpener.openFile(url, function(res) {}, function(err) {
          $ionicPopup.alert({
            title: 'Alert!',
            template: "ERROR OCCURRED - Could not open the PDF Document"
          });
        });
      }

      if (doc.type == "I") {
        $scope.imageViewModal.show();
      }
    }
  };

  /* Update orders */
  $scope.previousStateOrder = null;
  $scope.$watch('currentItem', function(newVal, oldVal) {
    var elapsedTime = (Date.now() - $rootScope.lastSyncTime) / 1000;
    if (newVal && (elapsedTime > 1 || !$rootScope.lastSyncTime)) {
      var hasChanged = angular.equals(newVal, oldVal);
      if (!hasChanged) {
        //update DB and service
        dbService.upsertOrder($scope.order, function() {
          //$scope.updateCurrentLocation($scope.order);
          //$scope.updateOrderToDb();
        });
      }
    }
  }, true);

  $scope.saveUpdateOrder = function(cb) {
    dbService.upsertOrder($scope.order, function() {
      $scope.updateCurrentLocation($scope.order);
      $scope.updateOrderToDb();
      if (cb) {
        cb()
      }
    });
  }

  /* Redirect to ship reading page */
  $scope.readingPage = function() {
    $scope.order.doiCompleted = false;
    $scope.currentEntry.overallStatus = 'inprogress';
    $scope.activeView = 'reading';
    $scope.currentEntry.status = 'reading';
    $scope.currentEntry.editItem = true;
    $scope.order.hideDoiButton = false; //Check if item is special package item on new doi generated.
    $rootScope.shipWeightQty = $scope.currentEntry.shipWeightQty;
    $scope.routeItem();
  }

  $scope.itemSummaryPage = function() {
    $scope.currentEntry.editItem = false;
    $scope.activeView = 'summary';
    $scope.currentEntry.status = 'summaryChange';
    $state.go('shiporder.summary', { itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
  }

  $scope.changeDoiStatus = function() {
    if ($scope.order.activeAction == 'Deliver') {
      $localstorage.set('lastEditedSysTrxLine', $scope.currentItem.SysTrxLine);
      if($scope.order.OrderHdr.Vessels && $scope.order.OrderHdr.Vessels[0] && $scope.order.OrderHdr.Vessels[0].VesselCode){
        $scope.addMdoiVessel();  
      }
      $scope.order.forceDoiComplete = true;
    }
    $scope.order.skipDOIStart = true;
  }

  $scope.$on('shiftChange', function() {
    $rootScope.closeSettingsPopover();
    let flag = $rootScope.bulkItemNotInitial($scope.itemList, $scope.activeAction);
    let itemSts = $rootScope.bulkItemStatus($scope.itemList, $scope.activeAction);
    if ($scope.order.OrderHdr.AllowDOI == 'N' || $scope.order.OrderHdr.AllowDOIShipTo == 'N' || $rootScope.EnableElectronicDOI == 'N' || !$scope.isBulk()) {
      $rootScope.autoLogOff($scope.order);
    }
    else{
      if(flag){
        if(itemSts===1){
          $rootScope.autoLogOff($scope.order);
        }else{
          $scope.order.doiCompleted = false;
          $scope.doiText = 'DOI';
          if ($scope.order.OrderHdr.Status != 'Open') {
            setTimeout(function() {
              $scope.shiftModalOpen = true;
            }, 1000)
            $scope.shiftPopup = $ionicPopup.show({
              title: 'Shift Change',
              template: '<div> Who is Changing Shift? </div>',
              cssClass: 'shift-change',
              scope: $scope,
              buttons: [{
                  text: $scope.returnShiftText($scope.transferDetails[$scope.transferDetails.userRole].name, $scope.transferDetails.userRole),
                  onTap: function(e) {
                    $rootScope.changeShift('userRole');
                  }
                },
                {
                  text: $scope.returnShiftText($scope.transferDetails[$scope.transferDetails.otherRole].name, $scope.transferDetails.otherRole),
                  onTap: function(e) {
                    $rootScope.changeShift('otherRole');
                  }
                },
              ]
            });
          } else {
            $ionicPopup.alert({
              title: 'Alert!',
              template: "Shift Change not applicable for this order."
            });
          }
        }
      }
      else{ 
        $rootScope.autoLogOff($scope.order);
      }
    }

  });

  /* Shiftchange popup modal close */
  $('body').on('click', function() {
    var htmlEl = angular.element(document.querySelector('html'));
    htmlEl.on('click', function(event) {
      if ($scope.shiftModalOpen) {
        if ($scope.shiftPopup) {
          $scope.shiftPopup.close();
        }
        $scope.shiftModalOpen = false;
      }
    });
  });

  $scope.returnShiftText = function(text, type) {
    if (text) {
      return text;
    } else {
      if (type == 'Delivering') {
        return 'Dispenser'
      } else {
        return 'Receiver';
      }
    }

  }
  // Hardware Back buttons
  var deregisterFirst = $ionicPlatform.registerBackButtonAction(function() {
    $scope.backEnabled = true;
    $scope.saveOrder();
  }, 101);
  $scope.$on('$destroy', deregisterFirst);

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.cancelShipmentModal.remove();
    $scope.vesselmodal.remove();
    $scope.ordervesselmodal.remove();
    $scope.vehiclemodal.remove();
    $scope.insitemodal.remove();
    $scope.meModal.remove();
    //  $scope.modal.remove();
  });

  /* The User can change the PO Number, Item Notes And Delivery Instructions we can clear the Delivery confirmation signature */
  $scope.$watch('[currentItem.PONo,currentItem.Notes,currentEntry.ShippingInstruction,currentItem.Deliver.ShipQty,currentEntry.quantityShipped]', function(newVal, oldVal) {
    if (newVal != oldVal) {
      $scope.clearDlSign();
    }
  }, true);

  $scope.clearDlSign = function() {
    if ($scope.activeAction == 'Deliver') {
      $scope.order.ClearDeliveryTicketSign = true;
    }
  }

  $scope.checkDeliveryDoi = function() {

    if ($scope.activeAction == 'Ship' || !$scope.enableDOI) {
      return true
    } else {
      if ($rootScope.viewState.current.name == 'shiporder.doi') {
        return false;
      } else {
        return true;
      }
    }
  }
  /* Orders trim here */
  $scope.rTrim = function(str) {
    if (str != '' && str != null && str != undefined) {
      var trimmed = str.replace(/\s+$/g, '');
      return trimmed;
    }
  }

  /* Multiple DOI Created */
  $scope.isBulkRemaining = function() {
    //try to determine if entire order item's Bulk and status is initial.
    var bulkRemaining
    angular.forEach($scope.itemList, function(item) {
      var bulk;
      if (item.IsPackaged == 'N') {
        bulk = true;
      }
      if (item.IsBillable == 'Y') {
        if (item.BIUOM != 'Gallons') {
          bulk = false;
        }
      }
      if (item.IsBulk == 'Y') {
        bulk = true;
      }
      if (bulk && item[$scope.activeAction].overallStatus == 'initial') {
        bulkRemaining = true;
      }
    });
    return (!$scope.order.newDoiActive && bulkRemaining);
  }

  $scope.noItemInProgress = function() {
    //try to determine if entire order item's Bulk and status is inprogress.
    var isInProgress
    angular.forEach($scope.itemList, function(item) {
      var bulk;
      if (item.IsPackaged == 'N') {
        bulk = true;
      }
      if (item.IsBillable == 'Y') {
        if (item.BIUOM != 'Gallons') {
          bulk = false;
        }
      }
      if (item.IsBulk == 'Y') {
        bulk = true;
      }
      if (bulk && item[$scope.activeAction].overallStatus == 'inprogress') {
        isInProgress = true;
      }
    });
    return (!isInProgress);
  }

  $scope.isBulkItemFinished = function() {
    //try to determine if entire order item's is Bulk and status is finished.
    var bulkFinished;
    angular.forEach($scope.itemList, function(item) {
      var bulk;
      if (item.IsPackaged == 'N') {
        bulk = true;
      }
      if (item.IsBillable == 'Y') {
        if (item.BIUOM != 'Gallons') {
          bulk = false;
        }
      }
      if (item.IsBulk == 'Y') {
        bulk = true;
      }
      if (bulk && item[$scope.activeAction].overallStatus == 'finished') {
        bulkFinished = true;
      }
    });
    return (bulkFinished);
  }

  $scope.isBulkExists = function() {
    //Check bulk items with initial status.
    var bulkExisting
    angular.forEach($scope.itemList, function(item) {
      var bulk;
      if (item.IsPackaged == 'N') {
        bulk = true;
      }
      if (item.IsBillable == 'Y') {
        if (item.BIUOM != 'Gallons') {
          bulk = false;
        }
      }
      if (item.IsBulk == 'Y') {
        bulk = true;
      }
      if (bulk && item[$scope.activeAction].overallStatus == 'initial') {
        bulkExisting = true;
      }
    });
    return (bulkExisting);
  }

  $scope.isItemBulk = function(item) {
    //try to determine if current item is Bulk or Not
    var bulk;
    if (item.IsPackaged == 'N') {
      bulk = true;
    }
    if (item.IsBillable == 'Y') {
      if (item.BIUOM != 'Gallons') {
        bulk = false;
      }
    }
    if (item.IsBulk == 'Y') {
      bulk = true;
    }
    return bulk;
  }

  $scope.newDoi = function() {
    if (!($scope.order.forceDoiComplete)) {
      //Generate new DOI after deleting existing 
      $ionicPopup.confirm({
        title: "Alert!",
        template: "Remember to update Vessel line if needed.",
        cssClass: 'modal-backdrop reset-item-popup',
        okText: 'Confirm',
        cancelText: 'Cancel'
      }).then(function(res) {
        if(res){
          dbo.deleteTableData('DoiMaster', "SysTrxNo=?", [$scope.order.OrderHdr.SysTrxNo]);
          $scope.order.newDoiActive = true;
          $scope.enableDOI = true;
          $scope.activeView = 'doi';
          $scope.order.skipDOIStart = false;
          $scope.order.forceDoiComplete = true;
          $scope.order.doiCompleted = false;
          $scope.currentEntry.transferEndDate = null;

          $scope.order.shiftDetails[$scope.order.activeAction] = {};
          $scope.order.shiftDetails[$scope.order.activeAction].Delivering = [{}];
          $scope.order.shiftDetails[$scope.order.activeAction].Receiving = [{}];

          if ($scope.order.transferDetails.userRole == "Receiving") {
            $scope.order.shiftDetails[$scope.order.activeAction].Receiving[0] = $scope.order.transferDetails.Receiving;
          } else {
            $scope.order.shiftDetails[$scope.order.activeAction].Delivering[0] = $scope.order.transferDetails.Delivering;
          }

          $scope.order.OrderHdr.Vessels[0].VesselCode = $scope.order.OrderHdr.Vessels[0].dfVesselCode;
          $state.go('shiporder.doi', { isDoiComplete: null, itemId: $scope.currentItem.MasterProdID, uniqueId: Math.random() });
        }
      });

    } else {
      //Collect signature for existing DOI
      $ionicPopup.confirm({
        title: "Alert!",
        template: "Do you wish to end the current DOI and start a new DOI?",
        cssClass: 'modal-backdrop reset-item-popup',
        okText: 'Yes',
        cancelText: 'No'
      }).then(function(res) {
        if (res) {
          $rootScope.loading = true;
          $scope.order.newDoiActive = true;
          $scope.enableDOI = true;
          //$scope.activeView = 'doi';
          $scope.order.skipDOIStart = true;
          setTimeout(function() {
            if ($localstorage.get('lastEditedSysTrxLine')) {
              var prevSysTrxLine = $localstorage.get('lastEditedSysTrxLine');
              $scope.itemList.forEach(function(item) {
                // console.log("item.SysTrxLine", item.SysTrxLine, prevSysTrxLine);
                if (item.SysTrxLine == prevSysTrxLine) {
                  $scope.currentItem = item;
                  $scope.currentEntry = $scope.currentItem[$scope.order.activeAction];
                  $scope.currentEntry.status = 'finalSign';
                  $scope.routeItem();
                }
              });
            } else {
              $rootScope.loading = false;
            }
          }, 4000);
        }
      });
    }
  }

  /* Collect multi doi vessel code */
  $scope.addMdoiVessel = function() {
    if ($scope.order.activeAction == 'Deliver') {
      if ($scope.order.OrderHdr.MultiVessel && $scope.order.OrderHdr.MultiVessel.length > 0) {
        if ($scope.order.OrderHdr.MultiVessel.indexOf($scope.order.OrderHdr.Vessels[0].VesselCode) == -1) {
          $scope.order.OrderHdr.MultiVessel.push($scope.order.OrderHdr.Vessels[0].VesselCode);
        }
      } else {
        $scope.order.OrderHdr.MultiVessel.push($scope.order.OrderHdr.Vessels[0].VesselCode);
      }
    }
  }


  $scope.hideItemProperty = function(str){ 
    $("#po,#note,#deliveryIns").removeClass('hide-on-keyboard-open');
    if(str == "po"){ 
      $("#note,#deliveryIns").addClass('hide-on-keyboard-open');
    }
    if(str == "note"){ 
      $("#po,#deliveryIns").addClass('hide-on-keyboard-open');
    }
    if(str == "deliveryIns"){
      $("#po,#note").addClass('hide-on-keyboard-open');
    }
  }

  /* Handling an Edit item  */
  $scope.editItem = function(){
    if($scope.order.OrderHdr.firstDoiComplete){
      let productName = $scope.order.OrderItems[$scope.delIndex].Descr;
      $ionicPopup.confirm({
        title: 'Alert!',
        template: "Are you sure you want to edit the line item for "+ productName +" ?",
        cssClass: 'modal-backdrop',
        okText: 'Yes',
        cancelText: 'No'
      }).then(function(res){
        if(res){
          $scope.order.doiCompleted = true;
          $scope.currentEntry.overallStatus = 'inprogress';
          if($scope.currentItem.IsPackaged == "Y" || $scope.currentItem.IsBillable == "Y"){
            $scope.currentEntry.quantityShipped = '';
            $scope.currentEntry.overallStatus = 'initial';
          }
          $scope.activeView = 'reading';
          $scope.currentEntry.status = 'reading';
          $scope.currentEntry.editItem = true;
          $scope.order.hideDoiButton = false; //Check if item is special package item on new doi generated.
          $scope.routeItem();
        }
      })
    }else{
      $ionicPopup.alert({
        title: 'Alert!',
        template: "Edit the line item is not applicable!"
      });
    }
  }

  // If Order is delivered on MDA, then Shift change menu is hide, remaining status (Shipping In Progress, En Route, Delivery In Progress) are maintained.
  $rootScope.hideShiftMenu = true;
  if($scope.order.OrderHdr.Status == 'Delivered') {
    $rootScope.hideShiftMenu = false;
  }

  $scope.$on('IdleStart', function() {
    $scope.saveUpdateOrder();
  });

});
