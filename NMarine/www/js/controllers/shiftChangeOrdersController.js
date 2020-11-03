app.controller('shiftChangeOrdersController', function($scope, $rootScope, $stateParams, $state) {
  $scope.processShiftChangeForOrder = function(order) {
    $state.go('shiftchange', { order: order, item: null, shiftChange: true, role: 'userRole' });
  }
  $scope.navBack = function() {
    $state.go('orders');
  }
});
