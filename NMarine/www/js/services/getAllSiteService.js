app.service('getAllSiteService', function($q, $http, appConstants, $rootScope, $localstorage) {
  var customerId = appConstants.customerId;
  $http.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';

  this.getAllSites = function() {
    console.log("onlineSites data");
    let reqData = "CustomerID="+customerId;
    return $http.get(appConstants.baseUrl + appConstants.procedureServices.getAllSites + "?" +reqData)
      .success(function(data) {
        return data;
      }).error(function(err) {
        void 0;
        return err;
      });
  };

  this.login = function(loginData) {
    var parameter = {
      "params": [{
        "name": "JsonValue",
        "param_type": "IN",
        "value": JSON.stringify(loginData)
      }]
    };
    
    var config = {
      timeout: 4000
    }
    let url = appConstants.baseUrl  + appConstants.procedureServices.login;
    void 0;
    return $http.post(url, parameter, config)
      .success(function(data) {
        return data;
      }).error(function(err) {
        return err;
      });
  };

  // FilteredSites based on current user Login
  this.filteredSites = (siteObj) =>{
    let data=[];
    if($localstorage.get('FilteredSite')){
      let getFilteredSites = $localstorage.get('FilteredSite');
      let filteredSitesArry = JSON.parse(getFilteredSites);
      if(filteredSitesArry!='' && filteredSitesArry.length > 0){
        siteObj.forEach(function(site, index) {
          if (filteredSitesArry.indexOf(site.SiteID) > -1) {
            data.push(site);
          }
        });
      }
    }
    else{
      data = siteObj;
    }
    return data;
  }
  
});
