app.directive('ngDate', function($timeout) {
  return {
    restric: 'EA',
    replace: true,
    templateUrl: 'ng-date-template.html',
    scope: { selectedDt: '=', setAfter: '@', setBefore: '@' },
    link: function($scope, elem, attrs) {
      //setting the min value
      $scope.saMoment = ($scope.setAfter != undefined && $scope.setAfter.length > 0) ? moment(($scope.setAfter).replace(/['"]+/g, '')).format('YYYY-MM-DDTHH:mm:ss.SSSSZ') : moment('1902-01-01').format('YYYY-MM-DDTHH:mm:ss.SSSSZ');
      $scope.sbMoment = ($scope.setBefore != undefined && $scope.setBefore.length > 0) ? moment(($scope.setBefore).replace(/['"]+/g, '')).format('YYYY-MM-DDTHH:mm:ss.SSSSZ') : moment('2100-01-01').format('YYYY-MM-DDTHH:mm:ss.SSSSZ');

      if (typeof $scope.selectedDt == "string")
        $scope.selectedDt = $scope.selectedDt.replace(/['"]+/g, '');

      //checking the received value from object
      if ($scope.selectedDt != 'Invalid Date') {
        if (moment($scope.selectedDt).isSameOrAfter($scope.saMoment)) {
          $scope.rvdDate = $scope.selectedDt;
        } else {
          //check is now greater then saMoment
          if (moment().isSameOrBefore($scope.saMoment))
            $scope.rvdDate = $scope.saMoment;
          else
            $scope.rvdDate = moment();
        }
      } else {
        $scope.rvdDate = moment();
      }

      //watching for changes in the input
      $scope.$watch('inpDate', function(nv, ov) {
        if (nv == null || nv == '') {
          $scope.inpDate = $scope.rvdDate;
          $scope.selectedDt = moment.parseZone($scope.inpDate).local().format('MM/DD/YYYY HH:mm');
          $scope.currDate = moment($scope.inpDate).format('MM/DD/YYYY HH:mm');
        } else if (nv != ov) {
          $scope.selectedDt = moment.parseZone(nv).local().format('MM/DD/YYYY HH:mm');
          $scope.currDate = moment($scope.selectedDt).format('MM/DD/YYYY HH:mm');
        } 
	else {
          $scope.selectedDt = moment.parseZone($scope.rvdDate).local().format('MM/DD/YYYY HH:mm');
          $scope.currDate = moment($scope.selectedDt).format('MM/DD/YYYY HH:mm');
        }
      });

      //assining default value to the input
      $scope.inpDate = $scope.rvdDate;
      $scope.currDate = moment($scope.rvdDate).format('MM/DD/YYYY HH:mm');
      var inp = angular.element(elem[0].querySelector('input.ng-dt-picker'));
      elem.on('click', function() {
        inp.triggerHandler('click');
      });
    }

  }
});
