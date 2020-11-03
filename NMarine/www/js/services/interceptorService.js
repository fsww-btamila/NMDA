app.service('LoadingInterceptor', ['$q', '$rootScope', '$log', function($q, $rootScope, $log) {
  'use strict';
  var numLoadings = 0;
  void 0;
  return {
    request: function(config) {
      if ($rootScope.showLoading == false) {
        $rootScope.loading = $rootScope.showLoading;
      } else {
        // $rootScope.loading = true;
      }
      numLoadings++;
      return config;
    },
    requestError: function(rejection) {

      if ((--numLoadings) === 0) {
        $rootScope.loading = false;
      }
      $rootScope.loading = false;
      $log.error('Request error:', rejection);
      void 0;
      return $q.reject(rejection);
    },
    response: function(response) {
      if ((--numLoadings) === 0) {
        $rootScope.loading = false;
      }
      return response;
    },
    responseError: function(rejection) {
      if ((--numLoadings) === 0) {
        $rootScope.loading = false;
      }
      $rootScope.loading = false;
      $log.error('Response error:', rejection);
      return $q.reject(rejection);
    }
  };

}]);
