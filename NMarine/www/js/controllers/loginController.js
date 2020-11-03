app.controller('loginController', function($scope, $rootScope, appConstants, $localstorage) {
  $scope.lastLogin = $localstorage.get('lastlogin');
  $rootScope.stOrdersBackground = false;
  if ($scope.lastLogin) {
    $scope.data = JSON.parse($scope.lastLogin);
    $rootScope.uName = ($scope.data[1].uname != undefined) ? $scope.data[1].uname : '';
    $rootScope.uid = ($scope.data[1].uid != undefined) ? $scope.data[1].uid : '';
    $rootScope.selectedSite = $scope.data[0];
  }
  $scope.db = config.database;
  $rootScope.appVersion = $rootScope.appVersion || config.version;
  $rootScope.showSearch = false;
  if (!window.cordova) {
    $rootScope.loginData = { "uname": $rootScope.uName || 'agerhold', "pword": "cam041811" };
  } else {
    $rootScope.loginData = { "uname": $rootScope.uName };
  }

  $localstorage.setObject('lastStatus', null);
  $rootScope.submitted = false;
  $scope.findLatLng = function() {
    var posOptions = { enableHighAccuracy: false, maximumAge: Infinity, timeout: 60000 };
    navigator.geolocation.getCurrentPosition(
      function(position) {
        $rootScope.CurrLat = position.coords.latitude;
        $rootScope.CurrLong = position.coords.longitude;
      },
      function(err) {
        alert("Unable to find Location")
      }, posOptions);
    //alert("Finding Lat lng");
  }
  $scope.getSelectedText = function() {
    if ($rootScope.selectedSite !== null) {
      return $rootScope.selectedSite.Code;
    } else {
      return "Select Site";
    }
  };
});