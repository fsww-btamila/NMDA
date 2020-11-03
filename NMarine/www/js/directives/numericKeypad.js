app.directive('numericKeypad', function() {

  return {
    templateUrl: 'numericKeypad.html',
    scope: {
      currentItem: '=',
      quantity: '=',
      fractions: '=',
      float: '='
    },
    controller: function($scope) {
      $scope.setQuantity = function($event, item) {
        if (!$scope.quantity) {
          $scope.quantity = '';
        }
        if (item || item == 0) {
          item = item.toString();
          if (item.indexOf("/") > 0) {
            item = eval(item);
            $scope.quantity = parseInt($scope.quantity) + item;
          } else {
            $scope.quantity = $scope.quantity + item;
          }
        } else {
          var val = parseInt($event.target.innerHTML);
          if (!isNaN(val))
            $scope.quantity = $scope.quantity + val;
        }
        void 0;
      }
      $scope.backSpace = function() {
        if ($scope.quantity.length > 0) {
          $scope.quantity = $scope.quantity.slice(0, -1);
        } else if (typeof $scope.quantity == 'number') {
          $scope.quantity = $scope.quantity.toString();
          $scope.quantity = $scope.quantity.slice(0, -1);
        }

      }
    }
  }
})