app.controller('tankReadingController', function($scope, $rootScope, $ionicModal, $ionicPopover, addOrderService, $localstorage, $stateParams, $state, getAllSiteService) {
  $scope.pageTitle = 'Tank Readings';
  $scope.siteID = $rootScope.MasterSiteID;
  $scope.selectedInSite = angular.copy($rootScope.selectedSite);
  $rootScope.closeSettingsPopover();
  $scope.goBack = function() {
    setTimeout(function() {
      $state.go('orders');
    }, 0);
  }

  $scope.showTankModal = function(tankInput, site) {
    $scope.activeTankInput = tankInput;
    $scope.loadTanks(tankInput, site, function() {
      $scope.addtankmodal.show();
    })
  }

  $ionicModal.fromTemplateUrl('addInsiteModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.insitemodal = modal;
  });

  $ionicModal.fromTemplateUrl('addTankModal.html', {
    scope: $scope,
    animation: 'none',

  }).then(function(modal) {
    $scope.addtankmodal = modal;
  });

  $scope.closeModal = function(name) {
    $scope[name].hide();
  };

  $scope.loadInsites = function() {
    if ($rootScope.isInternet && $rootScope.online) {
      getAllSiteService.getAllSites().then(function(response) {
        $scope.insites = getAllSiteService.filteredSites(response.data);
        // $scope.insites = angular.copy(response.data);
      });
    } else {
      $rootScope.getSiteData(1);
    }
    /* Reset confirm source tank modal data */
    $scope.sourceTanks = [];
    $scope.addTank($scope.sourceTanks);
  }

  $scope.loadTanks = function (type, site, cb) {
    var siteID;
    addOrderService.getSourceTanks($scope.selectedInSite.SiteID, null)
      .then(getCompartments)

    function getCompartments(tanks) {
      $scope.sourceTanks = tanks.data;
      if (cb) {
        cb();
      }
    }
  }

  $scope.addTank = function(tank) {
    $scope.selectedInTank = angular.copy(tank);
  }

  $scope.addInsite = function(insite) {
    $scope.selectedInSite = angular.copy(insite);
    if ($rootScope.CompanyID != $scope.selectedInSite.CompanyID) {
      $rootScope.CompanyID = $scope.selectedInSite.CompanyID
    }
  }

  $scope.goTankBE = function() {
    setTimeout(function() {
      $state.go('tankBE', { tank: 'Start', tstate: $scope.selectedInTank, tankID: $scope.selectedInTank.TankID || Math.random(), tankType: 'Source', InSiteID: $scope.selectedInSite.SiteID, uniqueId: Math.random() });
    }, 0);
  }

  $scope.goTankBack = function() {
    setTimeout(function() {
      $state.go('tanks');
    }, 0);
  }

});