app.directive('orderSearch', function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'template/order-search-template.html',
    scope: { list: '=', listClick: '&', clearSearchInput: '&', hideAutoComplete: '&' },
    link: function($scope, elem, attrs) {},
    controller: function($scope) {
      var uiSelector = angular.element(document.querySelector('.os-list-wrapper'));
      $scope.clearSearchInput = function() {
        $scope.keyword = '';
        uiSelector.hide();
      }
      $scope.showPopup = function() {
        uiSelector.show();
      }
      $scope.hideAutoComplete = function() {
        $scope.clearSearchInput();
      }

      $scope.filterItems = function(item) {
        if ($scope.keyword != undefined) {
          let regStr = new RegExp('.*' + $scope.keyword.toLowerCase() + '.*');
          let truth = false;
          if (item.OrderNo != undefined || item.OrderNo != null)
            truth = item.OrderNo.toLowerCase().match(regStr) || truth;
          if (item.currentUser != undefined || item.currentUser != null)
            truth = item.currentUser.toLowerCase().match(regStr) || truth;
          if (item.vesselStr)
            truth = item.vesselStr.toLowerCase().match(regStr) || truth;

          return truth;
        } else
          return true;
      }
    }
  }
});