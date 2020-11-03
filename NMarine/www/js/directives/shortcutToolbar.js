app.directive('shortcutToolbar', function() {
  return {
    templateUrl: 'shortcutToolbar.html',
    scope: {
      pinToTop: '&',
      deleteShortcut: '&'
    },
    controller: function($scope) {
      $scope.isOpen = false;
      $scope.openToolbarContent = function() {
        $scope.isOpen = true;
      };
      $scope.closeToolbarContent = function() {
        $scope.isOpen = false;
      };
    },
    link: function($scope, element, attrs) {
      angular.element(document).ready(function() {
        var elem = angular.element(element),
          mainElement = angular.element(document.querySelector("body"));

        $scope.pinToTopFunction = function() {
          $scope.pinToTop();
          $scope.closeToolbarContent();
        };

        $scope.deleteShortcutFunction = function() {
          $scope.deleteShortcut();
          $scope.closeToolbarContent();
        };

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
          var closest = closest_element(e.target, 'shortcut-toolbar');
          if (!closest) {
            $scope.isOpen = false;
            $scope.$apply();
          }
        }

        mainElement.on('click', onDocumentClick);
      });
    }
  }
});
