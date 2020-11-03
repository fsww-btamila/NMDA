app.controller('addOrderController', function($ionicPlatform, $scope, $rootScope, $ionicModal, $ionicPopover, $localstorage, $filter, addOrderService, ordersListService, $stateParams, $state, $q, $timeout, $cordovaSQLite, OrderList, $ionicPopup) {
  $scope.pageTitle = 'Add Order';
  $scope.today = new Date();
  $scope.appState = "Create";
  $scope.moreData = true;
  $scope.moreVessels = true;
  $scope.prdSearch = { 'searchText': '' };
  $scope.vslSearch = { 'searchText': '' };
  $scope.searchVehicle = { 'searchText': '' };
  $scope.searchTank = { 'searchText': '' };
  $scope.searchDriver = { 'searchText': '' };
  $scope.searchInsite = { 'searchText': '' };
  $scope.settings = {};
  $scope.settings.showOptions = false;

  function addTag() {

  }

  $scope.__tag = new addTag();

  $scope.findMaxSystrxLine = function(items) {
    var maxSystrxLine;
    angular.forEach(items, function(value) {
      if (maxSystrxLine) {
        if (value.SysTrxLine > maxSystrxLine) {
          maxSystrxLine = value.SysTrxLine;
        }
      } else {
        maxSystrxLine = value.SysTrxLine;
      }
    })
    return maxSystrxLine;
  }
  var searchVesselParams = { 'MinRecord': 1, 'MaxRecord': 20, 'SearchText': '' };
  var lazyLoadParams = { 'MinRecord': 1, 'MaxRecord': 20, 'SearchText': '' };

  $scope.clearLazyParams = function() {
    searchVesselParams = { 'MinRecord': 1, 'MaxRecord': 20, 'SearchText': '' };
    lazyLoadParams = { 'MinRecord': 1, 'MaxRecord': 20, 'SearchText': '' };
  }
  var isPopoverShow = null;

  setTimeout(function() {}, 1000);

  if (OrderList) {
    $scope.OrderList = OrderList;
    $rootScope.EnableElectronicDOI = $scope.OrderList.Orders.OrderHdr.EnableElectronicDOI;
    if ($scope.OrderList.Orders.OrderHdr.InternalTransferOrder == 'N') {
      if ($scope.OrderList.Orders.OrderHdr.Vessels && $scope.OrderList.Orders.OrderHdr.Vessels.length > 0) {
        $scope.OrderList.Orders.OrderHdr.Vessels[0].VesselCode = $scope.OrderList.Orders.OrderHdr.Vessels[0].VesselCode;
      }
    }
    $localstorage.set('lastEditedOrder', $scope.OrderList.Orders.OrderHdr.OrderNo);
    $localstorage.set('lastEditedSysTrxNo', $scope.OrderList.Orders.OrderHdr.SysTrxNo);
    if (!$scope.OrderList.Orders.OrderHdr.PlannedDate) {
      $scope.OrderList.Orders.OrderHdr.PlannedDate = new Date($scope.OrderList.Orders.OrderHdr.OrderDtTm);
    } else {
      $scope.OrderList.Orders.OrderHdr.PlannedDate = new Date($scope.OrderList.Orders.OrderHdr.OrderDtTm);
    }
    if (!$scope.OrderList.Orders.OrderHdr.maxSystrxLine) {
      $scope.OrderList.Orders.OrderHdr.maxSystrxLine = $scope.findMaxSystrxLine($scope.OrderList.Orders.OrderItems);
    }

    if ($scope.OrderList.Orders.OrderHdr.Status == 'En Route') {
      $scope.pageTitle = 'En Route';
    } else if ($scope.OrderList.Orders.OrderHdr.Status == 'Shipping in Progress') {
      $scope.enableShipping = true;
      $scope.pageTitle = "Shipping in Progress";
    } else if ($scope.OrderList.Orders.OrderHdr.Status == 'Delivery in Progress') {
      $scope.enableDelivery = true;
      $scope.pageTitle = "Delivery in Progress";
    } else if ($scope.OrderList.Orders.OrderHdr.Status == 'Delivered') {
      $scope.enableDelivery = true;
      $scope.pageTitle = "Delivered";
    } else {
      $scope.pageTitle = 'Edit Order';
    }
  } else {
    $scope.OrderList = {};
    $scope.OrderList.Orders = {};
    $scope.OrderList.Orders.OrderItems = [];
    $scope.OrderList.Orders.billingItems = [];
    $scope.billingItems = $scope.OrderList.Orders.billingItems;
    $scope.OrderList.Orders.OrderHdr = {};
    $scope.OrderList.Orders.OrderHdr.Vessels = [];
    $scope.OrderList.Orders.OrderHdr.Destination = {};
    $scope.OrderList.Orders.OrderHdr.Driver = false;
    $scope.OrderList.Orders.OrderHdr.Vehicle = {};
    $scope.OrderList.Orders.activeAction = "Ship";
    $scope.OrderList.Orders.OrderHdr.StatusCode = "O";
    $scope.OrderList.Orders.OrderHdr.InternalTransferOrder = "N";
    if (!$scope.OrderList.Orders.OrderHdr.Status) {
      $scope.OrderList.Orders.OrderHdr.Status = "Open";
      $scope.OrderList.Orders.OrderHdr.StatusCode = "O";
    }
    $scope.OrderList.Orders.OrderHdr.PlannedDate = new Date();
    if ($rootScope.selectedSite && $rootScope.selectedSite.Code) {
      $scope.OrderList.Orders.OrderHdr.INSiteCode = $rootScope.selectedSite.Code;
    } else {
      $scope.OrderList.Orders.OrderHdr.INSiteCode = "Gilsberg 1278";
    }
    if ($stateParams.isCod) {
      $scope.OrderList.Orders.OrderHdr.POD = true;
    }
    if ($rootScope.loginData)
      $scope.OrderList.Orders.OrderHdr.EnteredBy = $rootScope.loginData.uname;
    addOrderService.getOrderNo().then(function(res) {
      $scope.OrderList.Orders.OrderHdr.OrderNo = res.data[0].OrderNo.toString();
    })
    $scope.OrderList.Orders.transferDetails = {};
    $scope.OrderList.Orders.shiftDetails = {};
    $scope.OrderList.Orders.shiftDetails.Ship = {};
    $scope.OrderList.Orders.shiftDetails.Deliver = {};
    $scope.OrderList.Orders.shiftDetails.Ship.Delivering = [];
    $scope.OrderList.Orders.shiftDetails.Ship.Receiving = [];
    $scope.OrderList.Orders.shiftDetails.Deliver.Delivering = [];
    $scope.OrderList.Orders.shiftDetails.Deliver.Receiving = [];
    $scope.OrderList.Orders.OrderDeliveryDetail = {};
  }
  $scope.header = $scope.OrderList.Orders.OrderHdr;
  $scope.general = $scope.OrderList.Orders.OrderHdr;
  $scope.activeAction = $scope.OrderList.Orders.activeAction;

  if ($scope.header.Status != "Open" && $scope.header.Status != "Shipping in Progress") {
    setTimeout(function() {
      $("ol.cd-breadcrumb").animate({ scrollLeft: $("ol.cd-breadcrumb").width() }, 1000);
    }, 1000);
  }

  if ($stateParams.customer) {
    $scope.OrderList.ToSiteID = $stateParams.customer.ShipToId;
    $scope.general.CustomerName = $stateParams.customer.CustomerName;
    $scope.general.CustomerNumber = $stateParams.customer.StandardAcctNo;
    $scope.general.CustomerAddress = $stateParams.customer.FormattedAddress;
    $scope.general.ToSiteID = $stateParams.customer.ShipToId;
  }

  $scope.cod = $scope.OrderList.Orders.OrderHdr.POD;
  $scope.uom = 'gallons';
  $ionicPopover.fromTemplateUrl('selectVehicle.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.vehiclepopover = popover;
  });
  $ionicPopover.fromTemplateUrl('selectDriver.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.driverpopover = popover;
  });
  $scope.showpopover = function(name) {
    $scope[name].show(angular.element(document.querySelector('.' + name)));
  }
  $scope.hidepopover = function(name) {
    $scope[name].hide();
  }
  $scope.OrderList.favouriteOrder = false;
  $scope.numericIn = {};
  $scope.numericIn.quantity = '';
  $ionicModal.fromTemplateUrl('addProductModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.addmodal = modal;
  });
  $ionicModal.fromTemplateUrl('productQuantityModal.html', {
    scope: $scope,
    animation: 'none',
    backdropClickToClose: false
  }).then(function(modal) {
    $scope.quantitymodal = modal;
  });
  $ionicModal.fromTemplateUrl('addVesselModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.vesselmodal = modal;
  });
  $ionicModal.fromTemplateUrl('addLocationModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.locationmodal = modal;
  });
  $ionicModal.fromTemplateUrl('addDriverModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.drivermodal = modal;
  });
  $ionicModal.fromTemplateUrl('addVehicleModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.vehiclemodal = modal;
  });
  $ionicModal.fromTemplateUrl('transfer.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.transfermodal = modal;
  });
  $ionicModal.fromTemplateUrl('transferTitle.html', {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none',

  }).then(function(modal) {
    $scope.transfertitlemodal = modal;
  });

  $scope.openModal = function(name) {
    if ($scope.currentItem) {
      $scope.numericIn.quantity = $scope.currentItem.Qty;
    }
    $scope[name].show();
    if ($scope.products.length == 0) {
      $scope.loadProducts();
      $scope.loadShortcuts();
    }
    if ($scope.vessels.length == 0) {
      $scope.loadVessels();
    }
    if ($scope.marineLocation.length == 0) {
      if (window.cordova) {
        $scope.loadLocations();
      }
    }
  };
  $scope.closeModal = function(name) {
    $scope[name].hide();
    if (name == 'transfertitlemodal') {
      $scope.transfertitlemodal.remove();
      $ionicModal.fromTemplateUrl('transferTitle.html', {
        scope: $scope,
        backdropClickToClose: false,
        animation: 'none',

      }).then(function(modal) {
        $scope.transfertitlemodal = modal;
      });
      $scope.transferTitleError = false;
      $scope.transferNameError = false;
    }
    if (name == 'quantitymodal') {
      $scope.itemNotesEUscape($scope.OrderList.Orders.OrderItems, 0);
    }
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.transfertitlemodal.remove().then(function() {
      $scope.transfertitlemodal = null;
    });
    $scope.addmodal.remove().then(function() {
      $scope.addmodal = null;
    });
    $scope.quantitymodal.remove().then(function() {
      $scope.quantitymodal = null;
    });
    $scope.vesselmodal.remove().then(function() {
      $scope.vesselmodal = null;
    });
    $scope.locationmodal.remove().then(function() {
      $scope.locationmodal = null;
    });
    $scope.drivermodal.remove().then(function() {
      $scope.drivermodal = null;
    });
    $scope.vehiclemodal.remove().then(function() {
      $scope.vehiclemodal = null;
    });
    $scope.transfermodal.remove().then(function() {
      $scope.transfermodal = null;
    });
    $scope.vehiclepopover.remove().then(function() {
      $scope.vehiclepopover = null;
    });
    $scope.driverpopover.remove().then(function() {
      $scope.driverpopover = null;
    });
    //  $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });
  $scope.setfavourite = function() {
    void 0;
    $scope.OrderList.Orders.OrderHdr.FavouriteOrder = !$scope.OrderList.Orders.OrderHdr.FavouriteOrder;
  }
  $scope.vesselType = 'vessel';

  $scope.setVesselType = function(type) {
    $scope.vesselType = type;
    $scope.newvessel = {};
    $scope.newvessel.name = $scope.vslSearch.searchText;
  }

  $scope.products = [];
  $scope.loadProducts = function() {
    addOrderService.getProducts(lazyLoadParams, $scope.OrderList.Orders.OrderHdr.Status, function(products) {
      if (products && products.length != null) {
        if (products.length == 0) {
          $scope.moreData = false;
        } else if ($scope.products) {
          $scope.moreData = true;
          $scope.products = $scope.products.concat(products);
        } else if (products.length > 0) {
          $scope.products = products;
          $scope.moreData = true;
        }
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }

    })
  };

  $scope.loadSearchProducts = function(newSearch) {
    $scope.products = [];
    var searchProductText = $scope.prdSearch.searchText;
    if (searchProductText == newSearch) {
      lazyLoadParams.SearchText = newSearch;
      addOrderService.getProducts(lazyLoadParams, $scope.OrderList.Orders.OrderHdr.Status, function(products) {
        $scope.products = products;
      });
    }
  };

  $scope.$watch('prdSearch', function(newVal, oldVal) {
    if (newVal != oldVal && (newVal.searchText.length == 0 || newVal.searchText.length > 2)) {
      (function(st) {
        if (st) {
          $scope.$broadcast('scroll.infiniteScrollComplete');
          $scope.moreData = false;
        } else {
          $scope.moreData = true;
          $scope.clearLazyParams();
        }
        setTimeout(function() {
          $scope.loadSearchProducts(st);
        }, 1000)
      })(newVal.searchText)

    }
  }, true)

  $scope.notOnList = false;
  $scope.loadSearchVessels = function(newSearch) {
    $scope.vessels = [];
    var searchVesselText = $scope.vslSearch.searchText;
    if (searchVesselText == newSearch) {
      searchVesselParams.SearchText = newSearch;
      addOrderService.getVessels(searchVesselParams, function(vessels) {
        $scope.vessels = vessels;
        if (newSearch) {
          $scope.moreVessels = false;
        } else {
          $scope.moreVessels = true;
        }
      });
    }
  };

  $scope.$watch('vslSearch', function(newVal, oldVal) {
    if (newVal != oldVal && (newVal.searchText.length == 0 || newVal.searchText.length > 2)) {
      (function(st) {
        if (st) {
          $scope.$broadcast('scroll.infiniteScrollComplete');
        } else {
          $scope.moreVessels = true;
          $scope.clearLazyParams();
        }
        setTimeout(function() {
          $scope.loadSearchVessels(st);
        }, 1000)
      })(newVal.searchText)

    }
  }, true)
  $scope.vessels = [];
  $scope.loadVessels = function() {
    addOrderService.getVessels(searchVesselParams, function(vessels) {
      if (vessels && vessels.length != null) {
        if (vessels.length == 0) {
          $scope.moreVessels = false;
        } else if ($scope.vessels) {
          $scope.moreVessels = true;
          $scope.vessels = $scope.vessels.concat(vessels);
        } else if (vessels.length > 0) {
          $scope.vessels = vessels;
          $scope.moreVessels = true;
        }
        $scope.$broadcast('scroll.infiniteScrollComplete');
      }
    })
  }
  $scope.loadVehicles = function() {
    addOrderService.getVehicles(function(vehicles) {
      $scope.vehicles = vehicles;
    })
  }
  $scope.loadInsites = function() {
    addOrderService.getInsites(function(insites) {
      $scope.insites = insites.slice(0, 10);
      void 0;
    })
  }
  $scope.loadShortcuts = function() {
    void 0;
    addOrderService.getShortcuts(function(shortcuts) {
      $scope.shortcuts = shortcuts
      void 0;
    })
  }
  $scope.availability = {};

  $scope.filterAvailabilityItems = function(items) {
    var arrayofObj = _.uniqBy(items, function(e) {
      return e.MasterProdID;
    })
    return arrayofObj;
  }

  $scope.getAvailability = function(insite) {
    var items = $scope.filterAvailabilityItems($scope.OrderList.Orders.OrderItems);
    var itemArray = []
    angular.forEach(items, function(value, key) {
      if (value.IsBillable == 'N') itemArray.push({ 'ProductID': parseInt(value.MasterProdID) });
    });
    var jsonItems = {
      "OnHandQty": {
        "CompanyID": $rootScope.CompanyID,
        "CustomerID": insite.CustomerID,
        "SiteID": insite.SiteID,
        "Products": itemArray
      }
    }

    addOrderService.getAvailability(jsonItems).then(function(response) {
      if (response.status == 200) {
        $scope.availabilityList = response.data;
      }
    });
  }

  if ($scope.OrderList.Orders.OrderHdr.Status != 'Delivered') {
    // loadVessels();
    // $scope.getAvailability($rootScope.selectedSite);
  }
  //$scope.loadVessels();
  $scope.loadProducts();
  $scope.loadShortcuts();
  // loadVehicles();

  $scope.itemList = [];
  $scope.setCurrentItem = function(item) {
    $scope.currentItemUOM = item.OnCountUOM || item.BIUOM;
    $scope.currentItem = angular.copy(item);
    $scope.numericIn.quantity = $scope.currentItem.Qty || '';
  }
  $scope.setCurrentItemfromShortcut = function(itemIndex) {
    $scope.currentItem = angular.copy($scope.shortcuts[itemIndex]);
    $scope.currentItemUOM = $scope.currentItem.OnCountUOM || $scope.currentItem.BIUOM;
    $scope.numericIn.quantity = $scope.currentItem.Qty || '';
  }
  $scope.deleteItem = function() {
    if (!$scope.OrderList.Orders.currentSystrxLine) {
      $scope.OrderList.Orders.currentSystrxLine = $scope.OrderList.Orders.OrderHdr.maxSystrxLine;
    }

    var index = $scope.OrderList.Orders.OrderItems.indexOf($scope.currentItem);
    if (index != -1) {
      $scope.OrderList.Orders.OrderItems.splice(index, 1);
      $scope.orderItemLength = $scope.OrderList.Orders.OrderItems.length;
      $scope.saveOrder();
    }
    // $scope.getAvailability($rootScope.selectedSite);
  }
  $scope.addItem = function() {
    if (!$scope.itemExists()) {
      $scope.formOrderItems($scope.currentItem);
      if ($scope.activeAction == 'Deliver') {
        $scope.OrderList.Orders.ClearDeliveryTicketSign = true;
      }
    }
    $scope.saveOrder();
  }
  $scope.itemExists = function() {
    if ($scope.OrderList.Orders.OrderItems.length > 0)
      return ($scope.OrderList.Orders.OrderItems.indexOf($scope.currentItem) > -1)
  }
  $scope.createVessel = function(vessel) {
    if (vessel.name != undefined) {
      addOrderService.postAdHocVessel(vessel.name, vessel.grosstonnage, vessel.imo, vessel.additionalnotes).then(function(response) {
        if (response.data[0].StatusNew == "Success") {
          var vsl = { VesselID: response.data[0].VesselID, VesselCode: vessel.name, IMO: vessel.imo, GrossTonnage: vessel.grosstonnage, AdditionNotes: vessel.additionalnotes };
          $scope.addVessel(vsl);
        } else {
          $scope.mdaAlert('Error', 'Could Not Add Vessel', 0);
        }
      });
    }
  }
  $scope.addVessel = function(vessel) {
    var VesselAdd = true;
    angular.forEach($scope.OrderList.Orders.OrderHdr.Vessels, function(value, key) {
      if (value.VesselID == parseInt(vessel.VesselID)) {
        VesselAdd = false;
      }
    });
    if (VesselAdd) {
      $scope.OrderList.Orders.OrderHdr.Vessels.push(vessel);
      $scope.OrderList.Orders.OrderItems.forEach(function(item) {
        if (item.Deliver) {
          item.Deliver.vessel = vessel;
        }
      });
    }
    $scope.closeModal('vesselmodal');
  }

  $scope.addDestination = function(destination) {
    $scope.OrderList.Orders.OrderHdr.Destination = destination;
  }
  $scope.addVehicle = function(vehicle) {
    $scope.general.Vehicle = vehicle;
  }
  $scope.addDriver = function(driver) {
    $scope.general.Driver = driver;
  }

  $scope.setInsite = function(insite) {
    $scope.currentInsite = insite;
    void 0;
  }

  $scope.getReceivingContactsText = function(searchText) {
    var results = ordersListService.getContacts(searchText, $scope.general.ShiptoID).then(function(response) {
      var newArray = [];
      angular.forEach(response.data, function(v, k) {
        newArray.push(v);
      });
      return newArray;
    });
    var deferred = $q.defer();
    $timeout(function() { deferred.resolve(results); }, Math.random() * 1000, false);
    return deferred.promise;
  }

  $scope.receivingContactSelected = function(item) {
    if (item != undefined) {
      $scope.general.ReceivingContactNumber = item.PhoneNo;
      $scope.general.ReceivingContactName = item.FullName;
    }
  };

  $scope.QtyFormModel = function(formValid) {
    if (formValid) {
      $scope.submitted = false;
      $scope.closeModal('quantitymodal');
      $scope.currentItem.Qty = $scope.numericIn.quantity;
      $scope.addItem();
    }

  };
  $scope.isBulk = function() {
    //try to determine if entire order is Bulk

    var orderBulk
    var bulk;
    angular.forEach($scope.OrderList.Orders.OrderItems, function(item) {
      if (item.IsPackaged == 'N') {
        bulk = true;
      }
      if (item.IsBillable == 'Y') {
        if (item.BIUOM != 'Gallons') {
          bulk = false;
        }
      }
      if (item.IsBulk == 'Y') {
        bulk = true;
      }
      if (bulk) {
        orderBulk = true;
      }
    })

    return orderBulk;
  }


  $scope.isItemBulk = function(item) {
    //try to determine if entire order is Bulk
    var bulk;
    if (item.IsPackaged == 'N') {
      bulk = true;
    }
    if (item.IsBillable == 'Y') {
      if (item.BIUOM != 'Gallons') {
        bulk = false;
      }
    }
    if (item.IsBulk == 'Y') {
      bulk = true;
    }
    return bulk;
  }


  $scope.saveOrder = function() {
    $scope.orderDT = moment.utc(); // Current Date & time
    $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
    $scope.OrderList.Orders.cTs = $scope.orderTs;
    $scope.OrderList.Orders.DeviceID = $rootScope.deviceUid || 'Browser';
    $rootScope.loading = true;
    var OrderNo = $scope.OrderList.OrderNo;
    $scope.OrderList.Orders.OrderHdr.CompanyID = $rootScope.CompanyID;
    $scope.OrderList.Orders.OrderHdr.appVersion = $rootScope.appVersion;
    if (!$scope.OrderList.Orders.OrderHdr.DtTm)
      $scope.OrderList.Orders.OrderHdr.DtTm = new Date();
    if (!$scope.OrderList.Orders.OrderHdr.LastStatusDate)
      $scope.OrderList.Orders.OrderHdr.LastStatusDate = new Date();
    if (!$scope.OrderList.Orders.OrderHdr.OrderActivityLogs)
      $scope.OrderList.Orders.OrderHdr.OrderActivityLogs = [];
    $scope.OrderList.Orders.OrderHdr.Longitude = '';
    $scope.OrderList.Orders.OrderHdr.Latitude = '';
    $scope.OrderList.Orders.OrderHdr.DeviceID = 'Browser'
    $scope.OrderList.Orders.OrderHdr.DeviceTime = $rootScope.getCurrentDateTime();
    if ($scope.OrderList.Orders.OrderHdr.Status != "Open") {
      $scope.OrderList.Orders.OrderHdr.currentUser = $rootScope.loginData.uname;
    } else {
      $scope.OrderList.Orders.OrderHdr.currentUser = null;
    }
    if ($scope.OrderList.Orders.OrderHdr.Vehicle && $scope.OrderList.Orders.OrderHdr.Vehicle.VehicleID) {
      $scope.OrderList.Orders.OrderHdr.VehicleID = $scope.OrderList.Orders.OrderHdr.Vehicle.VehicleID;
    }
    if (!$scope.OrderList.Orders.OrderHdr.Status) {
      $scope.OrderList.Orders.OrderHdr.Status = "Open";
      $scope.OrderList.Orders.OrderHdr.StatusCode = "O";
    }
    if ($scope.OrderList.Orders.OrderHdr.Status == "Open" || $scope.OrderList.Orders.OrderHdr.Status == "En Route") {
      var bulk = $scope.isBulk();
      if ($scope.OrderList.Orders.skipDOIStart == undefined)
        $scope.OrderList.Orders.skipDOIStart = false;
      if (!bulk) {
        $scope.OrderList.Orders.skipDOIStart = true;
      }
    }
    $scope.order.OrderHdrData = $rootScope.formOrderHeaderJson($scope.OrderList.Orders.OrderHdr);
    $scope.updateSuccess = function(results) {
      $scope.updateOrderToDb();
    }
    $scope.insertSuccess = function(results) {
      $scope.updateOrderToDb();
      dbo.selectTable('OrdersMaster', "", [], $scope.showResults);
    }
    $scope.getCount = function(results) {
      if (results.success) {
        var len = results.data.rows.length;
        if (len > 0) {
          dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [$scope.OrderList.Orders.OrderHdr.SysTrxNo, $scope.OrderList.Orders.OrderHdr.Status, JSON.stringify($scope.OrderList), JSON.stringify($scope.order.OrderHdrData), $scope.OrderList.Orders.OrderHdr.SysTrxNo], $scope.updateSuccess);
        } else {
          dbo.insertTableData('OrdersMaster', ['orderNo', 'SysTrxNo', 'status', 'orderData', 'orderHdrData', 'dateTime'], [$scope.OrderList.Orders.OrderHdr.OrderNo, $scope.OrderList.Orders.OrderHdr.SysTrxNo, $scope.OrderList.Orders.OrderHdr.Status, JSON.stringify($scope.OrderList), JSON.stringify($scope.order.OrderHdrData), new Date()], $scope.insertSuccess);
        }
      }
    };

    dbo.selectTable('OrdersMaster', "orderNo=?", [$scope.OrderList.Orders.OrderHdr.OrderNo], $scope.getCount);
    $localstorage.set('lastStatus', $scope.OrderList.Orders.OrderHdr.Status);
    setTimeout(function() {
      $rootScope.loading = false;
      $scope.$apply();
    }, 300)
  };

  $scope.formOrderItems = function(item) {
    //item.Descr = $filter('escape')(item.Descr);
    //item.Code = $filter('escape')(item.Code);
    /* Sales contract code added. */
    if (window.cordova) {
      item.VendorProductxRef = "";
      if ($scope.OrderList.Orders.OrderHdr.Contracts) {
        var currDtime = moment.utc().valueOf();
        var query = "SELECT VendorProductxRef FROM SalesContractSalesAlias WHERE SalesAliasID=" + item.MasterProdID + " AND (StartDate<= " + currDtime + " AND ((EndDate >=" + currDtime + ") OR EndDate=0)) AND ( ";
        // var query = "SELECT VendorProductxRef FROM SalesContractSalesAlias WHERE SalesAliasID="+ item.MasterProdID;
        var contractsArr = $scope.OrderList.Orders.OrderHdr.Contracts.split(',');
        contractsArr.forEach(function(contract, index) {
          if (index < contractsArr.length - 1) {
            query = query + " ContractID = '" + contract + "' OR ";
          } else {
            query = query + " ContractID = '" + contract + "' )";
          }
        });

        console.log("query", query);
        $cordovaSQLite.execute(productDB, query, []).then(function(res) {
          var locationArr = [];
          var len = res.rows.length;
          if (len > 0) {
            for (var i = 0; i < len; i++) {
              var result = res.rows.item(i);
              item.VendorProductxRef = result.VendorProductxRef;
            }
          }
        }, function(err) {});
      }
    }

    item.MasterSiteID = $rootScope.MasterSiteID;
    item.INSiteCode = $scope.OrderList.Orders.OrderHdr.INSiteCode;
    item.Editable = true;
    item.Status = "Open";
    item.StatusCode = "O";
    item.RequestedDtTm = new Date();
    item.PromisedDtTm = new Date();
    item.DtTm = new Date();
    item.Ship = {};
    item.Ship.meterReadings = [{}];
    item.Ship.Source = [];
    item.Ship.Receiving = [];
    item.Deliver = {};
    item.Deliver.vessel = $scope.OrderList.Orders.OrderHdr.Vessels[0];
    if (item.IsBillable == 'Y') {
      item.Ship.overallStatus = 'finished';
      if ($scope.currentItem.BIEnableTankReadings == 'N') {
        //item.Deliver.quantityShipped = item.Qty;
      }

    }
    item.SysTrxNo = $scope.OrderList.Orders.OrderHdr.SysTrxNo;
    if ($scope.OrderList.Orders.currentSystrxLine) {
      $scope.OrderList.Orders.currentSystrxLine = $scope.OrderList.Orders.currentSystrxLine + 1;
      item.SysTrxLine = $scope.OrderList.Orders.currentSystrxLine;

    } else {
      item.SysTrxLine = $scope.OrderList.Orders.OrderHdr.maxSystrxLine + 1;
      $scope.OrderList.Orders.currentSystrxLine = item.SysTrxLine;
    }
    if (item.SellByUOMID != item.OnCountUOMID) {
      item.UOMChanged = true;
    }
    item.Deliver.Source = [];
    item.Deliver.Receiving = [];
    item.Deliver.meterReadings = [{}];
    item.deliveryList = [];
    // Tank reading validation flag - While adding a product on MDA App
    item.posSrcHideFinishBtn = 0;
    item.posRecvHideFinishBtn = 0;
    item.negSrcHideFinishBtn = 0;
    item.negRecvHideFinishBtn = 0;
    
    $scope.setStatus(item);

    //Deterime if the item bulk
    if ($scope.isItemBulk(item)) {
      //Determine if the order already has a DOI active
      if (!$scope.isBulk()) {
        //if not add set the flag to allow DOI
        $scope.OrderList.Orders.skipDOIStart = false;
      }
    }
    $scope.OrderList.Orders.OrderItems.push($scope.currentItem);
    if (!$scope.isBulk()) {
      $scope.OrderList.Orders.disableDOI = true;
    } else {
      if ($scope.isItemBulk(item)) {
        $scope.OrderList.Orders.hideDoiButton = false; //Check if item is special package item on new doi generated.
        $scope.OrderList.Orders.newDoiActive = false;
        $scope.OrderList.Orders.doiCompleted = false;
        $scope.OrderList.Orders.disableDOI = false;
      }
    }

    // $scope.getAvailability($rootScope.selectedSite);
  }
  $scope.OrderList.Orders.OrderHdr.SessionID = $rootScope.SessionID;

  $scope.formOrderHeader = function(order) {
    $scope.OrderList.Orders.OrderHdr.MarineSessionID = $scope.OrderList.Orders.OrderHdr.SysTrxNo;
    $scope.OrderList.Orders.OrderHdr.OrderDtTm = $scope.OrderList.Orders.OrderHdr.OrderDtTm.toString();
    $scope.OrderList.Orders.OrderHdr.DtTm = new Date();
    $scope.OrderList.Orders.OrderHdr.LastStatusDate = new Date();
    $scope.OrderList.Orders.OrderHdr.ToSiteID = $scope.general.ToSiteID;
    $scope.OrderList.Orders.OrderHdr.CompanyID = $rootScope.CompanyID;
    $scope.OrderList.Orders.OrderHdr.StatusCode = "L";
    $scope.OrderList.Orders.OrderHdr.Status = "Shipping in Progress";
    $scope.OrderList.Orders.OrderHdr.VehicleID = $scope.OrderList.Orders.OrderHdr.Vehicle.VehicleID;
    $scope.OrderList.Orders.OrderHdr.CustomerNumber = $scope.OrderList.Orders.OrderHdr.CustomerNumber;
    if (!$scope.OrderList.Orders.shippingVessels) {
      $scope.OrderList.Orders.shippingVessels = [];
      $scope.OrderList.Orders.deliveryVessels = [];
      $scope.OrderList.Orders.deliveryCodes = [];
    }
  }

  $scope.deleteOrder = function() {

  }

  $scope.allowShipping = function() {
    return !(($scope.OrderList.Orders.OrderItems.length > 0) && (Object.keys($scope.general.Vehicle).length > 0) && ($scope.general.Vehicle.Code))
  }

  $scope.allowDelivery = function() {
    return !(
      ($scope.OrderList.Orders.OrderItems.length > 0) &&
      (Object.keys($scope.general.Vehicle).length > 0) &&
      ($scope.isDestinationRequired())
    )
  }

  $scope.isDestinationRequired = function() {
    return ($scope.general.Destination && $scope.general.Destination.Code);
  }

  $scope.setStatus = function(item) {
    var actions = ['Ship', 'Deliver'];
    actions.forEach(function(Action) {
      if (!item[Action].overallStatus) {
        item[Action].overallStatus = 'initial';
        if (item.IsPackaged === 'Y') {
          item[Action].statusList = ['initial', 'finished'];
        } else {
          var doiActive = false;
          if (item.IsBillable === 'Y') {
            if (item.BIUOM != 'Each') {
              item[Action].statusList = ['initial', 'inprogress', 'finished'];
              if ($rootScope.EnableElectronicDOI == 'Y') {
                doiActive = true;
              }
            } else {
              item[Action].statusList = ['initial', 'finished'];
            }
          } else {
            item[Action].statusList = ['initial', 'inprogress', 'finished'];
            if ($rootScope.EnableElectronicDOI == 'Y') {
              doiActive = true;
            }
          }
        }
        if (doiActive) {
          //  $scope.OrderList.Orders.skipDOIStart = false;
        }
      }
    })
  }
  $scope.updateOrderToDb = function() {
    $scope.general.LastModifiedUser = $rootScope.loginData.uname;
    $scope.OrderList.Orders.OrderItems.forEach(function(item) {
      item.MasterSiteID = $rootScope.MasterSiteID;
    });
    $scope.orderDT = moment.utc(); // Current Date & time
    $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
    $scope.OrderList.cTs = $scope.orderTs;
    $scope.OrderList.DeviceID = $rootScope.deviceUid || 'Browser';
    addOrderService.saveOrder($scope.OrderList, $scope.OrderList.Orders.OrderHdr.OrderNo).then(function(response) {});

  }

  $scope.shipOrder = function() {
    $scope.formOrderHeader($scope.OrderList);
    $scope.saveOrder();
    $scope.OrderList.Orders.OrderItems.forEach(function(item) {
      item.MasterSiteID = $rootScope.MasterSiteID;
    });
    addOrderService.saveOrder($scope.OrderList, $scope.OrderList.Orders.OrderHdr.OrderNo).then(function(response) {});
  }


  $scope.deliverOrder = function() {
    if ($state.current.name != 'addorder.destination' && ($scope.OrderList.Orders.OrderHdr.InternalTransferOrder == 'N' || $scope.OrderList.Orders.OrderHdr.Destination)) {
      $state.go('addorder.destination');
    }
    if ($scope.allowDelivery() && $scope.OrderList.Orders.OrderHdr.InternalTransferOrder == 'N') {
      $state.go('addorder.destination');
      $scope.mdaAlert("Marine Location", "Please select marine location!", 1);
    } else {
      $scope.activeAction = "Deliver";
      if ($scope.OrderList.Orders.OrderHdr.InternalTransferOrder == 'N') {
        $scope.setUserRole('Delivering');
      } else {
        $scope.openModal('transfermodal');
      }

    }
  }

  $scope.processShipping = function() {
    if ($scope.activeAction == 'Ship') {
      $scope.formOrderHeader($scope.OrderList);
      $scope.enableShipping = true;
      $scope.OrderList.Orders.OrderHdr.Status = "Shipping in Progress";
      $scope.OrderList.Orders.OrderHdr.StatusCode = "S";
      $scope.shipOrder();
      $scope.pageTitle = "Shipping in Progress";
      $scope.updateOrderStatus("L");
    } else {
      $scope.formOrderHeader($scope.OrderList);
      $scope.OrderList.Orders.activeAction = "Deliver";
      $scope.OrderList.Orders.OrderHdr.Status = "Delivery in Progress";
      $scope.OrderList.Orders.OrderHdr.StatusCode = "T";
      $scope.saveOrder();
      $scope.enableDelivery = true;
      $scope.pageTitle = "Delivery in Progress";
      $scope.updateOrderStatus("T");
    }
    $scope.products = [];
    $scope.OrderList.Orders.OrderHdr.processStartTime = $rootScope.getProcessStartTime();
    $scope.OrderList.Orders.OrderHdr.processOrginalTime = $rootScope.getProcessOrginalTime();
    $scope.loadProducts();
  }

  $scope.goBack = function() {
    $scope.saveOrder();
    setTimeout(function() {
      if ($stateParams.source) {
        $localstorage.set('lastStatus', 'Open');
      }
      $state.go('orders');
    }, 0);
  }
  $scope.popOverEventRegister = function(e) {
    $scope.popOverEvent = e;
  };

  //Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function() {
    isPopoverShow = false;
    // $scope.popover.remove();
  });
  // Execute action on hide popover
  $scope.$on('popover.hidden', function() {
    // Execute action
    isPopoverShow = false;
  });
  // Execute action on remove popover
  $scope.$on('popover.removed', function() {
    // Execute action
    isPopoverShow = false;
  });
  $scope.removeVessel = function(vessel) {
    var index = $scope.OrderList.Orders.OrderHdr.Vessels.indexOf(vessel);
    $scope.OrderList.Orders.OrderHdr.Vessels.splice(index, 1);
  }
  $scope.contactPopOverClose = function(e, item) {
    $scope.general.ReceivingContactNumber = item.PhoneNo;
    $scope.general.ReceivingContactName = item.FullName;
    $scope.closePopover();
  };
  if (!$scope.OrderList.Orders.transferDetails) {
    attachShiftChangeData($scope.OrderList.Orders);
  }
  $scope.transferDetails = $scope.OrderList.Orders.transferDetails;
  $rootScope.transferDetails = $scope.transferDetails;
  $scope.setUserRole = function(role) {
    $scope.transferDetails.userRole = role;
    $scope.transferDetails[role] = {};
    // $scope.transferDetails[role].title = "Tankerman";
    if (role)
      $scope.transferDetails[role].name = $rootScope.loginData.uname;
    if (role == 'Receiving') {
      $scope.transferDetails.otherRole = "Delivering";
    } else {
      $scope.transferDetails.otherRole = "Receiving";
    }
    $scope.transferDetails[$scope.transferDetails.otherRole] = {};
    $scope.OrderList.Orders.shiftDetails[$scope.activeAction].Delivering[0] = $scope.transferDetails.Delivering;
    $scope.OrderList.Orders.shiftDetails[$scope.activeAction].Receiving[0] = $scope.transferDetails.Receiving;
    $scope.startProcessing();
  }

  function attachShiftChangeData(order) {
    if (!order.transferDetails) {
      order.transferDetails = {};
    }
    if (!order.shiftDetails) {
      order.shiftDetails = {};
      order.shiftDetails.Ship = {};
      order.shiftDetails.Deliver = {};
      order.shiftDetails.Ship.Delivering = [];
      order.shiftDetails.Ship.Receiving = [];
      order.shiftDetails.Deliver.Delivering = [];
      order.shiftDetails.Deliver.Receiving = [];
    }
  }
  $scope.startProcessing = function() {
    $scope['transfertitlemodal'].hide();
    $scope.processShipping();
  }

  $scope.processItems = function(val) {
    if ($scope.allowDelivery() && $scope.OrderList.Orders.OrderHdr.InternalTransferOrder == 'N') {
      $state.go('addorder.destination');
      $scope.mdaAlert("Marine Location", "Please select marine location!", 1);
    } else {
      dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [$scope.OrderList.Orders.OrderHdr.SysTrxNo, $scope.OrderList.Orders.OrderHdr.Status, JSON.stringify($scope.OrderList), JSON.stringify($scope.OrderList.Orders.OrderHdr), $scope.OrderList.Orders.OrderHdr.SysTrxNo], $scope.changePage);
    }
  }

  $scope.changePage = function() {
    setTimeout(function() { $scope.numericIn.quantity = $scope.currentItem.Qty || '' }, 0);
    $scope.itemNotesEUscape($scope.OrderList.Orders.OrderItems, 1);
    if ($scope.activeAction == 'Ship') {
      if (!$scope.enableShipping) {
        setTimeout(function() {
          if ($scope.currentItem.Editable) $scope.openModal('quantitymodal');
        }, 0);

      } else {
        setTimeout(function() {
          if (!($scope.currentItem.IsBillable == 'Y'))
            $state.go('shiporder', { order: $scope.OrderList.Orders.OrderHdr.OrderNo, item: $scope.currentItem, systrxno: $scope.OrderList.Orders.OrderHdr.SysTrxNo })
        }, 0);
      }
    } else {
      if (!$scope.enableDelivery) {
        setTimeout(function() {
          if ($scope.currentItem.Editable) $scope.openModal('quantitymodal');
        }, 0);
      } else {
        setTimeout(function() {
          if (!($scope.currentItem.IsBillable == 'Y') || $scope.activeAction == 'Deliver') {
            $state.go('shiporder', { order: $scope.OrderList.Orders.OrderHdr.OrderNo, item: $scope.currentItem, systrxno: $scope.OrderList.Orders.OrderHdr.SysTrxNo })
          } else {
            if ($scope.OrderList.Orders.OrderHdr.Status == 'Delivered') {
              $state.go('shiporder', { order: $scope.OrderList.Orders.OrderHdr.OrderNo, item: $scope.currentItem, systrxno: $scope.OrderList.Orders.OrderHdr.SysTrxNo })
            }
          }
        }, 0);
      }
    }
  }
  $scope.productSelect = null;
  $scope.selectedProduct = function(product) {
    $scope.productSelect = product;
  }
  $scope.processItemAddtion = function(product) {
    $scope.setCurrentItem(product);
    $scope.closeModal('addmodal');
    $scope.openModal('quantitymodal')
  }
  $scope.$watch('OrderList.Orders.OrderHdr.Vehicle', function(n, v) {
    if (n.EnforceShipmentMarineApp == "N") {
      if ($scope.activeAction == "Ship") {
        $scope.EnforcedVehicle = true;
        $scope.activeAction = "Deliver";
      }
    } else {
      if ($scope.EnforcedVehicle) {
        $scope.activeAction = "Ship";
        $scope.EnforcedVehicle = false;
      }
    }
  }, true);

  $scope.loadMore = function() {
    lazyLoadParams = { 'MinRecord': lazyLoadParams.MinRecord + 20, 'MaxRecord': lazyLoadParams.MaxRecord + 20, 'SearchText': "" }
    $scope.loadProducts();
  };

  $scope.loadMoreVessels = function() {
    searchVesselParams = { 'MinRecord': searchVesselParams.MinRecord + 20, 'MaxRecord': searchVesselParams.MaxRecord + 20, 'SearchText': "" }
    $scope.loadVessels();
  }

  $scope.$on('shiftChange', function() {
    $rootScope.closeSettingsPopover();
    let flag = $rootScope.bulkItemNotInitial($scope.OrderList.Orders.OrderItems, $scope.activeAction);
    let itemSts = $rootScope.bulkItemStatus($scope.OrderList.Orders.OrderItems, $scope.activeAction);
    
    if($scope.OrderList.Orders.OrderHdr.AllowDOI == 'N' || $scope.OrderList.Orders.OrderHdr.AllowDOIShipTo == 'N' || $rootScope.EnableElectronicDOI == 'N' || !$scope.isBulk()){
      $rootScope.autoLogOff($scope.OrderList.Orders);
    }
    else{
      if(flag){
        if(itemSts===1){
          $rootScope.autoLogOff($scope.OrderList.Orders);
        }
        else{
          if ($scope.OrderList.Orders.OrderHdr.Status != 'Open') {
            setTimeout(function() {
              $scope.shiftModalOpen = true;
            }, 1000)
            $scope.shiftPopup = $ionicPopup.show({
              title: 'Shift Change',
              template: '<div> Who is Changing Shift? </div>',
              cssClass: 'shift-change',
              scope: $scope,
              buttons: [{
                  text: $scope.returnShiftText($scope.transferDetails[$scope.transferDetails.userRole].name, $scope.transferDetails.userRole),
                  onTap: function(e) {
                    $scope.changeShift('userRole');
                  }
                },
                {
                  text: $scope.returnShiftText($scope.transferDetails[$scope.transferDetails.otherRole].name, $scope.transferDetails.otherRole),
                  onTap: function(e) {
                    $scope.changeShift('otherRole');
                  }
                },
              ]
            });
          } else {
            $scope.mdaAlert('Shift Change', 'Shift Change not applicable for this Order', 0);
          }

        }
      }
      else{
        $rootScope.autoLogOff($scope.OrderList.Orders);
      }

    }
  });
  $scope.returnShiftText = function(text, type) {
    if (text) {
      return text;
    } else {
      if (type == 'Delivering') {
        return 'Dispenser'
      } else {
        return 'Receiver';
      }
    }

  }
  $scope.isFullBulk = function(items) {
    //try to determine if entire order is Bulk
    var orderBulk
    var bulk;
    items.forEach(function(item) {
      if (item.IsPackaged == 'N') {
        bulk = true;
      }
      if (item.IsBillable == 'Y') {
        if (item.BIUOM != 'Gallons') {
          bulk = false;
        }
      }
      if (item.IsBulk == 'Y') {
        bulk = true;
      }
      if (bulk) {
        orderBulk = true;
      }
    })

    return orderBulk;
  }
  $scope.changeShift = function(role) {
    // $rootScope.shiftChangeModal.hide(); 
    if (role == 'otherRole') {
      var sc;
      sc = $scope.isFullBulk($scope.OrderList.Orders.OrderItems)
      if (sc) {
        var changedShift = $scope.transferDetails[role];
        $scope.transferDetails.changedShift = changedShift;
        $state.go('shiftchange', { order: $scope.OrderList.Orders, item: null, shiftChange: true, role: 'otherRole' });
      } else {
        $scope.mdaAlert('Shift Change', 'Shift Change not applicable for this Order', 0);
      }

    } else {
      $rootScope.changeShiftForLoginUser();
    }

  }

  $scope.gotoReview = function() {
    $state.go('shiporder', { 'order': $scope.OrderList.Orders.OrderHdr.OrderNo, 'systrxno': $scope.OrderList.Orders.OrderHdr.SysTrxNo });
  }
  $scope.updateOrderStatus = function(statusCode) {
    var d = new Date().toString();
    var dateTm = moment.parseZone(d).local().format('YYYY-MM-DD HH:mm:ss');
    var reqData = {
      "OrderStatusHistory": {
        "OrderNo": $scope.general.OrderNo,
        "OrderStatusID": statusCode,
        "Longitude": "31.6594",
        "Latitude": "41.6954",
        "UpdatedBy": $rootScope.loginData.uid || "131",
        "DeviceID": $rootScope.deviceUid || "test",
        "DeviceTime": dateTm,
        "CompanyID": $rootScope.CompanyID,
        "CustomerID": "4108"
      }
    }
    addOrderService.updateOrderStatus(reqData, $scope.general.OrderNo).then(function(response) {});
  }

  $scope.$on('order-dispatched', function(e, args) {
    if (args.OrderNo === $scope.general.OrderNo) {
      $state.go("orders");
    }
  });

  $scope.$watch('OrderList.Orders.OrderHdr', function(newVal, oldVal) {
    var elapsedTime = (Date.now() - $rootScope.lastSyncTime) / 1000;
    if (newVal && elapsedTime > 10) {
      var hasChanged = angular.equals(newVal, oldVal);
      if (!hasChanged) {
        //update DB and service
        $scope.saveOrder();
      }
    }
  }, true);

  /* Offline Marine Locations*/
  $scope.marineLocation = [];
  $scope.loadLocations = function() {
    var query = "SELECT * FROM MarineLoc ORDER BY Code";
    $cordovaSQLite.execute(productDB, query, []).then(function(res) {
      var locationArr = [];
      var len = res.rows.length;
      if (len > 0) {
        for (var i = 0; i < len; i++) {
          var data = {};
          var result = res.rows.item(i);
          data["MarineLocID"] = result.MarineLocID;
          data["Code"] = result.Code;
          data["Descr"] = result.Descr;
          data["DefLocDescr"] = (result.DefLocDescr == "NULL") ? '' : result.DefLocDescr;
          data["Latitude"] = result.Latitude;
          data["Longitude"] = result.Longitude;
          data["Distance"] = (result.Distance == "NULL") ? '' : result.Distance;
          locationArr.push(data);
        }
      }
      if (locationArr.length > 0) {
        $scope.marineLocation = locationArr;
      }
    }, function(err) {});
  }
  $scope.addLocation = function(item) {
    var LocationAdd = true;
    if (LocationAdd) {
      LocationAdd = false;
      $scope.OrderList.Orders.OrderHdr.Destination = item;
      $scope.OrderList.Orders.OrderHdr.MarineLocDescr = item.Descr;
      $scope.OrderList.Orders.OrderHdr.MarineLocID = item.MarineLocID;
      $scope.OrderList.Orders.OrderHdr.Code = item.Code;
    }
    $scope.closeModal('locationmodal');
  }
  $scope.removeLocation = function() {
    $scope.OrderList.Orders.OrderHdr.Destination = {};
  }

  $scope.isObjectEmpty = function(val) {
    return Object.keys(val).length === 0;
  }

  /* Alert Modal*/
  $scope.mdaAlert = function(title, desc, flag) {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: desc
    });
    alertPopup.then(function(res) {
      if (flag == 1) {
        setTimeout(function() {
          angular.element('#Autocomplete').focus();
        }, 100);
      }
    });
  }

  /* Shiftchange popup modal close */
  $('body').on('click', function() {
    var htmlEl = angular.element(document.querySelector('html'));
    htmlEl.on('click', function(event) {
      if ($scope.shiftModalOpen) {
        if ($scope.shiftPopup) {
          $scope.shiftPopup.close();
        }
        $scope.shiftModalOpen = false;
      }
    });
  });
  if ($scope.OrderList.Orders.OrderHdr.Status != 'Open' || $scope.OrderList.Orders.OrderHdr.Status != 'En Route' || $scope.OrderList.Orders.OrderHdr.Status != 'Delivered') {
    $scope.saveOrder();
  }

  $scope.itemNotesEUscape = function(getNotes, flag) {
    angular.forEach(getNotes, function(value, key) {
      if (flag == 1) {
        if (value.Notes) {
          $scope.OrderList.Orders.OrderItems[key].Notes = value.Notes;
        }
        if (value.PONo) {
          $scope.OrderList.Orders.OrderItems[key].PONo = value.PONo;
        }
      } else {
        if (value.Notes) {
          $scope.OrderList.Orders.OrderItems[key].Notes = value.Notes;
        }
        if (value.PONo) {
          $scope.OrderList.Orders.OrderItems[key].PONo = value.PONo;
        }
      }
    });
  }

  // If Order is delivered on MDA, then Shift change menu is hide, remaining status (Shipping In Progress, En Route, Delivery In Progress) are maintained.
  $rootScope.hideShiftMenu = true;
  if($scope.OrderList.Orders.OrderHdr.Status == 'Delivered') {
    $rootScope.hideShiftMenu = false;
  }

  // Hardware Back buttons
  var deregisterFirst = $ionicPlatform.registerBackButtonAction(function() {
    $scope.goBack();
  }, 101);
  $scope.$on('$destroy', deregisterFirst);

});