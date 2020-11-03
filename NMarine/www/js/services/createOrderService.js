app.service('createOrderService', function($q, $http, appConstants, $rootScope) {

  var customerId = appConstants.customerId;
  this.getAllDestinations = function(lat, long) {
    let reqData = "CustomerID=" + customerId + "&lat=" + lat + "&long=" + long;
    return $http.get(appConstants.baseUrl + appConstants.procedureServices.getAllDestinations + "?"+reqData)
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };
});