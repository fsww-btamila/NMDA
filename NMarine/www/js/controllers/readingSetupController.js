app.controller('readingSetupController', function($scope, $rootScope, addOrderService) {
  if ($scope.currentEntry.readBy == 'Meter') {
    if (!$scope.currentEntry.ShipQty && $scope.currentItem.Ship.ShipQty)
      $scope.currentEntry.ShipQty = $scope.currentItem.Ship.ShipQty;
    $scope.currentEntry.shipWeightQty = $scope.currentItem.Ship.shipWeightQty;
  }
  if ($scope.activeAction == 'Ship') {
    $scope.currentUOM = $scope.currentItem.OnCountUOM;
    if ($scope.currentEntry.Receiving.length == 0) {
      if (parseInt($scope.order.OrderHdr.Vehicle.TankCount) > 0) {
        $scope.currentEntry.Receiving.push(angular.copy($scope.order.OrderHdr.Vehicle));
      }
    }
  } else {
    $scope.currentUOM = $scope.currentItem.SellByUOM;
    if ($scope.currentEntry.Source.length == 0) {
      if ($scope.order.OrderHdr.Vehicle.EnforceShipmentMarineApp == "Y") {
        if (parseInt($scope.order.OrderHdr.Vehicle.TankCount) > 0) {
          $scope.currentEntry.Source.push(angular.copy($scope.order.OrderHdr.Vehicle));
        }
      }
    }
  }

  var calcWeightVol = function(reqData) {
    addOrderService.calcWeightVolumeQty(reqData, function(data) {
      $scope.currentEntry.weightQty = data[0].Qty;
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
    if (!$scope.currentEntry.weightQty) {
      reqData.FromUOMID = $scope.currentItem.SellByUOMID;
      reqData.ToUOMID = $scope.currentItem.OnCountUOMID;
      reqData.QtyToCalc = $scope.currentItem.Qty;
      calcWeightVol(reqData);
    }
  }
  //checkUOM changed
  if ($scope.currentItem.SellByUOMID != $scope.currentItem.OnCountUOMID) {
    if ($scope.currentItem.SellByUOMID && $scope.currentItem.OnCountUOMID) {
      if ($scope.currentItem.Ship)
        checkWeightVol();
    }
  }

  if ($scope.currentEntry.readBy == "DirectBilling") {
    $scope.routeItem();
  }

});