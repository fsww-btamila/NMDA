app.directive('tankPicker', function($timeout) {
  return {
    restrict: 'EA',
    templateUrl: 'tank-picker-template.html',
    replace: true,
    scope: { selectedValue: '=', denom: '@', id: '@', maxFracts: '@', maxInch: '@', maxFeet: '@', selectedUnit: '=field', index: '@', error: '=', reachedMax: '=', maxDenomReached: '=', maxValue: "@" },
    link: function($scope, elem, attrs) {

      console.log("max values", $scope.maxFracts, $scope.maxInch, $scope.maxFeet);

      //$scope.pristine = true;
      $scope.fieldChanged = false;
      $scope.id = $scope.id || 0;
      var tankPicker = angular.element(elem[0]);
      $scope.showError = false;
      $scope.direct = $scope.id == "direct" ? true : false;
      var maxDenomStr = $scope.maxFracts > 0 ? $scope.maxFracts : "";
      //$scope.selectedUnit[$scope.id] = "feet";
      if (!$scope.selectedValue) $scope.selectedValue = { feet: 0, inches: 0, fracts: 0 };

      function init() {
        $timeout(function() {
          //$scope.selectedUnit[$scope.id] = "feet";
          $scope.maxFeet = parseInt($scope.maxFeet) || 0;
          $scope.maxInch = (isNaN($scope.maxInch)) ? 11 : parseInt($scope.maxInch);
          $scope.maxFracts = (isNaN($scope.maxFracts)) ? parseInt($scope.denom) : parseInt($scope.maxFracts);
        });
      }
      init();

      function buzz(txt) {
        $scope.errorText = txt;
        $scope.error = txt;
        $scope.showError = true;
        var buzztimeout = $timeout(function() {
          $scope.showError = false;
          $scope.error = '';
        }, 3000);
      }

      var checkMax = function(val) {
        console.log($scope.maxDenomReached);
        let feet = $scope.selectedUnit[$scope.id] == "feet" ? val : parseInt($scope.selectedValue.feet);
        let inch = $scope.selectedUnit[$scope.id] == "inch" ? val : parseInt($scope.selectedValue.inch);
        let fracts = $scope.selectedUnit[$scope.id] == "fracts" ? val : parseInt($scope.selectedValue.fracts);


        if (inch > 11) {
          $scope.selectedValue.feet = 0;
          let maxWholeInches = ($scope.maxFeet * 12) + $scope.maxInch;
          if (inch > maxWholeInches) {
            buzz("max inch is " + maxWholeInches);
            return false;
          }

          if (inch == maxWholeInches) {
            if ($scope.maxDenomReached) {
              $scope.reachedMax = false;

              buzz("max value is " + $scope.maxFeet + 'ft and ' + $scope.maxInch + "in" + maxDenomStr);
              return false;
            } else {
              $scope.reachedMax = true;
            }
          } else {
            $scope.reachedMax = false
          }
        } else if ($scope.maxFeet != undefined && feet > $scope.maxFeet) {
          buzz("max feet is " + $scope.maxFeet);
          return false;
        } else if ($scope.maxFeet != undefined && feet == $scope.maxFeet) {
          if (inch > $scope.maxInch && $scope.maxfeet != 0) {
            $scope.selectedValue.feet = 0;
            buzz("max value is " + $scope.maxFeet + 'ft and ' + $scope.maxInch + "in" + maxDenomStr);
            $scope.reachedMax = false;
            return true;
          } else if (inch > $scope.maxInch && $scope.maxfeet == 0) {
            buzz("max inch is " + $scope.maxInch);
            return false
          } else if (inch == $scope.maxInch) {
            $scope.reachedMax = true;
            if ($scope.maxDenomReached) {
              buzz("max value is " + $scope.maxFeet + 'ft and ' + $scope.maxInch + "in" + maxDenomStr);
              return false;
            }
          } else {
            $scope.reachedMax = false;
          }
        }
        return true;



        // if($scope.maxFeet != undefined && feet > $scope.maxFeet){

        // 	buzz("max feet is " + $scope.maxFeet);
        // 	return false;
        // }else if($scope.maxFeet != undefined && feet == $scope.maxFeet){
        // 	if(inch == 11){
        // 		$scope.reachedMax = true;
        // 	}
        // 	if( inch > 11){
        // 		$scope.selectedValue.feet = 0;
        // 		let maxWholeInches = ($scope.maxFeet * 12) + $scope.maxInch;
        // 		if(inch > maxWholeInches){
        // 			buzz("max inch is "+ maxWholeInches);
        // 			return false;
        // 		}
        // 		// buzz();
        // 		// return false;
        // 	}else{
        // 		$scope.reachedMax = false;
        // 	}

        // 	// if($scope.maxInch != undefined && inch > $scope.maxInch){
        // 	// 	buzz();
        // 	// 	return false;
        // 	// }else if($scope.maxInch != undefined && inch == $scope.maxInch){
        // 	// 	if($scope.maxFracts != undefined && fracts > $scope.maxFracts){
        // 	// 		buzz();
        // 	// 		return false;
        // 	// 	}
        // 	// }
        // } 

        // return true;

      }


      $scope.enterValue = function(x) {
        // if($scope.pristine){
        // 	$scope.selectedValue[$scope.selectedUnit[$scope.id]] = 0;							
        // 	$scope.pristine = false;
        // }
        //let replace = true;

        if ($scope.fieldChanged) {
          $scope.selectedValue[$scope.selectedUnit[$scope.id]] = 0;
          $scope.fieldChanged = false;
        }

        if ($scope.selectedUnit[$scope.id] == "feet" && $scope.selectedValue.inch > 11) {
          $scope.selectedValue.inch = 0;
        }

        if ($scope.direct) {
          let cval = parseInt($scope.selectedValue[$scope.selectedUnit]) || 0;
          let nval = (cval * 10) + parseInt(x);
          if (nval <= parseInt($scope.maxValue))
            $scope.selectedValue[$scope.selectedUnit] = nval;
        } else {
          if ($scope.selectedUnit[$scope.id] == 'fracts') {
            let cval = $scope.selectedValue[$scope.selectedUnit[$scope.id]] || 0;
            let nval = 0;
            if (cval.length > 2) {
              cval = cval.slice(0, cval.indexOf('/'));
            }
            if (cval > $scope.denom) return;
            if (x != 0) {
              nval = ((parseInt(cval) * 10) + (x));
              if (checkMax(nval) && nval <= $scope.denom) $scope.selectedValue[$scope.selectedUnit[$scope.id]] = nval + '/' + $scope.denom;
            }
          } else {
            let cval = parseInt($scope.selectedValue[$scope.selectedUnit[$scope.id]]) || 0;
            let nval = (cval * 10) + parseInt(x)
            if (checkMax(nval)) $scope.selectedValue[$scope.selectedUnit[$scope.id]] = nval;
          }
        }
      }

      $scope.selectUnit = function(unit) {
        $scope.selectedUnit[$scope.id] = unit;
        //$scope.field[$scope.index] = unit === "feet" ? 0 : 1;
      }

      $scope.backspace = function() {
        if ($scope.selectedUnit[$scope.id] == 'fracts') {
          let cval = $scope.selectedValue[$scope.selectedUnit[$scope.id]] || 0;
          if (cval.length > 2) {
            cval = cval.slice(0, cval.indexOf('/'));
            $scope.selectedValue[$scope.selectedUnit[$scope.id]] = parseInt((parseInt(cval) / 10)) + '/' + $scope.denom;
          }
        } else {
          let cval = $scope.selectedValue[$scope.selectedUnit[$scope.id]];
          if (cval) {
            $scope.selectedValue[$scope.selectedUnit[$scope.id]] = parseInt(cval / 10);
          }
        }
      }

      $scope.clear = function() {
        if ($scope.direct)
          $scope.selectedValue[$scope.selectedUnit] = "";
        else
          $scope.selectedValue[$scope.selectedUnit[$scope.id]] = "";

        $scope.reachedMax = false;
      }

      $scope.next = function() {
        console.log('next is clicked');
      }

      $scope.$watch('selectedUnit', function(nv, ov) {
        $scope.fieldChanged = true;
      }, true);
    }
  }
});