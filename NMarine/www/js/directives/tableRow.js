app.directive('tableRow', function() {
  return {
    restrict: 'A',
    replace: true,
    scope: { rows: '=' },
    templateUrl: "tableRow.html",
    link: function($scope, elem, attrs) {
      //console.log($scope.rows);
      $scope.item = $scope.rows;
    }
  }
});