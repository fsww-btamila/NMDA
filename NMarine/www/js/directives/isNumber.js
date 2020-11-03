app.directive('validNumber', function() {
  return {
    require: '?ngModel',
    link: function(scope, element, attrs, ngModelCtrl) {
      if (!ngModelCtrl) {
        return;
      }
      ngModelCtrl.$parsers.push(function(val) {
        if (angular.isUndefined(val)) {
          var val = '';
        }
        var clean = val.replace(/(?:[.](?=.*[.])|[^\d.])+/g, '');
        if (val !== clean) {
          ngModelCtrl.$setViewValue(clean);
          ngModelCtrl.$render();
        }
        return clean;
      });
      element.bind('keypress', function(event) {
        if (event.keyCode === 32) {
          event.preventDefault();
        }
      });
    }
  };
});
/* Contact/Phone Number Mask */
app.directive('phoneInput', function($filter, $browser) {
  return {
    require: 'ngModel',
    link: function($scope, $element, $attrs, ngModelCtrl) {
      var listener = function() {
        var value = $element.val().replace(/[^0-9]/g, '');
        $element.val($filter('tel')(value, false));
      };

      // This runs when we update the text field
      ngModelCtrl.$parsers.push(function(viewValue) {
        return viewValue.replace(/[^0-9]/g, '').slice(0, 10);
      });

      // This runs when the model gets updated on the scope directly and keeps our view in sync
      ngModelCtrl.$render = function() {
        $element.val($filter('tel')(ngModelCtrl.$viewValue, false));
      };

      $element.bind('change', listener);
      $element.bind('keydown', function(event) {
        var key = event.keyCode;
        // If the keys include the CTRL, SHIFT, ALT, or META keys, or the arrow keys, do nothing.
        // This lets us support copy and paste too
        if (key == 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
          return;
        }
        $browser.defer(listener); // Have to do this or changes don't get picked up properly
      });

      $element.bind('paste cut', function() {
        $browser.defer(listener);
      });
    }

  };
});
app.filter('tel', function() {
  return function(tel) {
    // console.log(tel);
    if (!tel) { return ''; }

    var value = tel.toString().trim().replace(/^\+/, '');

    if (value.match(/[^0-9]/)) {
      return tel;
    }

    var country, city, number;

    switch (value.length) {
      case 1:
      case 2:
      case 3:
        city = value;
        break;

      default:
        city = value.slice(0, 3);
        number = value.slice(3);
    }

    if (number) {
      if (number.length > 3) {
        number = number.slice(0, 3) + '-' + number.slice(3, 7);
      } else {
        number = number;
      }

      return ("(" + city + ") " + number).trim();
    } else {
      return "(" + city;
    }

  };
});
/* Numeric with negative number only*/
app.directive('neagtiveOnly', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attr, ngModelCtrl) {
      function fromUser(text) {
        if (text) {
          var transformedInput = text.replace(/[^0-9-.]/g, '');

          if (transformedInput !== text) {
            ngModelCtrl.$setViewValue(transformedInput);
            ngModelCtrl.$render();
          }
          return transformedInput;
        }
        return undefined;
      }
      ngModelCtrl.$parsers.push(fromUser);
    }
  };
});

/* Location filter search for code, description */
app.filter('locationFilter', function() {
  return function(names, search) {
    if (angular.isDefined(search)) {
      var results = [];
      var i;
      var searchVal = search.toLowerCase();
      if (names) {
        for (i = 0; i < names.length; i++) {
          var Code = names[i].Code.toLowerCase();
          var Descr = names[i].Descr.toLowerCase();
          if (Code.indexOf(searchVal) >= 0 || Descr.indexOf(searchVal) >= 0) {
            results.push(names[i]);
          }
        }
        return results;
      }
    } else {
      return names;
    }
  };
});

/* Site filter search for code, description */
app.filter('siteFilter', function() {
  return function(names, search) {
    if (angular.isDefined(search)) {
      var results = [];
      var i;
      var searchVal = search.toLowerCase();
      if (names) {
        for (i = 0; i < names.length; i++) {
          var Code = names[i].Code.toLowerCase();
          var Descr = names[i].LongDescr.toLowerCase();
          if (Code.indexOf(searchVal) >= 0 || Descr.indexOf(searchVal) >= 0) {
            results.push(names[i]);
          }
        }
        return results;
      }
    } else {
      return names;
    }
  };
});

/* Tank filter search for code, description */
app.filter('tankFilter', function() {
  return function(names, search) {
    if (angular.isDefined(search)) {
      var results = [];
      var i;
      var searchVal = search.toLowerCase();
      if (names) {
        for (i = 0; i < names.length; i++) {
          var Code = names[i].Code.toLowerCase();
          var Etp = (names[i].EffectiveTankProContDesc !=null) ? names[i].EffectiveTankProContDesc.toLowerCase() : '';
          var TankType = (names[i].TankType != null) ? names[i].TankType.toLowerCase() : '';
          if ( Code.indexOf(searchVal) >= 0 || TankType.indexOf(searchVal) >= 0 || Etp.indexOf(searchVal) >= 0 ) {
            results.push(names[i]);
          }
        }
        return results;
      }
    } else {
      return names;
    }
  };
});

/* Product filter search for code, description */
app.filter('productFilter', function() {
  return function(names, search) {
    if (angular.isDefined(search)) {
      var results = [];
      var i;
      var searchVal = search.toLowerCase();
      if (names && names.length > 3) {
        for (i = 0; i < names.length; i++) {
          var Code = names[i].Code.toLowerCase();
          var Descr = names[i].Descr.toLowerCase();
          if (Code.indexOf(searchVal) >= 0 || Descr.indexOf(searchVal) >= 0) {
            results.push(names[i]);
          }
        }
        return results;
      }
    } else {
      return names;
    }
  };
});

/* get the marine location on local db, enter Go button on Device */
app.directive('appGoButton', function() {
  return function(scope, element, attrs) {
    element.bind("keydown keypress", function(event) {
      if (event.which === 13) {
        console.log("attrs", attrs, event.which);
        console.log("attrs.appGoButton", attrs.appGoButton);
        setTimeout(function() {
          scope.locationChange(scope.destinationData);
        }, 1000);
        event.preventDefault();
      }
    });
  };
});