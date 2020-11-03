app.directive('numericPad', function() {
  return {
    templateUrl: 'numberPad.html',
    scope: {
      currentItem: '=',
      quantity: '=',
      fractions: '=',
      max: '@'
    },
    controller: function($scope) {
      $scope.setQuantity = function($event, item) {

        if (!$scope.quantity) {
          $scope.quantity = '';
        } else {
          $scope.quantity = $scope.quantity.toString();
        }

        if ($scope.max != undefined && $scope.quantity.length >= parseInt($scope.max)) return;

        if (item || item == 0) {
          if (item == '.') {
            if (typeof($scope.quantity == 'string')) {
              if ($scope.quantity.indexOf('.') == -1) {
                $scope.quantity = $scope.quantity + item.toString();
              }
            }
          } else {
            $scope.quantity = $scope.quantity + item.toString();
          }
        } else {
          var val = parseInt($event.target.innerHTML);
          if (!isNaN(val))
            $scope.quantity = $scope.quantity + val;
        }
        if ($scope.currentItem.AllowNegative == 'Y') {

          if ($scope.quantity.indexOf('-') == -1) {
            $scope.quantity = -1 * $scope.quantity;
            $scope.quantity = $scope.quantity.toString();
          }
        }

      };
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
});
