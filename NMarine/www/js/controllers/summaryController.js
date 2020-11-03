app.controller('summaryController', function($scope, $rootScope) {
  if($rootScope.shipWeightQty === $scope.currentItem.Deliver.shipWeightQty){
    $scope.currentItem.Deliver.shipWeightQty = $rootScope.shipWeightQty;
  }
  if ($scope.currentItem.Ship.readBy == 'Tank') {
    if ($scope.currentItem.Deliver.readBy == 'Tank') {
      $scope.currentEntry.finalQty = $scope.currentItem.Deliver.shipWeightQty || $scope.currentItem.Deliver.ShipQty || $scope.currentItem.Deliver.quantityShipped || $scope.currentItem.Qty || 0;
    } else if ($scope.currentItem.Deliver.readBy == 'Meter') {
      $scope.currentEntry.finalQty = $scope.currentItem.Deliver.ShipQty || $scope.currentItem.Deliver.shipWeightQty || $scope.currentItem.Deliver.quantityShipped || $scope.currentItem.Qty || 0;
    } else {
      $scope.currentEntry.finalQty = $scope.currentItem.Deliver.shipWeightQty || $scope.currentItem.Deliver.ShipQty || $scope.currentItem.Deliver.quantityShipped || $scope.currentItem.Qty || 0;
    }
  }
  if ($scope.currentItem.Ship.readBy == 'Meter') {
    $scope.currentEntry.finalQty = $scope.currentItem.Ship.shipWeightQty || $scope.currentItem.Deliver.ShipQty || $scope.currentItem.Deliver.quantityShipped || $scope.currentItem.Qty || 0;
  }
  if ($scope.currentItem.Ship.readBy != 'Tank' && $scope.currentItem.Ship.readBy != 'Meter') {
    if (!$scope.currentItem.Ship.readBy) {
      if ($scope.currentItem.Deliver.readBy == 'Tank') {
        $scope.currentEntry.finalQty = $scope.currentItem.Deliver.shipWeightQty || $scope.currentItem.Deliver.ShipQty || $scope.currentItem.Deliver.quantityShipped || $scope.currentItem.Qty || 0;
      } else {
        $scope.currentEntry.finalQty = $scope.currentItem.Deliver.shipWeightQty || $scope.currentItem.Deliver.ShipQty || $scope.currentItem.Deliver.quantityShipped || $scope.currentItem.Qty || 0
      }
    } else {
      $scope.currentEntry.finalQty = $scope.currentItem.Deliver.ShipQty || $scope.currentItem.Deliver.shipWeightQty || $scope.currentItem.Deliver.quantityShipped || $scope.currentItem.Qty || 0;
    }
  }
});