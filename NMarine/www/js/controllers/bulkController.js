app.controller('bulkController', function($scope, $rootScope, $ionicModal, $ionicPopover, $localstorage, addOrderService, ordersListService, appConstants, $stateParams, $state, $ionicHistory, $cordovaCamera) {
  $scope.currentEntry.hasSource = true;
  $scope.currentEntry.hasReceiving = true; 
  if ($scope.activeAction == 'Deliver')
    $scope.previousEntry = $scope.currentItem.Ship;
  if ($scope.activeAction === 'Ship' || $scope.general.Vehicle.EnforceShipmentMarineApp === 'N') {
    $scope.loadTanks('Source');
    if ($scope.general.Vehicle.EnforceShipmentMarineApp === 'Y') {
      if (parseInt($scope.order.OrderHdr.Vehicle.TankCount) === 0) {
        $scope.currentEntry.hasReceiving = false;
      }
    }
    if ($scope.general.InternalTransferOrder === 'Y') {
      $scope.loadTanks('Receiving');
    }
  } else if ($scope.activeAction === 'Deliver' && $scope.general.InternalTransferOrder === 'Y') {
    if (parseInt($scope.order.OrderHdr.Vehicle.TankCount) == 0) {
      $scope.currentEntry.hasSource = false;
    }
    $scope.loadTanks('Receiving');
  } else {
    if ($scope.activeAction == 'Deliver' && $scope.order.OrderHdr.Vehicle) {
      if (parseInt($scope.order.OrderHdr.Vehicle.TankCount) > 0) {
        $scope.currentEntry.hasSource = true;
      } else {
        $scope.currentEntry.hasSource = false;
      }

    }
    $scope.loadTanks('Receiving');
  }
  $scope.showTankReadBy = function() {
    if ($scope.activeAction == 'Ship') {
      return ((($scope.currentEntry.hasSource || $scope.currentEntry.hasReceiving) && $scope.currentItem.IsBillable == 'N'))
    } else {
      if ($scope.general.InternalTransferOrder === 'Y') {
        return ((($scope.currentEntry.hasSource || $scope.currentEntry.hasReceiving) && $scope.previousEntry.readBy != 'Meter' && $scope.currentItem.IsBillable == 'N'))
      } else {
        return ((($scope.currentEntry.hasSource) && $scope.currentItem.IsBillable == 'N'))
      }

    }
  }
  $scope.disableProgress = function() {
    if ($scope.currentEntry.readBy) {
      if ($scope.activeAction == "Ship") {
        if ($scope.currentEntry.hasSource)
          return ($scope.currentEntry.Source.length < 1);
      } else {
        if ($scope.general.Vehicle.EnforceShipmentMarineApp === 'N') {
          if ($scope.currentEntry.hasSource && !($scope.currentItem.IsBillable == 'Y' && $scope.currentItem.BIUOM == 'Gallons')){ 
            return ($scope.currentEntry.Source.length < 1);
          } 
        }
        if ($scope.order.OrderHdr.InternalTransferOrder == 'Y') {
          if ($scope.currentItem.hasReceiving) {
            return ($scope.currentEntry.Receiving.length < 1);
          }

        } else {
          return (!$scope.currentEntry.vessel);
        }

      }
    } else {
      if($scope.currentEntry.readBy === "undefined"){
        return false;
      }
      else{
        return true;
      }
    }
  }
  $scope.gauDisable = function() {
    return ($scope.previousEntry && $scope.previousEntry.readBy && $scope.previousEntry.readBy != 'Tank');
  }
  $scope.gauIsbDisable = function() {
    return ($scope.previousEntry && $scope.previousEntry.readBy && $scope.previousEntry.readBy != 'Tank');
  }
  $scope.meterDisable = function() {
    return ($scope.previousEntry && $scope.previousEntry.readBy && $scope.previousEntry.readBy != 'Meter');
  }
  $scope.nmeterDisable = function() {
    return ($scope.previousEntry && $scope.previousEntry.readBy == 'Meter');
  }
  
  if($scope.general.Vehicle.EnforceShipmentMarineApp =='N'){
    if($scope.currentEntry && $scope.currentEntry.Source && $scope.currentEntry.Source.length ==0){
      $scope.loadTanks('Source',$scope.currentItem.MasterSiteID,function(){
       if($scope.sourceTanks && $scope.sourceTanks.length ==1){
          $scope.addTank($scope.sourceTanks[0]);        
        }
      });
      } 
  }

});