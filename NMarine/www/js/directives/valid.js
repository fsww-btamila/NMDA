app.directive('validMax', function() {

  return {
    restrict: 'A',
    require: 'ngModel',
    link: function($scope, elem, attrs, ngModel) {
      elem.bind("keydown", function() {
        // console.log('keydown');
        if (elem[0].value.length >= parseInt(attrs.validMax)) {
          var stripped = elem[0].value.slice(0, parseInt(attrs.validMax));
          elem.val(stripped);
          elem.blur();
          elem.focus();

        }

      });
      $scope.$watch(function(ov, nv) {
        if (ov != nv)
          return ngModel.$modelValue;
      }, function(newValue) {
        // console.log('keydown');
        if (elem[0].value.length >= parseInt(attrs.validMax)) {
          var stripped = elem[0].value.slice(0, parseInt(attrs.validMax));
          //elem.val(stripped);
          ngModel.$setViewValue(stripped);
          ngModel.$render();
        }
      });
    }
  }

});

app.directive('validType', function($timeout) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function($scope, elem, attrs, ngModel) {
      $scope.$watch(function(ov, nv) {
        if (ov != nv)
          return ngModel.$modelValue;
      }, function(newValue) {
        if (attrs.validType === 'whole') {
          console.log('elem value ', elem[0].value);
          if (elem[0].value.match(/^-?\d+$/)) {
            console.log('it is whole');
            return;
          } else {
            console.log('Nah it s not a whole');
            let lenth = elem[0].value;
            let newstr = elem[0].value.slice(0, length - 1);

            ngModel.$setViewValue(newstr);
            ngModel.$render();
          }
        }
        if (attrs.validType === 'alpha') {
          console.log('elem value ', elem[0].value);
          if (elem[0].value.match(/^\s|[a-zA-Z0-9]$/)) {
            return;
          } else {
            let lenth = elem[0].value;
            let newstr = elem[0].value.slice(0, length - 1);

            ngModel.$setViewValue(newstr);
            ngModel.$render();
          }
        }
      });
    }
  }
});

app.directive('noSpecialChar', function() {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, element, attrs, modelCtrl) {
      modelCtrl.$parsers.push(function(inputValue) {
        if (inputValue == null)
          return ''
        cleanInputValue = inputValue.replace(/[^\w\s]/gi, '');
        if (cleanInputValue != inputValue) {
          modelCtrl.$setViewValue(cleanInputValue);
          modelCtrl.$render();
        }
        return cleanInputValue;
      });
    }
  }
});

app.directive('escapedInput', function($filter) {
  return {
    restrict: 'E',
    replace: true,
    scope: { encValue: '=', id: '@', placeholder: '@', style: '@', label: '@', maxlen: '@' },
    templateUrl: 'template/escapedInput.html',
    link: function($scope, elem, attrs) {
      var label = angular.element(elem[0].querySelector('label'));
      var textarea = angular.element(elem[0].querySelector('textarea.mask'));
      textarea.on("change", function() {
        $scope.encValue = textarea[0].value;
      });
      label.on("click", function() {
        setTimeout(function() {
          textarea.focus();
        }, 10);
      });
    }
  }
});
