app.controller('ordersController', function($scope, $state, $ionicPopover, $ionicModal, $rootScope, $localstorage, $mdSidenav, ordersListService, getAllSiteService, $ionicPopup, $q, dbService, filterFilter) {
  angular.element('.demo-header-searchbox').on('keydown', function(ev) {
    ev.stopPropagation();
  });
  // Shift change menu show
  $rootScope.showSIP = false;
  $rootScope.hideShiftMenu = true;
  $scope.renderLimit = 30;
  $scope.showMore = true;
  $scope.selectedStatus = 'Open';
  //The ! implies no null-check
  $scope.orderSort = {
    "ascend": ['+OrderDtTm', '+OrderNo'],
    "descend": ['!deliveryDtm', '-deliveryDtm']
  }

  $scope.searchOptions = {};
  $scope.navBar = { isSidenavOpen: false };
  $scope.clearSearchTerm = function() {
    $scope.searchOptions.searchInsite = '';
    $scope.searchOptions.searchVehicle = '';
  };
  $rootScope.showSearch = true;
  $scope.moreData = true;
  $scope.filterBy = 'bySites';
  $scope.dateRange = { 'dateFrom': '', 'dateTo': '' };

  var orderDataJson = {};
  var filterFields = [];
  var lazyLoadParams = { 'MinRecord': 1, 'MaxRecord': 20, 'SearchText': '' }
  $scope.cstSearch = { 'searchText': '' };

  var listOfOrdersTemp, listOfCustomersTemp, customerOrdersListTemp;
  customerOrdersListTemp = [];
  $scope.toggle = function() {
    $mdSidenav('right').toggle();
  }
  $scope.tabData = {};
  $scope.allStatuses = ["Open", "Shipping in Progress", "En Route", "Delivery in Progress", "Delivered"];

  var currentStatus = $localstorage.get('lastStatus');

  var selTab = $scope.allStatuses.indexOf(currentStatus);
  if (selTab > 0)
    $scope.tabData.selectedTab = selTab;
  $scope.$watch('tabData', function(nv, ov) {
    $scope.selectedStatus = $scope.allStatuses[nv.selectedTab];
    $scope.resetShowMore();
    $rootScope.scrollTop('orderListcroll');
    if (nv.selectedTab || nv.selectedTab == 0) {
      $scope.searchText.statusArray.length = 0;
      $scope.filterBySearch(true, 'status', $scope.allStatuses[nv.selectedTab]);
    } else {
      $scope.searchText.statusArray.length = 0;
    }
    // Default shift change menu display orderlist screen 
    if (nv.selectedTab == 3 || nv.selectedTab == 5) {
      $rootScope.shiftMenu = false;
    } else {
      $rootScope.shiftMenu = true;
    }
    //set sorting
    $scope.currSort = nv.selectedTab == 4 ? $scope.orderSort.descend : $scope.orderSort.ascend;
  }, true)
  $scope.clearFilter = function() {
    $scope.searchText = { 'addressArray': [], 'dbaArray': [], 'all': '', 'statusArray': [], 'sitesArray': [], 'driversArray': [], 'vehiclesArray': [], 'contactsArray': [], 'creditsArray': [] };
    $scope.dateRange = { 'dateFrom': '', 'dateTo': '' };
    $scope.searchOptions = {};
    $scope.filteredSites = { sites: [$rootScope.selectedSite.SiteID] };
    $scope.filterBySites($scope.filteredSites.sites);
  };

  function clearLazyParams() {
    lazyLoadParams = { 'MinRecord': 1, 'MaxRecord': 20, 'SearchText': '' };
  }
  $scope.clearDateRange = function() {
    $scope.dateRange = {};
  };
  // Daterange filter
  $scope.dateRangeFilter = function(property, startDate, endDate) {
    return function(item) {
      if (startDate && endDate) {
        var ppty = item.OrderDtTm;
        if (item.OrderDtTm === null) return false;
        var itemDate = moment(ppty).format("MM/DD/YYYY");
        var s = moment(new Date(startDate)).format("MM/DD/YYYY");
        var e = moment(new Date(endDate)).format("MM/DD/YYYY");
        if (itemDate >= s && itemDate <= e) return true;
        return false;
      } else {
        return item;
      }
    }
  }

  $scope.setDateRange = function(text) {
    var date = new Date();
    if (text.toString() === 'all') {
      $scope.dateRange.dateFrom = undefined;
      $scope.dateRange.dateTo = undefined;
    } else if (text.toString() === 'today') {
      $scope.dateRange.dateFrom = date;
      $scope.dateRange.dateTo = date;
    } else if (text.toString() === 'tomorrow') {
      $scope.dateRange.dateFrom = new Date(date.setDate(date.getDate() + 1));
      $scope.dateRange.dateTo = new Date(date.setDate(date.getDate()));
    } else if (text.toString() === 'week') {
      var first = date.getDate() - date.getDay(); // First day is the day of the month - the day of the week
      var last = first + 6; // last day is the first day + 6            
      $scope.dateRange.dateFrom = new Date(date.getFullYear(), date.getMonth(), first);
      $scope.dateRange.dateTo = new Date(date.getFullYear(), date.getMonth(), last);
    }
  };

  $scope.listOfCustomers = [];
  $scope.getAllCustomers = function() {
    ordersListService.getCustomersList(lazyLoadParams).then(function(response) {
      var customers = response.data;
      if (customers.length == 0) {
        $scope.moreData = false;
      } else if ($scope.listOfCustomers) {
        $scope.moreData = true;
        $scope.listOfCustomers = $scope.listOfCustomers.concat(customers);
      } else if (customers.length > 0) {
        $scope.listOfCustomers = customers;
        $scope.moreData = true;
      }
      $scope.$broadcast('scroll.infiniteScrollComplete');
    });
  };

  $scope.loadSearchCustomers = function(newSearch) {
    $scope.listOfCustomers = [];
    var searchText = $scope.cstSearch.searchText;
    if (searchText == newSearch) {
      lazyLoadParams.SearchText = newSearch;
      ordersListService.getCustomersList(lazyLoadParams).then(function(response) {
        $scope.listOfCustomers = response.data;
      })
    }
  };

  $scope.$watch('cstSearch', function(newVal, oldVal) {
    if (newVal != oldVal) {
      (function(st) {
        if (st) {
          $scope.$broadcast('scroll.infiniteScrollComplete');
          $scope.moreData = false;
        } else {
          $scope.moreData = true;
          clearLazyParams();
        }
        setTimeout(function() {
          $scope.loadSearchCustomers(st);
        }, 1000)
      })(newVal.searchText)

    }
  }, true)

  $scope.initSearchData = function() {
    $scope.searchText = { 'addressArray': [], 'dbaArray': [], 'all': '', 'statusArray': ['Open'], 'sitesArray': [], 'driversArray': [], 'vehiclesArray': [], 'contactsArray': [], 'creditsArray': [] };
    $scope.siteExists = false;
    $scope.listOfOrders = [];
    $scope.listOfOrdersNew = [];
  };

  $scope.initSearchData();
  $scope.statusesArray = [];
  $scope.sitesArray = [];
  $scope.newSitesArray = [];
  $scope.vehiclesArray = [];

  angular.forEach($scope.loginDependency, function(site, index) {
    if ($scope.sitesArray.indexOf(site.Code) == -1) {
      $scope.sitesArray.push({
        SiteID: site.SiteID,
        Code: site.Code
      });
    }
  });

  // FilteredSites based on current user Login
  $scope.sitesArray = getAllSiteService.filteredSites($scope.sitesArray); 

  $scope.categorizeOrders = function() {
    angular.forEach($scope.listOfOrdersNew, function(order, index) {
      if (order.Status) {
        if ($scope.statusesArray.indexOf(order.Status) == -1) {
          $scope.statusesArray.push(order.Status);
        }
      }
      if (order.Vehicle.Code) {
        if ($scope.vehiclesArray.indexOf(order.Vehicle.Code) == -1) {
          $scope.vehiclesArray.push(order.Vehicle.Code);
        }
      }
    })
    if (!$scope.sortApplied) {
      $scope.sortOrders('Orders.OrderDtTm', false);
      $scope.sortReverse = true;
    }

  }

  $scope.showResults = function(res) {
    var orderList = res.data.rows;
    var orderLen = orderList.length;
    if (orderLen > 0) {
      var deferred = $q.defer();
      var data = [];
      if (orderLen > 0) {
        for (var i = 0; i < orderLen; i++) {
          var row = orderList.item(i);
          data.push(JSON.parse(row['orderHdrData']));
        }
        $scope.listOfOrdersNew = data;
        $scope.showNoOrders = data.length;
        $scope.$apply();
        $scope.categorizeOrders();
        $rootScope.disableRefresh = true;
        $scope.checkShowMore();
      } else {
        void 0;
      }
    } else {
      $scope.showNoOrders = 0;
      return false;
    }
  };

  var filterApplied = false;

  $scope.$on('OrdersInserted', function() {
    if (filterApplied) {
      $scope.filterBySites($scope.filteredSites.sites);
    } else {
      dbo.selectColumnTable('OrdersMaster', "siteId=?", ["orderHdrData"], [parseInt($rootScope.selectedSite.SiteID)], $scope.showResults);
    }
    setTimeout(function() {
      $scope.ordersLoaded = true;
      $rootScope.disableRefresh = true;
    }, 2000);
  });

  ! function() {
    dbo.selectColumnTable('OrdersMaster', "siteId=?", ["orderHdrData"], [parseInt($rootScope.selectedSite.SiteID)], $scope.showResults);
  }();

  $ionicModal.fromTemplateUrl('syncOrdersModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {;
    $scope.syncModal = modal;

  });

  function initModal() {
    // $ionicModal.fromTemplateUrl('orderDetailsModal.html', {
    //   scope: $scope,
    //   animation: 'none'
    // }).then(function(modal) {;
    //   $scope.modal = modal;
    //   $scope.modal.show($event);
    // });
    var whereClause = '';
    var apiToCheck = ['MN_UpdateOrders', 'MN_UpdateOrderStatusHistory', 'MN_UpdateShipmentDetails', 'MN_UpdateDeliveryDetails', 'meterTicket', 'doi', 'deliveryTicket', 'notes', 'attachmentDoc', 'MN_UpdateOrderNotesFromApp', 'MN_UpdateINSiteTankVolume', 'MN_CalcShipReading', 'MN_UpdateLogOutDetails', 'MN_CancelOrders', 'MN_CalWeightVolumeQty'];
    apiToCheck.forEach(function(api, index) {
      if (index < apiToCheck.length - 1) {
        whereClause = whereClause + ' url LIKE ' + '"' + '%' + api + '%"' + ' OR'
      } else {
        whereClause = whereClause + ' url LIKE ' + '"' + '%' + api + '%"'
      }
    })
    dbo.getData('SyncMaster', whereClause, function(results) {
      //get unique order numbers
      //check if the status is Delivered or Invoiced
      $scope.syncOrdersList = [];
      if (results.rows.length > 0) {
        for (var i = 0; i < results.rows.length; i++) {
          $scope.syncOrdersList.push(results.rows.item(i));
        }
        //console.log($scope.synOrdersList);
        // results.rows.forEach(function(res,index){
        //   $scope.synOrdersList.push(res);
        // })
        $scope.syncModal.show();
      } else {
        $ionicPopup.alert({
          title: 'Alert!',
          template: "No orders present in Sync Table"
        });
      }


    });

  }

  $scope.openOrderDetails = function(item, index, $event) {
    $scope.hideAutoComplete();
    setTimeout(function() {
      var orderProcessedUname = (item.currentUser != null) ? item.currentUser : $rootScope.loginData.uname;
      if (item.currentUser) {
        if ((orderProcessedUname.toUpperCase() == $rootScope.loginData.uname.toUpperCase() || !item.currentUser || item.Status == 'Delivered' || item.Status == 'En Route')) {
          $scope.openOrders(item, index, $event);
        } else {
          $ionicPopup.alert({
            title: 'Alert!',
            template: "Can't process this Order.Different user (" + item.currentUser + ") is processing this order"
          });
        }
      } else {
        $scope.openOrders(item, index, $event);
      }
    }, 350);
  };

  function resolveInventorySite(id) {
    $scope.loginDependency.forEach(function(siteObj) {
      if (siteObj.SiteID == id) {
        $rootScope.selectedSite = siteObj;
        $rootScope.EnableElectronicDOI = siteObj.EnableElectronicDOI;
      }
    });
  }

  $scope.openOrders = function(item, index, $event) {
    $rootScope.MasterSiteID = item.MasterSiteID;
    resolveInventorySite(item.MasterSiteID);
    $rootScope.CompanyID = item.CompanyID;
    /* Check ShiftChange menu display or not*/
    /*if (item.MasterSiteID == 1015) {
      $rootScope.enbElecDOI = false;
    } else {
      $rootScope.enbElecDOI = true;
    }*/
    var currentSystrxNo = item.SysTrxNo;
    if (item.Status == 'En Route') {
      if (item.Destination) {
        $state.go('addorder.destination', { 'order': item.OrderNo, 'systrxno': currentSystrxNo });
      } else {
        $state.go('addorder', { 'order': item.OrderNo, 'systrxno': currentSystrxNo });
      }

    } else if (item.Status == 'Delivered') {
      //check if the order status id deliverd,go to notes tab
      $state.go('addorder.notes', { 'order': item.OrderNo, 'systrxno': currentSystrxNo });
    } else {
      $state.go('addorder', { 'order': item.OrderNo, 'systrxno': currentSystrxNo });
    }
    setTimeout(function() {
      if (!$rootScope.isInternet || !$rootScope.online) {
        $('.order-tabs .tab-nav').addClass('offline');
      } else {
        $('.order-tabs .tab-nav').removeClass('offline');
      }
    }, 1000);
    delete $scope.listOfOrdersNew;
  };
  $scope.openCustomerOrder = function(item, index, $event) {
    $scope.modal.hide();
    item.activeAction = 'Ship';
    var o = item;
    o.Orders.OrderItems.forEach(function(item) {
      item.Ship = {};
      item.Deliver = {};

    })
    $state.go('addorder', { 'order': o });
  };

  $scope.openOrderDetailsModal = function(item, index, $event) {
    $scope.itemInfo = item;
    $scope.customerOrdersList = $scope.listOfOrders
    initModal('', $event);
  };


  $scope.openSyncModal = function() {
    initModal();
  };

  $scope.closeOrderDetailsModal = function() {
    $scope.modal.hide();
  };

  $scope.$on('modal.hidden', function() {
    $scope.customerOrdersList = {};
  });

  $scope.$on('modal.removed', function() {});



  $scope.openPopover = function($event, filterByTxt) {
    $scope.filterBy = filterByTxt;
    $scope.popover.show($event);
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };

  //Cleanup the popover when we're done with it!
  $scope.$on('$destroy', function() {
    // $scope.popover.remove();
    //$scope.modal.remove();
  });
  // Execute action on hide popover
  $scope.$on('popover.hidden', function() {
    // Execute action
  });
  // Execute action on remove popover
  $scope.$on('popover.removed', function() {
    // Execute action
  });

  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });

  $scope.clicked = function(num) {
    $scope.var = num;
  };

  $scope.setDefaultSite = function(item) {
    item.isSiteSelected = true;
    if (item.isSiteSelected) {
      $scope.filterApplied = true;
      if ($scope.searchText.sitesArray.indexOf(item.Orders.OrderHdr.INSiteCode) == -1) {
        $scope.searchText.sitesArray.push(item.Orders.OrderHdr.INSiteCode);
      }
    }
  }
  $scope.filterBySearch = function(selected, field, value) {
    if (selected) {
      if (field == 'status') {
        $scope.searchText.statusArray.push(value);
      }
      if (field == 'insiteCode') {
        $scope.searchText.sitesArray.push(value)
      }
      if (field == 'vehicle') {
        $scope.searchText.vehiclesArray.push(value)
      }
    } else {
      if (field == 'status') {
        var index = $scope.searchText.statusArray.indexOf(value);
        $scope.searchText.statusArray.splice(index, 1);
      }
      if (field == 'insiteCode') {
        var index = $scope.searchText.sitesArray.indexOf(value);
        while (index > -1) {
          $scope.searchText.sitesArray.splice(index, 1);
          index = $scope.searchText.sitesArray.indexOf(value);
        }
      }
      if (field == 'vehicle') {
        var index = $scope.searchText.vehiclesArray.indexOf(value);
        $scope.searchText.vehiclesArray.splice(index, 1);
      }
    }
  };

  $scope.filteredSites = { sites: [$rootScope.selectedSite.SiteID] };

  $scope.filterBySites = function(sites) {
    var str = '(? ';
    if (sites.length > 0) {
      for (var i = 1; i < sites.length; i++) {
        str = str.concat(', ?');
      }
    }
    str = str.concat(')');

    /* Check ShiftChange menu display or not*/
    /*if (sites.indexOf(1015) > -1) {
      $rootScope.enbElecDOI = false;
    } else {
      $rootScope.enbElecDOI = true;
    }*/

    if (sites.length > 0) {
      filterApplied = true;
      dbo.filterOrdersByInsite('OrdersMaster', `siteId IN ${str} `, ["orderHdrData"], sites.map(Number), function(res) {
        var rs = res;
        var len = rs.rows.length,
          i;
        var data = [];
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var row = rs.rows.item(i);
            data.push(JSON.parse(row['orderHdrData']));
          }
          $scope.listOfOrdersNew = data;
          $scope.showNoOrders = data.length;
          $scope.$apply();
          $scope.categorizeOrders();
          $rootScope.loading = false;
          $rootScope.disableRefresh = true;

        } else {
          $scope.listOfOrdersNew = [];
          setTimeout(function() {
            $scope.showNoOrders = 0;
          }, 1000);
          $scope.$apply();
        }

      });
    } else {
      filterApplied = false;
      dbo.selectColumnTable('OrdersMaster', "siteId=?", ["orderHdrData"], [parseInt($rootScope.selectedSite.SiteID)], $scope.showResults);
    }
  }

  $scope.sortType = null;
  $scope.sortReverse = null;

  $scope.sortOrders = function(sortType, sortReverse, sortText) {
    $scope.sortApplied = true;
    $scope.currentSortOrder = sortText || 'Date';
    if (sortReverse == null && $scope.sortType == sortType) {
      $scope.sortType = sortType;
      $scope.sortReverse = false;
    } else if (sortReverse == false && $scope.sortType == sortType) {
      $scope.sortReverse = true;
    } else if (sortReverse == true && $scope.sortType == sortType) {
      if ($scope.sortType == "Orders.OrderHdr.OrderDtTm") {
        $scope.sortReverse = false;
      } else {
        $scope.sortReverse = null;
        $scope.sortType = null;
      }
    } else {
      $scope.sortType = sortType;
      $scope.sortReverse = false;
    }
    $scope.searchOrder = '';
  }
  $scope.filterApplied = true
  $scope.matchOrders = function(order) {

    if ($scope.filterApplied) {
      var matches = [{ 'sitesArray': order.INSiteCode }, { 'statusArray': order.Status }, { 'driversArray': '' }, { 'vehiclesArray': order.Vehicle.Code }];
      var match = false;
      var globalmatch = true;
      angular.forEach(matches, function(element, index) {
        for (var i = 0; i < $scope.currentFilters.length; i++) {
          var mkey = Object.keys(element)[0];
          if (mkey == $scope.currentFilters[i].id) {
            if ($scope.currentFilters[i].val.indexOf(element[mkey]) > -1) {
              match = true;
            } else {
              globalmatch = false;
            }
          }
        }
      });
      return match && globalmatch;
    } else {
      return true;
    }
  }

  $scope.checkShowMore = function(add) {
    add = add || false;
    $scope.filteredItems = filterFilter($scope.listOfOrdersNew, { Status: $scope.selectedStatus });

    if ($scope.renderLimit < $scope.filteredItems.length && add) {
      $scope.renderLimit += 10;
    }
    if ($scope.renderLimit >= $scope.filteredItems.length) {
      $scope.showMore = false;
    }
  }
  $scope.resetShowMore = function() {
    if ($scope.listOfOrdersNew && $scope.listOfOrdersNew.length > 0) {
      $scope.filteredItems = filterFilter($scope.listOfOrdersNew, { Status: $scope.selectedStatus });
      $scope.renderLimit = 30;
      if ($scope.renderLimit < $scope.filteredItems.length) {
        $scope.showMore = true;
      } else {
        $scope.showMore = false;
      }
    }
  }

  $scope.$watch('searchText', function(newValue, oldValue) {
    $scope.currentFilters = [];
    if (newValue.statusArray.length > 0 || newValue.sitesArray.length > 0 || newValue.driversArray.length > 0 || newValue.vehiclesArray.length > 0) {
      $scope.filterApplied = true;
    } else {
      $scope.filterApplied = false;
    }
    for (var prop in newValue) {
      if (newValue[prop].length > 0) {
        $scope.currentFilters.push({ val: newValue[prop], id: prop });
      }
    }
    void 0;
  }, true);

  $scope.loadMore = function() {
    lazyLoadParams = { 'MinRecord': lazyLoadParams.MinRecord + 20, 'MaxRecord': lazyLoadParams.MaxRecord + 20, 'SearchText': '' }
    $scope.getAllCustomers(lazyLoadParams);
  };

  $scope.$on('shiftChange', function() {
    $rootScope.closeSettingsPopover();
    $rootScope.changeShiftForLoginUser();
  });

  $scope.gotoReading = function() {
    $state.go('tanks');
  }

  $scope.hideAutoComplete = function() {
    var uiSelector = angular.element(document.querySelector('.os-list-wrapper'));
    $scope.keyword = '';
    uiSelector.hide();
  }

});
