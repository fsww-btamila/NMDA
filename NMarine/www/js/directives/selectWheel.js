app.directive('selectWheel', function($ionicScrollDelegate, $ionicGesture, $window, $timeout) {
  return {
    restrict: 'E',
    scope: {
      itemHeight: '@',
      amplitude: '@',
      ngModel: '=',
      options: '=',
      index: '=',
      control: '=',
      unit: '=',
      maxDepth: '='
    },
    templateUrl: 'selectWheel.html',
    compile: function(element) {
      return function(scope, element) {
        var _fixed = true,
          _touched = false;
        var inprogress = false;
        scope.itemHeight = scope.itemHeight || 50;
        scope.amplitude = scope.amplitude || 5;
        scope.index = 0;
        var resize = function() {};
        scope.control.gotoItem = function(pos) {
          var id = element.find('ion-scroll').attr('delegate-handle');
          console.log(id);
          var scrollHandle = $ionicScrollDelegate.$getByHandle(id);
          scrollHandle.scrollTo(0, pos * scope.itemHeight);

        }
        scope.onScroll = function(event) {

          var id = element.find('ion-scroll').attr('delegate-handle');
          var scrollHandle = $ionicScrollDelegate.$getByHandle(id);
          var scrollTop = scrollHandle.getScrollPosition().top;
          var height = scope.itemHeight,
            amplitude = scope.amplitude,
            remainder = scrollTop % height,
            distance, nearestPos,
            middle = Math.floor(height / 2),
            index,
            minDist = middle - amplitude;

          /*
          Find the distance between the item and the center:
          So if the height of the item is 50, it finds the nearest
          integer for scrollTop to reach a multiple of 50
          160 = 3 * 50 + 10 => For 160, the distance is 10
          145 = 3 * 50 - 5 => For 145, the distance is 5
          */
          if (remainder > middle) {
            distance = height - remainder;
            nearestPos = scrollTop + distance;
            index = Math.floor(scrollTop / height) + 1;
          } else {
            distance = remainder;
            nearestPos = scrollTop - distance;
            index = Math.floor(scrollTop / height);
          }
          if (!_touched && !_fixed) {
            inprogress = false;
            scrollHandle.scrollTo(0, nearestPos);
            _fixed = true;
            scope.index = index;
            scope.$apply(function() {
              scope.ngModel = scope.options[index].value;
            });
            $timeout(function() {
              $ionicScrollDelegate.getScrollView().options.scrollingY = false;
            }, 100);
          }

        };

        scope.callScroll = function() {
          if (!inprogress) {
            inprogress = true;
            $timeout(function() {
              _touched = false;
              _fixed = false;
              scope.onScroll();
            }, 200)
          }

        }

        // Bind events
        angular.element($window).bind('resize', resize);
        var unWatchModel = scope.$watch('ngModel', function(newVal) {
          if (newVal && newVal.value) {
            for (var i = 0, len = scope.options.length; i < len; ++i) {
              if (scope.options[i].value == scope.ngModel) {
                scope.index = i;
              }
            }
          }

        });
        $ionicGesture.on('touch', function() {
          _touched = true;
          _fixed = false;
        }, element, {});
        $ionicGesture.on('release', function() {
          if (_touched) {
            _touched = false;
            _fixed = false;
          }
        }, element, {});

        scope.$on('destroy', function() {
          // Unbind events
          $ionicGesture.off('touch', element);
          $ionicGesture.off('release', element);
          angular.element($window).off('resize', resize);
          unWatchModel();
        });

        // Resize on start
        resize();
      };

    }
  };
})
