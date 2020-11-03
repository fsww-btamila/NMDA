app.directive('timePicker', function() {
  return {
    templateUrl: 'timePicker.html',
    scope: {
      model: '='
    },
    controller: function($scope) {
      var time = new Date($scope.model);

      $scope.hours = time.getHours();
      $scope.minutes = time.getMinutes();
      $scope.timeType = getTimeZone(time);
      $scope.arrayTimeZone = ['AM', 'PM'];
      $scope.showTime = false;
      $scope.stringTime = "";
      /* functions */
      $scope.setStringDate = function() {
        $scope.timeType = getTimeZone(new Date($scope.model));
        $scope.stringTime = $scope.hours.toFixed() + ":" + $scope.minutes.toFixed() + " " + $scope.timeType;
        if ($scope.timeType == 'AM') {
          $scope.arrayTimeZone.reverse();
        }
      };

      function getTimeZone(date) {
        var hours = new Date(date).getHours(),
          am;
        hours = (hours + 24 - 2) % 24;
        am = hours < 12 ? 'AM' : 'PM';
        hours = (hours % 12) || 12;

        return am;
      }
      $scope.setStringDate();
    },
    link: function($scope, element, attrs) {
      angular.element(document).ready(function() {
        var maxHours = 24,
          maxMinutes = 60,
          min = 1,
          elem = angular.element(element),
          camera = elem.find("camera"),
          mainElement = angular.element(document.querySelector("body"));
        $scope.onSwipeDownHours = function() {
          if ($scope.hours > min) {
            $scope.hours--;
          }
        };
        $scope.onSwipeUpHours = function() {
          if ($scope.hours < maxHours)
            $scope.hours++;
        };
        $scope.onSwipeUpMinutes = function() {
          if ($scope.minutes > min) {
            $scope.minutes--;
          }
        };
        $scope.onSwipeDownMinutes = function() {
          if ($scope.minutes < maxMinutes) {
            $scope.minutes++;
          }
        };
        $scope.showDialog = function() {
          toggleTimePicker();
        };

        function toggleTimePicker(closeParameter) {
          closeParameter = closeParameter || false;
          $scope.model = new Date($scope.model);
          $scope.model.setHours($scope.hours.toFixed());
          $scope.model.setMinutes($scope.minutes.toFixed());
          $scope.setStringDate();
          if (closeParameter) {
            $scope.showTime = false;
          } else {
            $scope.showTime = !$scope.showTime;
          }
        }
        /* closest */
        function closest_element(element, tagName) {
          if (element instanceof angular.element)
            element = element[0];
          tagName = tagName.toUpperCase();
          if (!element) return false;
          do {
            if (element.nodeName === tagName) {
              return true;
            }
          } while (element = element.parentNode);

          return false;
        }

        function onDocumentClick(e) {
          var closest = closest_element(e.target, 'time-picker');
          if (!closest) {
            toggleTimePicker(true);
            $scope.$apply();
          }
        }
        var startTouchHour = null;
        var positionHour = null;
        var startTouchMinutes = null;
        var positionMinutes = null;
        $scope.touchMoveEventHours = function(e) {
          positionHour = e.pageY || e.originalEvent.touches[0].pageY;
          if (positionHour > startTouchHour) {
            if ($scope.hours > 0) {
              $scope.hours -= 0.05;
              startTouchHour = positionHour;
            } else {
              $scope.hours = maxHours;
              startTouchHour = positionHour;
            }
          } else {
            if ($scope.hours < maxHours) {
              $scope.hours += 0.05;
              startTouchHour = positionHour;
            } else {
              $scope.hours = 0;
              startTouchHour = positionHour;
            }
          }

        };

        $scope.touchStartEventHours = function(e) {
          startTouchHour = e.pageY || e.originalEvent.touches[0].pageY;
        };

        $scope.touchMoveEventMinutes = function(e) {
          positionMinutes = e.pageY || e.originalEvent.touches[0].pageY;
          if (positionMinutes > startTouchMinutes) {
            if ($scope.minutes > 0) {
              $scope.minutes -= 0.05;
              startTouchMinutes = positionMinutes;
            } else {
              $scope.minutes = maxMinutes;
              startTouchMinutes = positionMinutes;
            }
          } else {
            if ($scope.minutes < maxMinutes) {
              $scope.minutes += 0.05;
              startTouchMinutes = positionMinutes;
            } else {
              $scope.minutes = 0;
              startTouchMinutes = positionMinutes;
            }
          }
        };

        $scope.touchStartEventMinutes = function(e) {
          startTouchMinutes = e.pageY || e.originalEvent.touches[0].pageY;
        };

        mainElement.on('click', onDocumentClick);
      });
    }
  }
});
