app.directive('dateFormat', function(dateFilter) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelCtrl) {
      element.datepicker({
        dateFormat: 'MM/DD/yy',
        onSelect: function(date) {
          var ar = date.split("/");
          date = new Date(ar[2] + "-" + ar[1] + "-" + ar[0]);
          ngModelCtrl.$setViewValue(date.getTime());
          scope.$apply();
        }
      });
      ngModelCtrl.$formatters.unshift(function(v) {
        return $filter('date')(v, 'MM/DD/yyyy');
      });

    }
  };
});