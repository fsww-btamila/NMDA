app.directive('orderPane', function() {
  return {
    templateUrl: 'template/orderPane.html',
    scope: {
      order: '=',
      itemList: '=',
      currentItem: '=',
      currentItemIndex: '=',
      enableShipping: '=',
      enableHighlight: '=',
      enableDelivery: '=',
      activeAction: '=',
      currentEntry: '=',
      billingItems: '=',
      processItems: '&',
      showBilling: '=',
      shiftChange: '=',
      showDelete: '=',
      deleteItem: '&',
      swipeHandler: '&',
      settings: '=',
      routeItem: '&',
      delIndex: '=',
      page: '@'
    },
    controller: function($scope) {
      $scope.setCurrentItem = function(index) {
        $scope.currentItemIndex = index;
        $scope.currentItem = $scope.itemList[index];
        $scope.currentEntry = $scope.currentItem[$scope.activeAction];
        angular.forEach($scope.itemList, function(value, key) {
          value.showCancel = false;
        });
      }
      $scope.showItem = function(item) {
        if (item.IsBillable == 'Y') {
          if ($scope.showBilling) {
            return true
          } else {
            return false;
          }
        } else {
          if (!$scope.shiftChange) {
            return true;
          } else {
            if (item.IsPackaged == 'N' && item.IsBillable == 'N') {
              if (item[$scope.activeAction].status == 'reading') {
                return true;
              }
            } else {
              return false;
            }
          }
        }
      }
      $scope.findItemClass = function(overallStatus, status) {
        if (overallStatus == status)
          return overallStatus;
      }
      $scope.onSwipeLeft = function(index, item) {
        if (index == 0) {
          $scope.setCurrentItem(index);
          $scope.processItems(item);
          ($scope.order.OrderHdr.Status != 'Delivered' && $scope.order.OrderHdr.Status != 'Open' && $scope.order.OrderHdr.Status != 'En Route') ? $scope.processSwipe(index): '';
        }
      }
      $scope.processSwipe = function(index) {
        // if (!$scope.currentItem.cancelDelivery) {
        //     $scope.currentItem.showCancel = true;
        // }
        for (var i = 0; i < $scope.itemList.length; i++) {
          var item = $scope.itemList[i];
          if (!$scope.currentItem.cancelDelivery && ($scope.currentItem.MasterProdID == item.MasterProdID) && i == index) {
            item.showCancel = true;
          } else {
            item.showCancel = false;
          }
        }
      }
      $scope.handleCancel = function(index) {
        $scope.delIndex = index;
        $scope.swipeHandler();
      }
    }
  }
})