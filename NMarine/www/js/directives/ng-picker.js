app.directive('ngPicker', function($interval, $timeout, $window) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'ng-picker-template.html',
      scope: { items: '=', params: '=', selectedValue: '=', unit: '@', maxDepth: '@', id: '@', munit: '@', scmpLen: '@', reachedMax: '=', maxValue: '=', maxInchReached: '=', error: '=' },
      link: function($scope, elem, attrs) {

        /**
         ***	This directive is worked out with js elements and the element's scrollTop property
         *** we didnt use angular element to capture event because it does not have scrollTop property
         *** after the event is captured the angular variables are applied
         *** we have avoided animation in this plugin
         *** < overflow-scroll="true" > is needed in the parent ionic-content component
         **/

        //$scope.maxDepth = parseInt($scope.maxDepth);
        $scope.id = $scope.id || 0;
        $scope.cleanItems = []; //stores the clean items in array
        function checkItems() { //checks and removes empty values in list
          var itemArray = [];
          angular.forEach($scope.items, function(item, i) {
            if (item.value.length > 0)
              itemArray.push(item);
          });
          return itemArray;
        }
        $scope.cleanItems = checkItems();

        //initial setup constants
        const FRAMECOUNT = $scope.params.framecount || 3; //no of items visible of screen
        const SELECT_OFFSET = parseInt(FRAMECOUNT / 2) + 1; //nth item selected from top
        const HEIGHT = $scope.params.itemHeight || 30; //height of the one item in px
        const WIDTH = $scope.params.width || 150; //width of the spinner
        const COUNT = $scope.cleanItems.length; //total items calulated from items
        const AMT = HEIGHT;

        // non angular elements elements (to work with scrollTop)
        var pickFrame = elem[0].querySelector(".p-frame");
        var pickList = elem[0].querySelector(".p-items");

        //angular elements to work with css
        var ngPickFrame = angular.element(pickFrame);
        var ngPickWrapper = angular.element(elem[0]);
        var ngPSelector = angular.element(elem[0].querySelector(".p-selector"));
        var ngPList = angular.element(pickList);

        //variables
        var scrollTimeout = null;

        //scope variables
        $scope.index = 0;

        //the init function
        function _init() {
          setCss();
        }
        _init();

        // this function set the styles from data
        function setCss() {
          ngPickWrapper.css({ 'width': WIDTH + 'px' });
          ngPickFrame.css({ 'height': (FRAMECOUNT * HEIGHT) + 'px', "width": (WIDTH + 17) + "px" }); //height of the visible frame
          ngPSelector.css({ 'width': WIDTH + 'px', 'height': HEIGHT + 'px', 'top': (((SELECT_OFFSET - 1) * HEIGHT)) + 'px' }); //height of the full list
          ngPList.css({ "margin-top": ((SELECT_OFFSET - 1) * HEIGHT) + "px" });
        }

        //Event listener for scroll
        pickFrame.addEventListener('scroll', function(e) {
          $timeout.cancel(scrollTimeout);
          scrollTimeout = $timeout(function() {
            if (!(pickFrame.scrollTop == 0 && $scope.selectedValue == 0)) {
              setAbs(pickFrame.scrollTop);
            }
          }, 100);
        });

        //this is to rebind the spinner to value of the selected value
        // If model changes so does the spinner - no animation

        $scope.$watch("selectedValue", function(newValue, oldValue) {
          if ($scope.scmpLen == 1) {
            $timeout(function() {
              let value = newValue || 0;
              var newIndex = getIndexOf(value);
              //if(newIndex !== ($scope.index)){
              setPos(newIndex);
              //}		
            });
          }
        });
        $scope.$watch("id", function(newValue, oldValue) {
          if ($scope.scmpLen > 1) {
            $timeout(function() {
              let value = $scope.selectedValue || 0;
              var newIndex = getIndexOf(value);
              //if(newIndex !== ($scope.index)){
              setPos(newIndex);
              //}		
            });
          }
        });
        // $scope.$watch("maxDepth", function(newValue, oldValue){
        // 	$timeout(function(){
        // 		if(newValue !== oldValue){				
        // 			resetHeight(parseInt(newValue)+1);
        // 		}		
        // 	});	
        // });

        function resetHeight(limit) {
          limit > 0 ? ngPList.css({ "height": (limit * HEIGHT) + "px", "overflow": "hidden" }) : ngPList.css({ "height": "auto", "overflow": "visible" });
        }
        let initMd = parseInt($scope.maxDepth) + 1;
        resetHeight(initMd);

        //this function returns the index of a particular value
        function getIndexOf(searchValue) {
          var searchIndex = 0;
          angular.forEach($scope.cleanItems, function(item, key) {
            if (searchValue == item.value)
              searchIndex = key;
          });
          return searchIndex;
        }

        //here we will try to round the values to the items
        //and apply the value to the model
        function setAbs(val) {
          var prevValue = $scope.selectedValue || 0;
          var target = (Math.round(val / AMT)) * AMT;
          $timeout(function() {
            pickFrame.scrollTop = target;
            $scope.index = target / AMT;
            var toSetValue = $scope.cleanItems[$scope.index].value;
            if ($scope.maxValue != undefined) {
              let absvalue = 0;
              if (toSetValue != undefined && toSetValue.indexOf('/') >= 0) {
                absvalue = toSetValue.slice(0, toSetValue.indexOf('/'));
              }
              absvalue = parseInt(absvalue);
              console.log($scope.absvalue);

              if (absvalue > $scope.maxValue) {
                $scope.reachedMax = true;
                if ($scope.maxInchReached) {
                  setPos(prevValue);
                  $scope.error = "Max fractions is " + $scope.maxValue;
                  $timeout(function() {
                    $scope.reachedMax = false;
                    $scope.error = "";
                  }, 5000)
                  return;
                }
              } else {
                $scope.reachedMax = false;
              }

            }
            console.log('denom max ', $scope.reachedMax);
            $scope.selectedValue = toSetValue

            //$scope.checkFinalReading({cv : $scope.index, unit : $scope.munit, subCId : $scope.id});
          });
        }

        //go the target position
        function setPos(idx) {
          $timeout(function() {
            pickFrame.scrollTop = idx * AMT;
            $scope.index = idx;
          });
        }

        $scope.postRender = function() {
          //todo stuffs after the ng-repeat
        }

      }
    }
  })
  .directive('pickItem', function($timeout) {
    return {
      restrict: 'A',
      replace: false,
      scope: false,
      link: function($scope, elem, attrs) {

        //this is to inform all elements have been loaded
        if ($scope.$last === true) {
          $timeout(function() {
            $scope.postRender();
          });
        }
        //set the height of the item
        var item = angular.element(elem);
        item.css({
          'height': $scope.params.itemHeight + 'px',
          "padding-top": (($scope.params.itemHeight - 20) / 2) + "px",
          "width": $scope.params.width + "px"
        });
      }
    }
  });
