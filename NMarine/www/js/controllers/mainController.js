app.controller('mainController', function($scope, $rootScope, $state, $localstorage, $ionicScrollDelegate, appConstants, $q, $window, $interval, $timeout, $ionicPopup, $ionicPopover, $ionicModal, $ionicHistory, getAllSiteService, ordersListService, addOrderService, $ionicLoading, Idle, $http, $cordovaSQLite, Notify, dbService, $cordovaFile, Notify) {
  $rootScope.disableRefresh = false;
  $rootScope.syncRefresh = true;
  $rootScope.hideShiftMenu = true;
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
    if (toState.name != 'login') {
      if (!$rootScope.selectedSite) {
        $scope.lastLogin = $localstorage.get('lastlogin');
        $scope.data = JSON.parse($scope.lastLogin);
        $rootScope.selectedSite = $scope.data[0];
      }
    }
    $scope.stateName = toState.name;
    $scope.shouldSync = true;
    if ($scope.stateName != 'orders') {
      $scope.shouldSync = false;
    }

  });
  $rootScope.showSIP = false;

  // Triggered on a button click, or some other target
  $rootScope.showSearch = false;
  $rootScope.toast = { "show": false };
  $rootScope.accSettings = { 'companyId': '01', 'customerId': '4108' };
  $scope.date = new Date();
  $rootScope.today = new Date();
  dbo.createTable('OrdersMaster', ['id INTEGER PRIMARY KEY', 'orderNo', 'SysTrxNo UNIQUE', 'status', 'siteId', 'orderData', 'orderHdrData', 'dateTime']);
  dbo.createTable('SyncMaster', ['id INTEGER PRIMARY KEY', 'orderNo', 'SysTrxNo', 'config', 'status', 'url', 'datetime']);
  dbo.createTable('CompanyMaster', ['id INTEGER PRIMARY KEY', 'CompanyID', 'CustomerID', 'Active', 'LogoImage', 'CustomerNo', 'datetime']);
  dbo.createTable('LoginMaster', ['id INTEGER PRIMARY KEY', 'uname', 'pwrd', 'uid', 'siteID', 'siteFiltered', 'datetime']);
  dbo.createTable('OrderAttachmentMaster', ['id INTEGER PRIMARY KEY', 'orderNo', 'SysTrxNo', 'config', 'status', 'url', 'UTC', 'datetime']);

  if (!$rootScope.deviceUid) {
    $rootScope.deviceUid = 'Browser';
  }
  /* User needs to go offline due to wifi signal strength is weak */
  if (!window.cordova) {
    $rootScope.online = true;
  } else {
    $rootScope.online = true;
  }
  /* Get Site data from api as well as sqlite db. */
  $rootScope.getSiteData = function(flag) {
    if ($rootScope.isInternet && $rootScope.online) {
      getAllSiteService.getAllSites().then(function(response) {
        var data = response.data;
        $scope.loginDependency = angular.copy(data);
      });
    } else {
      var query = "SELECT * FROM INSite ORDER BY Code";
      $cordovaSQLite.execute(productDB, query, []).then(function(res) {
        var siteArr = [];
        var len = res.rows.length;
        if (len > 0) {
          for (var i = 0; i < len; i++) {
            var data = {};
            var result = res.rows.item(i);
            var companyID = result.CompanyID;
            data['SiteID'] = result.SiteID;
            data['Code'] = result.Code;
            data['LongDescr'] = result.LongDescr;
            data['FormattedAddress'] = result.FormattedAddress;
            data['FormattedLineAddress'] = result.FormattedLineAddress;
            data['INSiteType'] = result.INSiteType;
            data['CompanyID'] = companyID;
            data['CustomerID'] = result.CustomerID;
            data['LastModifiedDtTm'] = result.LastModifiedDtTm;
            data['EnableElectronicDOI'] = result.EnableElectronicDOI;
            data['EnableMarineDelivery'] = result.EnableMarineDelivery;
            data['SiteType'] = result.SiteType;
            data['Inactive'] = result.Inactive;
            siteArr.push(data);
          }
        }
        if (flag == 0) {
          $scope.loginDependency = angular.copy(siteArr);
        } else {
          $scope.insites = getAllSiteService.filteredSites(siteArr);
        }
      }, function(err) {
        console.log(err);
      });
    }
  }

  var myFile;
  var offlineDBPath;
  $rootScope.showToastMsg = true;
  if (appConstants.env === "qa")
    offlineDBPath = "http://fswwmarine.blob.core.windows.net/offlinedbqa/Offline.db";
  else
    offlineDBPath = "http://fswwmarine.blob.core.windows.net/offlinedbprod/Offline.db";
  $scope.getCloudDB = function() {

    downloadDB();
  }

  if ($rootScope.isInternet && window.cordova) {
    if (!$rootScope.dbDownloaded) {
      setTimeout(function() {
        downloadDB();
        $rootScope.dbDownloaded = true;
      }, 4000)

    }
  }
  var dbPath;

  function downloadDB() {
    cordova.plugins.notification.local.schedule({
      title: 'Downloading database',
      progressBar: { indeterminate: true },
      icon: 'res://icon',
      smallIcon: 'res://ic_stat_onesignal_default'
    });
    cordova.plugin.http.downloadFile(offlineDBPath, {}, { 'cache-control': 'no-cache' }, cordova.file.dataDirectory + "offline.db", function(fileEntry) {
      var nativeUrl = fileEntry.nativeURL;
      var path = nativeUrl.slice(7, nativeUrl.lastIndexOf('/') + 1);
      dbPath = path;
      window.plugins.sqlDB.checkDbOnStorage("offline.db", path, function(e) {
        window.sqlitePlugin.deleteDatabase({ name: 'offline.db', location: 'default' }, moveDb, moveDb);
      }, function(err) { console.log('no db found', err) });
      return $q.resolve(true);
    }, function(response) {
      cordova.plugins.notification.local.clearAll();
      cordova.plugins.notification.local.schedule({
        title: 'Download failed',
        progressBar: { indeterminate: false, value: 0 },
        icon: 'res://icon',
        smallIcon: 'res://ic_stat_onesignal_default'
      });
      setTimeout(function() {
        cordova.plugins.notification.local.cancelAll()
      }, 5000)

      console.error(response.error);
    });

  }

  function moveDb() {
    window.plugins.sqlDB.copyDbFromStorage("offline.db", 0, dbPath + "offline.db", true,
      function(e) {
        productDB = $cordovaSQLite.openDB({ name: "offline.db", location: 'default' });
        cordova.plugins.notification.local.clearAll()
        cordova.plugins.notification.local.schedule({
          id: Math.random(),
          title: 'Download complete',
          progressBar: { indeterminate: false, value: 100 },
          icon: 'res://icon',
          smallIcon: 'res://ic_stat_onesignal_default'
        });
        setTimeout(function() {
          cordova.plugins.notification.local.cancelAll()
        }, 5000)
      },
      function(err) {
        if (err.code == 404) {
          window.plugins.sqlDB.copyDbFromStorage("offline.db", 0, dbPath + "offline.db", false,
            function(e) {
              console.log('successfully copied db');
              //hide the loader
              productDB = $cordovaSQLite.openDB({ name: "offline.db", location: 'default' });
              cordova.plugins.notification.local.clearAll()
              cordova.plugins.notification.local.schedule({
                id: Math.random(),
                title: 'Download complete',
                progressBar: { indeterminate: false, value: 100 },
                icon: 'res://icon',
                smallIcon: 'res://ic_stat_onesignal_default'
              });
              setTimeout(function() {
                cordova.plugins.notification.local.cancelAll()
              }, 5000)
            },
            function(err) { console.log('error copying db ', err) });
        }
      });

  }

  $rootScope.scrollTop = function(delegateHandle) {
    $ionicScrollDelegate.$getByHandle(delegateHandle).scrollTop();
  };

  $rootScope.getCurrentDateTime = function(w) {
    if (!w) {
      var currentDate = new Date();
      return moment().format("MM/DD/YYYY HH:mm");
    } else {
      var currentDate = new Date();
      return moment().format("MM-DD-YYYY HH:mm");
    }
  }
  $rootScope.getProcessStartTime = function() {

    var currentDate = new Date(new Date() - 1 * 60000);

    return moment(currentDate).format("MM-DD-YYYY HH:mm");

  }

  $rootScope.getProcessOrginalTime = function() {
    var currentDate = new Date();

    return moment(currentDate).format("MM-DD-YYYY HH:mm");
  }
  $rootScope.formatForAscend = function(dt) {
    return moment.parseZone(dt).local().format('YYYY-MM-DD HH:mm:ss')
  }
  $rootScope.formatForDeliveryTicket = function(dt) {
    var origDate = new Date(new Date(dt) + 5 * 60000);
    return origDate;
  }
  $rootScope.showNodeLoader = function() {
    if ($rootScope.hasInternet) {
      $ionicLoading.show({
        template: '<ion-spinner></ion-spinner><br><br><br><br><p>Uploading Attachment</p>'
      });
    }
  }

  $rootScope.hideNodeLoader = function() {
    $ionicLoading.hide();
  }

  //$scope.loginDependency = { 'sites': ['IN', 'US', 'CA', 'SA', 'NZ'], 'drivers': ['Matt', 'Ray', 'John'], 'vehicles': ['Truck', 'Mini-Truck'] };
  $rootScope.order = {};
  void 0;

  $rootScope.showAlert = function(title, desc) {
    var alertPopup = $ionicPopup.alert({
      title: title,
      template: desc
    });

    alertPopup.then(function(res) {});
  };

  $rootScope.showToastMessage = function(msg) {
    $rootScope.toast.show = true;
    $scope.toast.toastMessage = msg;
    setTimeout(function() {
      $rootScope.toast.show = false;
    }, 5000)
  }

  $ionicPopover.fromTemplateUrl('settings-popover.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.openSettings = popover;
  });

  $rootScope.openSettingsPopover = function($event, filterByTxt) {
    $scope.filterBy = filterByTxt;
    $scope.openSettings.show($event);
  };
  $rootScope.closeSettingsPopover = function() {
    $scope.openSettings.hide();
  };
  $ionicModal.fromTemplateUrl('shiftChangeModal.html', {
    scope: $scope,
    animation: 'none',
    backdropClickToClose: true
  }).then(function(modal) {
    $rootScope.shiftChangeModal = modal;
  });

  /* Login functionality */
  $rootScope.submitted = false;
  $rootScope.isDisabled = false;
  $scope.clickOnce = function() {
    $rootScope.isDisabled = true;
    $scope.login();
    $scope.siteSelct($rootScope.selectedSite);
    /* Due to wifi is very slow we are revert to login button*/
    setTimeout(function() {
      $rootScope.isDisabled = false;
    }, 100);
    return false;
  }

  $scope.login = function(loginData) {
    loginData = (!loginData) ? $rootScope.loginData : loginData;
    loginData.resErr = false;
    var loginCredentials = {
      "LoginDetails": {
        "CustomerID": $rootScope.accSettings.customerId,
        "UserName": (loginData.uname).toLowerCase(),
        "Password": loginData.pword,
        "INSiteID": $rootScope.selectedSite.SiteID,
        "LogOnTime": new Date(),
        "Latitude": "",
        "Longitude": "",
        "Version": appConstants.appVersion,
        "DeviceID": $rootScope.deviceUid,
        "DeviceVersion": $rootScope.deviceVer
      }
    };
    $rootScope.siteValid = false;
    $scope.deleteOrderAttachmentTable();
    if ($rootScope.isInternet && $rootScope.online) {
      getAllSiteService.login(loginCredentials).then(function(response) {
        if (!$rootScope.selectedSite) {
          $rootScope.siteValid = true;
          $rootScope.isDisabled = false;
          return false;
        } else {
          /* Multi device Concepts */
          if (response.data[0].IsSessionActive == "Y") {
            setTimeout(function() {
              var confirmPopup = $ionicPopup.confirm({
                title: "Alert!",
                template: "This user is already logged in on another device.Do you want to logoff that session?",
                okText: 'Yes',
                cancelText: 'No'
              });
              confirmPopup.then(function(res) {
                if (res && $rootScope.isInternet && $rootScope.online) {
                  $rootScope.stOrdersBackground = true;
                  //service call
                  addOrderService.ClearUserSession().then(function(res) {
                    if (res) {
                      $scope.login();
                    } else {
                      console.log("Clear Session Not updated.");
                    }
                  });
                } else {
                  $rootScope.isDisabled = false;
                }
              });
            }, 1);
          } else if (response.data[0].SessionID) {
            var userId = response.data[0].LoginID;
            var lInfo = [];
            $rootScope.stOrdersBackground = true;
            $rootScope.siteValid = false;
            
            //FilterSite based on current user login
            if(response.data[0] && response.data[0].FilteredSites){
              let filteredSite = response.data[0].FilteredSites.split(",");
              //console.log("filteredSite", filteredSite);
              var formFilteredArr= [];
              filteredSite.map(function (x) { 
                formFilteredArr.push(parseInt(x, 10)); 
              });
              $localstorage.set('FilteredSite', JSON.stringify(formFilteredArr));
            }
            else{
              $localstorage.remove('FilteredSite');
            }

            lInfo.push($rootScope.selectedSite);
            var userNm = (loginCredentials.LoginDetails.UserName).toLowerCase();
            var userPw = loginData.pword;
            var siteID =  loginCredentials.LoginDetails.INSiteID;
            lInfo.push({ "uname": userNm, "pwrd": userPw, "uid": userId });
            $localstorage.set('lastlogin', JSON.stringify(lInfo));
            $rootScope.loginCredentials = response.data[0];
            $rootScope.SessionID = response.data[0].SessionID;
            $rootScope.uid = response.data[0].LoginID;

            /* Offline login information are stored in websql storage*/
            dbo.selectTable('LoginMaster', "uname=?", [userNm], function(result) {
              var data = result.data.rows;
              if (data.length <= 0) {
                dbo.insertTableMultipleData('LoginMaster', ['uname', 'pwrd', 'uid', 'siteID', 'siteFiltered', 'dateTime'], [userNm, userPw, userId, siteID, JSON.stringify(formFilteredArr), new Date()], function(tx, res) { console.log("Login details are inserted."); });
              }
            });
            $scope.loadOrders();
          } else {

            if(response.data[0].SiteID===0){
              $scope.PasswordAlert(3);
            }else{
              $scope.PasswordAlert(1);
            }
          }
        }
      }, function(err) {
        /* Login Services are error throw Or Login services respond is very slow */
        loginData.resErr = true;
        $rootScope.stOrdersBackground = true;
        addOrderService.ClearUserSession();
        setTimeout(function() {
          $scope.loginMdaUsers(loginData);
        }, 2000)
      });
    } else {
      /* Offline login */
      $scope.loginMdaUsers(loginData);
    }
    /* Get current location based on the device */
    getLocationUpdate();
    /* Check ShiftChange menu display or not*/
    //$rootScope.enbElecDOI = ($rootScope.selectedSite.SiteID == 1015) ? false : true;
  }


  $scope.loginMdaUsers = function(loginData) {
    var offUnm = (loginData.uname).toLowerCase();
    var offUpw = loginData.pword;
    let offSiteID = $rootScope.selectedSite.SiteID;
    if (offUnm != undefined && offUpw != undefined && offSiteID != undefined) {
      dbo.selectTable('LoginMaster', "uname=?", [offUnm], function(result) {
        var data = result.data.rows;
        if (data.length > 0) {
          $scope.loginFailed = false;
          var alertType;
          for (var i = 0; i < data.length; i++) {
            var res = data[i];
            $localstorage.set('FilteredSite', res.siteFiltered);
            var pwrd = res.pwrd;
            var uname = res.uname;
            let sID = res.siteID;
            if (offUnm == uname) {
              if (offUpw == pwrd) {
                if((res.siteFiltered).indexOf(offSiteID) > -1){
                  $scope.loginFailed = true;
                  $scope.loadOrders();
                }else{
                  alertType = 3; //Site is invalid
                }
              } else {
                alertType = 1;
              }
            } else {
              alertType = 2;
            }
          }
          if ($scope.loginFailed == false) {
            setTimeout(function() {
              $scope.PasswordAlert(alertType);
            }, 50);
          }
        } else {
          $scope.PasswordAlert(2);
        }
      });
    } else {
      $scope.PasswordAlert(1);
    }
  }
  $scope.PasswordAlert = function(flag) {
    setTimeout(function() {
      let msg = '';
      if(flag === 1){
        msg ="Invalid Username or Password";
      }else if(flag === 2){
        msg ="Unable to verify login information on Tablet due to no internet connection please login a user that has been recently logged in.";
      }else{
        msg ="Site is not allowed for this User";
      }
      $rootScope.showAlert("Login", msg);
      $rootScope.isDisabled = false;
    }, 1);
  }
  $scope.doLogout = function(callback) {
    $scope.stop();

    $rootScope.showConfirm("Logout", "Do you want to Logout?", function(res) {
      if (res) {
        $rootScope.loading = true;
        $scope.clearLogoutData();
        $rootScope.stOrdersBackground = false;
        addOrderService.logoutUser(function(response) {
          $rootScope.loading = false;
        });
        if (callback) {
          callback(true);
        }
      } else {
        if (callback)
          callback(false);
      }
    })
  };
  $scope.clearLogoutData = function() {
    $rootScope.loginData.pword = '';
    $rootScope.isDisabled = false;
    $('.modal-backdrop,.backdrop,.popup-container').remove();
    $('.modal-open,.popup-open').css({ "pointer-events": "auto" });
    $rootScope.closeSettingsPopover();
    $rootScope.clearDateTime = false;
    $rootScope.submitted = false;
    $rootScope.loading = false;
    /* If user click on Go offline menu, then do logout menu we will switch option */
    if ($rootScope.online == false) {
      $rootScope.online = true;
    }
    $state.go('login');
  }
  $scope.loadPage = function(page) {
    $state.go(page);
  };

  $rootScope.reloadRoute = function() {
    void 0;
    $window.location.reload();
  };
  //var res = dbo.createTable('DoiDatas',['uid INTEGER PRIMARY KEY','doiData']);

  $rootScope.myGoBack = function() {
    void 0;
    $ionicHistory.goBack();
  };
  var shipLast = null;
  $scope.loadOrders = function() {
    getUniqueOrders("OrdersMaster");
    $rootScope.clearDateTime = true;
    $scope.loadPage('orders');
    $rootScope.loading = true;
    if ($rootScope.syncRefresh) {
      ordersListService.getOrdersList().then(function(response) {

        if (response.data && response.data.userSession && response.data.userSession.IsSessionActive == 'N') {
          $rootScope.stOrdersBackground = false;
          addOrderService.logoutUser().then(function(res) {
            if (res) {
              $scope.clearLogoutData();
            }
          });
        } else {
          var res = null;
          // if (response.data.OrderUpdTime.LastUpdatedTime != null) {
          //     $localstorage.set('Open-syncDateTime', response.data.OrderUpdTime.LastUpdatedTime);
          // }
          if (appConstants.source === 'ordersNew' && response.data.OrderUpdTime && response.data.OrderUpdTime.ShipLastUpdatedTime != null) {
            $localstorage.set('Ship-syncDateTime', response.data.OrderUpdTime.ShipLastUpdatedTime);
          }
          var insertFlag = true;
          var shipDatesArray = [];
          var orderDatesArray = [];
          if (response.data.length > 0) {
            var tempOrders = [];
            var inprUpdatedTime = $localstorage.get('Ship-syncDateTime');
            var openUpdatedTime = $localstorage.get('Open-syncDateTime');
            if (inprUpdatedTime && openUpdatedTime) {
              if (inprUpdatedTime == response.data.OrderUpdTime.ShipLastUpdatedTime && openUpdatedTime == response.data.OrderUpdTime.LastUpdatedTime) {
                insertFlag = false;
              }
            }
            angular.forEach(response.data, function(value, key) {
              console.log("---------", value.Orders.OrderHdr.Status)
              if (value.Orders.OrderHdr.Status == 'Open') {
                setRequestTimestamp(1);
                orderDatesArray.push(value.Orders.OrderHdr.LastUpdatedTime)
              } else {
                setRequestTimestamp(2);
              }
              if (value.Orders.OrderHdr.OrderNotes.length > 0) {
                angular.forEach(value.Orders.OrderHdr.OrderNotes, function(val, k) {
                  if (val && val.Note)
                    val.Note = val.Note.replace(/\\r\\n/g, "\n");
                });
              }
              tempOrders.push({ "Orders": value });
              if (key == response.data.length - 1) {
                if (3 > 2) {
                  res = $scope.loadOnSql(tempOrders);
                } else {
                  res = $scope.loadOnSql([]);
                }
              }
            });
          } else {
            $scope.loadOnSql([]);
          }
          if (orderDatesArray.length > 0) {
            var maxDateTime = calcMaxDate(orderDatesArray);
            $localstorage.set('Open-syncDateTime', maxDateTime);
          }
        }
      }, function(err) {
        console.log(err);
        $scope.start();
      });
    }
  }

  $scope.loadOrdersBackground = function() {
    $rootScope.showLoading = false;
    $rootScope.clearDateTime = false;
    ordersListService.getOrdersList().then(function(response) {
      $rootScope.showLoading = true;
      if (response.data && response.data.userSession && response.data.userSession.IsSessionActive == 'N') {
        $rootScope.stOrdersBackground = false;
        addOrderService.logoutUser().then(function(res) {
          if (res) {
            $scope.clearLogoutData();
          }
        });
      }
      var orderDatesArray = [];
      var insertFlag = true;
      if (response.data.length > 0) {
        var tempOrders = [];
        var inprUpdatedTime = $localstorage.get('Ship-syncDateTime');
        var openUpdatedTime = $localstorage.get('Open-syncDateTime');
        if (inprUpdatedTime && openUpdatedTime) {
          if (inprUpdatedTime == response.data.OrderUpdTime.ShipLastUpdatedTime && openUpdatedTime == response.data.OrderUpdTime.LastUpdatedTime) {
            insertFlag = false;
          }
        }
        if (appConstants.source === 'ordersNew') {
          $localstorage.set('Ship-syncDateTime', response.data.OrderUpdTime.ShipLastUpdatedTime);
        }
        angular.forEach(response.data, function(value, key) {

          if (value.Orders.OrderHdr.Status == 'Open' || value.Orders.OrderHdr.Status == 'Reassigned by Dispatch') {
            setRequestTimestamp(1);
            orderDatesArray.push(value.Orders.OrderHdr.LastUpdatedTime)
          } else {
            setRequestTimestamp(2);
          }

          angular.forEach(value.Orders.OrderHdr.OrderNotes, function(val, k) {
            if (val && val.Note) {
              val.Note = val.Note.replace(/\\r\\n/g, "\n");
            }
          });
          tempOrders.push({ "Orders": value });
          if (key == response.data.length - 1) {
            if (3 > 2) {
              $scope.loadOnSql(tempOrders);
            } else {
              $scope.loadOnSql([]);
            }
          }
        });
      } else {
        $scope.loadOnSql([]);
      }
      if (orderDatesArray.length > 0) {
        var maxDateTime = calcMaxDate(orderDatesArray);
        $localstorage.set('Open-syncDateTime', maxDateTime);
      }

    }, function(err) {
      console.log(err);
      $scope.engineRunning = false;
    });
  };

  function calcMaxDate(datesArray) {
    var maxDateTime = null;
    for (var i = 0; i < datesArray.length; i++) {
      if (!maxDateTime) {
        maxDateTime = datesArray[i];
      }
      if (Date.parse(datesArray[i]) > Date.parse(maxDateTime)) {
        maxDateTime = datesArray[i];
      }
    }
    return maxDateTime;
  }

  $scope.sleep_time = 15000;
  $scope.initEngine = false;
  $scope.start = function(sleep_time) {
    $timeout(function() {
      if ($scope.engineRunning) {
        console.log('engine started');
        $scope.start($scope.sleep_time);
      } else {
        $scope.engineRunning = true;
        if ($scope.stOrdersBackground && $scope.shouldSync && $rootScope.syncRefresh) {
          $scope.loadOrdersBackground();
        } else {
          $scope.engineRunning = false;
        }
        $scope.start($scope.sleep_time);
      }
    }, sleep_time);
  };
  $scope.stop = function() {
    $interval.cancel($scope.myCall);
  };

  var gi = 0;
  $scope.loadOnSql = function(tempOrders) {
    var promises = [];
    tempOrders.forEach(function(order, index) {
      var promise = saveOrdersSynchronus(order);
      promises.push(promise.then(saveOrdersOffline));
    });
    $q.all(promises).then(function() {
      $scope.engineRunning = false;
      $rootScope.disableRefresh = false;
      console.log('all resolved');
      if (tempOrders.length > 0) {
        $rootScope.$broadcast('OrdersInserted')
      } else {
        $rootScope.disableRefresh = true;
      }
      if (!$scope.initEngine) {
        console.log('starting enginge');
        $scope.start($scope.sleep_time);
        $scope.initEngine = true;
      }
    })

    function saveOrdersSynchronus(order) {
      var deferred = $q.defer();
      dbo.selectTable('OrdersMaster', "SysTrxNo=?", [order.Orders.OrderHdr.SysTrxNo], function(results) {
        var finalResult = {
          results: results,
          order: order
        }
        deferred.resolve(finalResult);
      });
      return deferred.promise;
    }

    function formOpenOrderJson(serverOrder) {
      //Form order items for open Orders from Server
      var orderServer = {};
      orderServer = serverOrder.Orders.OrderHdr;

      var orderItemsServer = serverOrder.Orders.OrderItems;
      angular.forEach(orderItemsServer, function(value, key) {
        formOrderItems(value, orderServer);
      });
      return serverOrder;
    }

    function saveOrdersOffline(finalResult) {
      gi++;
      var results = finalResult.results;
      var order = finalResult.order;
      var rs = results.data;
      var len = rs.rows.length;
      var deferred = $q.defer();
      if (len > 0) {
        var item = rs.rows.item(0);
        var localData = JSON.parse(item.orderData);
        var localTimestamp = localData.Orders.cTs;
        var serverTimestamp = order.Orders.cTs;

        var serverDeviceID = null;
        var localDeviceID = $rootScope.deviceUid;
        if (order.Orders.DeviceID) {
          serverDeviceID = (order.Orders.DeviceID);
        }

        var orderJson = '';
        if (order.Orders.OrderHdr.Status == 'Open') {
          order.Orders.OrderDeliveryDetail={};
          orderJson = formOpenOrderJson(order);
        } else {
          orderJson = order;
        }

        if (order.Orders.OrderHdr.StatusCode != "K" && order.Orders.OrderHdr.StatusCode != "Z") {
          var shouldUpdate = false;
          if ((localTimestamp <= serverTimestamp + 120000) && (localDeviceID != serverDeviceID || $rootScope.deviceUid == 'Browser')) {
            shouldUpdate = true;
          } else if (order.Orders.OrderHdr.Status == 'Open') {
            shouldUpdate = true;
            $scope.orderDT = moment.utc(); // Current Date & time
            $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
            order.Orders.cTs = $scope.orderTs;
            order.Orders.forceDoiComplete = true;
            if (!order.Orders.activeAction) {
              order.Orders.activeAction = "Ship";
            }
            attachShiftChangeData(order.Orders);
          }
          if (order.Orders.OrderHdr.Status == 'Delivered') {
            shouldUpdate = true;
          }
          if (shouldUpdate) {
            orderJson.Orders.OrderHdrData = $rootScope.formOrderHeaderJson(orderJson.Orders.OrderHdr);
            var webOrderData = JSON.stringify(order);
            webOrderData = replaceSpecialChars(webOrderData);

            var webHdrOrderData = JSON.stringify(order.Orders.OrderHdrData);
            webHdrOrderData = replaceSpecialChars(webHdrOrderData);

            dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'siteId=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [order.Orders.OrderHdr.SysTrxNo, order.Orders.OrderHdr.Status, order.Orders.OrderHdr.MasterSiteID, webOrderData, webHdrOrderData, order.Orders.OrderHdr.SysTrxNo], function(tx, res) {
              deferred.resolve();
            });
          } else {
            deferred.resolve();
          }
        } else {
          let SysTrxNo = order.Orders.OrderHdr.SysTrxNo;
          $rootScope.$broadcast('order-dispatched', { OrderNo: order.Orders.OrderHdr.OrderNo });
          $rootScope.showToastMessage("Order Undispatched!");
          dbo.deleteTableData('DoiMaster', "SysTrxNo=?", [SysTrxNo], function(tx, res) {
            deferred.resolve();
          });
          dbo.deleteTableData('DataMaster', "SysTrxNo=?", [SysTrxNo], function(tx, res) {
            deferred.resolve();
          });
          dbo.deleteTableData('OrdersMaster', "SysTrxNo=?", [SysTrxNo], function(tx, res) {
            deferred.resolve();
          });

          if (window.cordova) {
            setTimeout(function(){
              $scope.deleteFileFromDevice(order.Orders.OrderHdr.OrderNo);
            },4000);
          }
        }
      } else {
        // Set current date & time for each order.
        $scope.orderDT = moment.utc(); // Current Date & time
        $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
        order.Orders.cTs = $scope.orderTs;
        order.Orders.forceDoiComplete = true;
        if (!order.Orders.activeAction) {
          order.Orders.activeAction = "Ship";
        }
        if (order.Orders.OrderHdr.Status == "Open") {
          formOrderJson(order.orderData, order);
          attachShiftChangeData(order.Orders);
        }
        if (order.Orders.OrderHdr.StatusCode != "Z") {
          if (order.Orders.OrderHdr.StatusCode === "K") {
            order.Orders.OrderHdr.StatusCode = "O";
            order.Orders.OrderHdr.Status = "Open";
          }
          order.Orders.OrderHdrData = $rootScope.formOrderHeaderJson(order.Orders.OrderHdr);
          var webOrderData = JSON.stringify(order);
          webOrderData = replaceSpecialChars(webOrderData);

          var webHdrOrderData = JSON.stringify(order.Orders.OrderHdrData);
          webHdrOrderData = replaceSpecialChars(webHdrOrderData);


          dbo.insertTableMultipleData('OrdersMaster', ['orderNo', 'SysTrxNo', 'status', 'siteId', 'orderData', 'orderHdrData', 'dateTime'], [order.Orders.OrderHdr.OrderNo, order.Orders.OrderHdr.SysTrxNo, order.Orders.OrderHdr.Status, order.Orders.OrderHdr.MasterSiteID, webOrderData, webHdrOrderData, new Date()], function(tx, res) {
            deferred.resolve();
          });
        } else {
          deferred.resolve();
        }

      }
      return deferred.promise;
    }

  }

  function replaceSpecialChars(obj) {
    return obj.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#42;/g, '\*').replace(/&#63;/g, '\?').replace(/&#39;/g, "'");
  }

  function formOrderItems(item, order) {
    item.Editable = false;
    item.Ship = {};
    item.Ship.meterReadings = [{}];
    item.Deliver = {};
    if (item.Source && item.Source.length > 0) {
      item.Ship.Source = item.Source;
    } else {
      item.Ship.Source = [];
    }

    item.Ship.Receiving = [];

    if (item.IsBillable == 'Y') {
      // item.Deliver.quantityShipped = item.Qty;
    }
    item.Deliver.Source = [];
    if (item.Receiving && item.Receiving.length > 0) {
      item.Deliver.Receiving = item.Receiving;
    } else {
      item.Deliver.Receiving = [];
    }
    if (order.Vehicle.EnforceShipmentMarineApp === 'N') {
      item.Deliver.Source = item.Source;
    }
    if (item.SellByUOMID != item.OnCountUOMID) {
      item.UOMChanged = true;
    }
    item.Deliver.vessel = order.Vessels[0];
    item.Deliver.meterReadings = [{}];
    item.deliveryList = [];

    // Tank reading validation flag
    item.posSrcHideFinishBtn = 0;
    item.posRecvHideFinishBtn = 0;
    item.negSrcHideFinishBtn = 0;
    item.negRecvHideFinishBtn = 0;
    
    setStatus(item);
  }

  function setStatus(item) {
    var actions = ['Ship', 'Deliver'];
    actions.forEach(function(Action) {
      if (!item[Action].overallStatus) {
        item[Action].overallStatus = 'initial';
        if (item.IsPackaged == 'Y') {
          item[Action].statusList = ['initial', 'finished'];
        } else {
          if (item.IsBillable == 'Y') {
            if (item.BIUOM != 'Each') {
              item[Action].statusList = ['initial', 'inprogress', 'finished'];
            } else {
              item[Action].statusList = ['initial', 'finished'];
            }
            if (Action == 'Ship')
              item[Action].overallStatus = 'finished';
            // item[Action].statusList = ['initial', 'finished'];
          } else {
            item[Action].statusList = ['initial', 'inprogress', 'finished'];
          }
        }
      }
    })
  }

  function formOrderJson(localOrder, serverOrder) {

    var sqlOrderJson = {},
      orderItemsServer = serverOrder.Orders.OrderItems;
    var orderServer = {},
      orderLocal = {};
    orderServer = serverOrder.Orders.OrderHdr;
    if (localOrder) {
      sqlOrderJson = JSON.parse(localOrder);
      orderLocal = sqlOrderJson.Orders.OrderHdr;
    } else {
      orderLocal = sqlOrderJson;
    }
    orderLocal.MarineSessionID = 545;

    orderLocal.OrderDtTm = orderServer.OrderDtTm;
    orderLocal.DtTm = orderServer.DtTm;
    orderLocal.LastStatusDate = orderServer.LastStatusDate;
    orderLocal.ToSiteID = orderServer.ToSiteID;

    orderLocal.VehicleID = orderServer.Vehicle.VehicleID;

    orderLocal.DriverID = orderServer.Driver.DriverID;
    orderLocal.CustomerNumber = orderServer.CustomerNumber;
    angular.forEach(orderItemsServer, function(value, key) {
      formOrderItems(value, orderServer);
    });
    orderDataJson = sqlOrderJson;
    return orderDataJson;
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
    if (!order.OrderHdr.MultiVessel) {
      order.OrderHdr.MultiVessel = [];
    }
  }

  $scope.showShiftChangeResults = function(res, cb) {
    if (!res.success)
      return false;
    var rs = res.data;
    var len = rs.rows.length,
      i;
    if (len > 0) {
      var data = [];

      for (var i = 0; i < len; i++) {
        var row = rs.rows.item(i);
        data.push(JSON.parse(row['orderData']));
      }
      $scope.receivedOrders = data;
      $rootScope.loading = false;

    } else {
      void 0;
    }
    cb();
  };

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

  $rootScope.changeShiftForLoginUser = function() {
    dbo.selectTable('OrdersMaster', "", [], function(res) {
      $scope.showShiftChangeResults(res, function() {
        $scope.shiftChangeOrders = [];
        $scope.receivedOrders.forEach(function(orderObj) {
          var order = orderObj.Orders;
          order.OrderHdr.vesselStr = $rootScope.formMultiVesselStr(order.OrderHdr);
          if (order.OrderHdr.StatusCode == 'L' || order.OrderHdr.StatusCode == 'P' || order.OrderHdr.StatusCode == 'T') {
            var sc = false;
            var activeAction = order.activeAction;
            var sc = $scope.isFullBulk(order.OrderItems);
            var sessUn = '';
            var logUn = '';
            if (order.OrderHdr.currentUser) {
              sessUn = (order.OrderHdr.currentUser).toLowerCase();
            }
            if ($rootScope.loginData.uname) {
              logUn = ($rootScope.loginData.uname).toLowerCase();
            }

            if ( order.OrderHdr.AllowDOI == 'N' || order.OrderHdr.AllowDOIShipTo == 'N' || order.OrderHdr.EnableElectronicDOI == 'N' || !sc) {
              if (order.OrderHdr.currentUser && sessUn == logUn) {
                //set current user to null
                order.OrderHdr.currentUser = null;
                order.OrderHdrData.currentUser = null;
                dbService.upsertOrder(order, function(tx, res) {});
                //save and upsert order
                dbService.upsertAndSave(order, function() {});
              }
            } 
            else {
              let flag = $rootScope.bulkItemNotInitial(order.OrderItems, activeAction);
              let itemSts = $rootScope.bulkItemStatus(order.OrderItems, activeAction);

              if(flag){
                if(itemSts===1){
                  // If each item with finished (Green) status, then current user logoff for related all orders.
                  if (order.OrderHdr.currentUser && sessUn == logUn) {
                    //set current user to null
                    order.OrderHdr.currentUser = null;
                    order.OrderHdrData.currentUser = null;
                    dbService.upsertOrder(order, function(tx, res) {});
                    //save and upsert order
                    dbService.upsertAndSave(order, function() {});
                  }
                }
                else{
                  // Each item with inprogress (Orange) status, Going to shift change screen
                  order.transferDetails.changedShift = order.transferDetails.userRole;
                  order.loginUser = $rootScope.loginData.uname;
                  if (sessUn == logUn) {
                    $scope.shiftChangeOrders.push(order);
                  }
                }
              }
              else{
                // Each item with initial (Red) status, then current user logoff for related all orders.
                if (order.OrderHdr.currentUser && sessUn == logUn) {
                  //set current user to null
                  order.OrderHdr.currentUser = null;
                  order.OrderHdrData.currentUser = null;
                  dbService.upsertOrder(order, function(tx, res) {});
                  //save and upsert order
                  dbService.upsertAndSave(order, function() {});
                }
              }
            }
          }
        })
        if ($scope.shiftChangeOrders.length > 0) {
          $state.go('shiftchangeorders');
        } else {
          $scope.doLogout(function(res) {
            if (res)
              $rootScope.showToastMessage("Shift Changed");
          });
        }
      });

    });
  }
  $rootScope.setTitle = function(obj, title) {
    obj.title = title;
  }

  // A confirm dialog
  $rootScope.showConfirm = function(title, msg, callback) {
    var confirmPopup = $ionicPopup.confirm({
      title: title,
      template: msg,
      okText: 'Yes',
      cancelText: 'No'
    });

    confirmPopup.then(function(res) {
      if (res) {
        callback(res);
      } else {
        callback(res);
      }
    });
  };

  $rootScope.uploadPDF = function(fileId, fileName, fileData, orderHeader) {
    var reqData = {
      "Attachment": [{
        'OrderNo': orderHeader.OrderNo,
        'SysTrxNo': orderHeader.SysTrxNo,
        "Attachment_name": fileName,
        "DeviceTime": $rootScope.getCurrentDateTime(),
        "CustomerID": appConstants.customerId,
        "Attachment": fileData,
        "AttachmentID": fileId,
        "UserID": $rootScope.loginData.uname,
        "CompanyID": $rootScope.CompanyID
      }]
    };

    addOrderService.postAttachment(reqData).then(function(response) {
      $scope.getLogs();
    });
  }

  $scope.goTankReading = function() {
    $state.go('tanks');
  }

  $scope.siteSelct = function(siteObj) {
    $rootScope.selectedSite = siteObj
    $rootScope.siteFlag = false;
    $rootScope.siteValid = false;
    $rootScope.CompanyId = siteObj.CompanyId;
  }
  Idle.watch();

  $rootScope.syncOrders = function() {
    //check if connection available
    //get Distinct orders
    //for each order get UpdateOrders,Shipment and deliveryList
    //replay each of these
    if ($rootScope.isInternet && $rootScope.online) {
      getUniqueOrders("SyncMaster");
    }
  }

  function getOrdersToSync() {
    var apiToCheck = ['MN_UpdateOrders', 'MN_UpdateOrderStatusHistory', 'MN_UpdateShipmentDetails', 'MN_UpdateDeliveryDetails', 'meterTicket', 'doi', 'deliveryTicket', 'notes', 'attachmentDoc', 'MN_UpdateOrderNotesFromApp', 'MN_UpdateINSiteTankVolume', 'MN_CalcShipReading', 'MN_UpdateLogOutDetails', 'MN_CancelOrders', 'MN_CalWeightVolumeQty'];
    var whereClause = '';
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
      if (results.rows.length > 0) {
        $rootScope.syncRefresh = false;
        replayRequests(results.rows)
      } else {
        $rootScope.syncRefresh = true;
        $scope.syncRunning = false;
        setTimeout(function() {
          $ionicLoading.hide();
        }, 500);
      }

    });
  }

  function getUniqueOrders(tableName) {
    dbo.getUniqueOrders(tableName, [], function(results) {
      var len = results.rows.length;
      var SystrxArr = [];
      var rejectedSysTrxArr = [];
      for (var i = 0; i < len; i++) {
        var res = results.rows[i];
        if(res.SysTrxNo && res.SysTrxNo !=undefined){
          SystrxArr.push(res.SysTrxNo);
        }
      }
      var data = {
        "params": [{
          "name": "SysTrxNo",
          "value": SystrxArr.join()
        }]
      }
      addOrderService.getOrderStatus(data).
      then(function(values) {
        //just delete ineligble orders at one go
        values.data.forEach(function(value) {
          if (tableName == "SyncMaster") {
            if (value.OrderStatus === "D" || value.OrderStatus === "Z") {
              rejectedSysTrxArr.push(value.SysTrxNo)
            }
          } else {
            if (value.OrderStatus === "Z") {
              rejectedSysTrxArr.push(value.SysTrxNo)
            }
          }

        })
        if (rejectedSysTrxArr.length > 0) {
          deleteInvoicedOrders(rejectedSysTrxArr, tableName)
        } else {
          if (tableName == "SyncMaster") {
            getOrdersToSync();
          }
        }

      })
    })
  }



  function deleteInvoicedOrders(SystrxArr, tableName) {
    var whereClause = "";
    SystrxArr.forEach(function(sysno, index) {
      if (index < SystrxArr.length - 1) {
        whereClause = whereClause + ' SysTrxNo = ' + sysno + ' OR ';
      } else {
        whereClause = whereClause + ' SysTrxNo = ' + sysno;
      }
    })
    dbo.deleteTableData(tableName, whereClause, [], function(tx, res) {
      if (tableName == "SyncMaster") {
        getOrdersToSync();
      }
    });
    dbo.deleteTableData("DoiMaster", whereClause, [], function(tx, res) { });
    dbo.deleteTableData("DataMaster", whereClause, [], function(tx, res) { });
  }


  function replayRequests(results) {
    var pendingRequests = [];
    for (var i = 0; i < results.length; i++) {
      pendingRequests.push(results[i])
    }
    var index = 1;
    var requestLength = pendingRequests.length;
    var deCnt = requestLength;

    function sequenceRequest(request) {
      makeRequest(request).success(function(data) {
        dbo.deleteTableData('SyncMaster', 'orderNo = ? AND SysTrxNo = ? AND id = ?', [request.orderNo, request.SysTrxNo, request.id]);
        if (index < requestLength) {
          index = index + 1;
          deCnt = deCnt - 1;
          syncLoading(deCnt);
          //setTimeout calls will be put on the call stack
          //the index will be set to last by the time this setTimeout is triggered
          //wrap it in its own scope
          (function(index) {
            setTimeout(function() {
              sequenceRequest(pendingRequests[index - 1]);
            }, 5000)
          })(index);

        } else {
          $scope.syncRunning = false;
          $rootScope.syncInProgress = 0;
          getOrdersToSync();
        }
      }).error(function(err) {
        $scope.syncRunning = false;
        $rootScope.syncInProgress = 0;
        index = index + 1;
        deCnt = deCnt - 1;
        syncLoading(deCnt);
        $rootScope.syncInProgress = 0;
        // if ($rootScope.online && $rootScope.isInternet) {
        //   setTimeout(function() {
        //     sequenceRequest(pendingRequests[index - 1]);
        //   }, 5000)
        // } else {
        //   //  alert("Syncing failed.Please try again when connectivity is better");

        // }
        // console.log("err", err);
      }).catch(function(err) {
        $rootScope.syncInProgress = 0;
      })
    }
    sequenceRequest(pendingRequests[0])
  }

  function syncLoading(deLen) {
    //show the loader
    // $ionicLoading.show({
    //   template: '<ion-spinner></ion-spinner><br><br><p>Syncing...Records Left:<br>' + deLen + '</p>'
    // });
    $rootScope.syncInProgress = deLen;
  }
  $rootScope.syncInProgress = 0;

  function makeRequest(data) {
    var d = JSON.parse(data.config);
    var req = {};
    req.url = d.url;
    req.method = d.method;
    req.data = d.data;
    req.headers = d.headers;
    return $http(req)
    //make request
    //resolve promise
    //delete request
  }

  //type


  $scope.startSync = function(sync_time) {
    $timeout(function() {
      if ($scope.syncRunning) {
        $scope.startSync($scope.sync_time);
      } else {
        $scope.syncRunning = true;
        $scope.syncOrders();
        $scope.startSync($scope.sync_time);
      }
    }, sync_time);
  };
  $scope.sync_time = 120000;
  //$scope.startSync(0);
  /* Export MarineSales Database */
  $scope.debug = function() {
    if (appConstants.dump == 'json') {
      dbo.ordersMasterTable('OrdersMaster', $scope.successFn);
    } else {
      var successFn = function(sql, count) {
        $scope.dumpGenerate(sql);
      };
      cordova.plugins.sqlitePorter.exportDbToSql(dbDriver, {
        successFn: successFn
      });
    }
  }
  $scope.successFn = function(res) {
    var orderMasterLs = res.data.rows;
    var orderMasterLen = orderMasterLs.length;
    if (orderMasterLen > 0) {
      var data = [];
      for (var i = 0; i < orderMasterLen; i++) {
        var row = orderMasterLs.item(i);
        data.push(row['orderData']);
      }
      data = '[' + data + ']';
      $scope.dumpGenerate(data);
    }
  }
  $scope.dumpGenerate = function(data) {
    var currentDate = $rootScope.getCurrentDateTime();
    $scope.currDate = moment(currentDate).format("YYYY-MM-DD");
    $scope.currHours = moment(currentDate).format("HH-mm-A");
    $scope.currDT = $scope.currDate + '_' + $scope.currHours;
    var reqData = {
      "dump": [{
        "dTime": $scope.currDT,
        "file": data,
        "type": appConstants.dump,
        "SessionID": $rootScope.SessionID,
        "User": $rootScope.loginData.uname
      }]
    };
    var data = {
      requestData: reqData,
      env: appConstants.env
    };
    $http.post(appConstants.nodeURL + 'dumpData', data).success(function(res) {
        $timeout(function() {
          $ionicPopup.alert({
            title: 'Alert!',
            template: 'Dump has been sent to the server.'
          });
        }, 1000);
      })
      .error(function(err) {
        $timeout(function() {
          $ionicPopup.alert({
            title: 'Alert!',
            template: 'ERR - Dump Sql Failed.'
          });
        }, 1000);
      });
  }
  $rootScope.getSiteData(0);
  /* Dynamically get Company logo */
  $scope.getLogo = function() {
    if ($rootScope.online && $rootScope.isInternet) {
      dbo.deleteTableData('CompanyMaster', "", [], function(tx, res) {
        dbo.selectTable('CompanyMaster', "", [], function(results) {
          if (results.data.rows.length == 0) {
            addOrderService.getDocLogo().then(function(result) {
              if (result) {
                for (var i = 0; i < result.data.length; i++) {
                  var res = result.data[i];
                  dbo.insertTableMultipleData('CompanyMaster', ['CompanyID', 'CustomerID', 'Active', 'LogoImage', 'CustomerNo', 'dateTime'], [res.CompanyID, res.ClientID, res.Active, res.LogoImage, res.Central_Phone_Number, new Date()], function(tx, res) {});
                }
              } else {
                console.log("Not updated.");
              }
            });
          }
        });
      });
    }
  }
  $scope.getLogo();
  $rootScope.$watch('isInternet', function(nv, ov) {
    if (!nv) {
      Notify.pop('warn', "No Network. You are now offline.", 'e201');
      $('.order-tabs .tab-nav').addClass('offline');
    } else {
      $('.order-tabs .tab-nav').removeClass('offline');
    }
  });

  /* GoOffline/GoOnline for users customized */
  $scope.offline = function() {
    $rootScope.closeSettingsPopover();
    if ($rootScope.online) {
      $rootScope.online = false
    } else {
      $rootScope.online = true;
    }
  }

  // window.addEventListener('native.keyboardshow', keyboardShowHandler);
  // window.addEventListener('native.keyboardhide', keyboardHideHandler);
  // window.addEventListener('touchstart', tapCoordinates);
  // let y;
  // let h;
  // let offsetY;

  // function tapCoordinates(e) {
  //   y = e.touches[0].clientY;
  //   h = window.innerHeight;
  //   offsetY = (h - y);
  //   //console.log("offset = " + offsetY);
  // }

  // function keyboardShowHandler(e) {
  //   let kH = e.keyboardHeight;
  //   //console.log(e.keyboardHeight);
  //   let bodyMove = document.querySelector(".platform-webview"),
  //     bodyMoveStyle = bodyMove.style;
  //   //console.log("calculating " + kH + "-" + offsetY + "=" + (kH - offsetY));

  //   if (offsetY < kH + 40) {
  //     bodyMoveStyle.bottom = (kH - offsetY + 40) + "px";
  //     bodyMoveStyle.top = "initial";
  //   }
  // }

  // function keyboardHideHandler() {
  //   //console.log('gone');
  //   let removeStyles = document.querySelector(".platform-webview");
  //   removeStyles.removeAttribute("style");
  // }

  $rootScope.formOrderHeaderJson = function(data) {
    var deliveryCodes = (data.deliveryCodes && data.deliveryCodes != null && data.deliveryCodes != undefined) ? data.deliveryCodes : [];
    var currentUser = (data.currentUser) ? data.currentUser : null;
    var vesselStr = $rootScope.formMultiVesselStr(data);
    var formObj = {
      'CompanyID': data.CompanyID,
      'MasterSiteID': data.MasterSiteID,
      'OrderNo': data.OrderNo,
      'SysTrxNo': data.SysTrxNo,
      'siteId': data.MasterSiteID,
      'OrderDtTm': data.OrderDtTm,
      'OrderNotes': data.OrderNotes,
      'CustomerName': data.CustomerName,
      'ToSiteCode': data.ToSiteCode,
      'ReceivingContactName': data.ReceivingContactName,
      'InternalTransferOrder': data.InternalTransferOrder,
      'INSiteCode': data.INSiteCode,
      'Vessels': data.Vessels,
      'Vehicle': data.Vehicle,
      'Status': data.Status,
      'Destination': data.Destination,
      'deliveryCodes': deliveryCodes,
      'EnableElectronicDOI': data.EnableElectronicDOI,
      'currentUser': currentUser,
      'deliveryDtm': data.deliveryDtm || null,
      'vesselStr': vesselStr
    }
    return formObj;
  }

  /* Multiple Vessels are combined one string */
  $rootScope.formMultiVesselStr = function(obj) {
    var vesselStr = '';
    if (obj.MultiVessel && obj.MultiVessel.length > 0) {
      vesselStr = (obj.MultiVessel.toString()).replace(/,/g, ",  ");
    } else {
      if (obj.Vessels && obj.Vessels.length > 0) {
        vesselStr = obj.Vessels[0].dfVesselCode || 'Unassigned';
      }
    }
    return vesselStr;
  }

  /* Remove local Files based on the Orders is invoiced */
  $scope.deleteFileFromDevice = async function(orderNo) {
    var path = $rootScope.DevicePath + orderNo;
    await window.resolveLocalFileSystemURL(path, function(entry) {
      function success(parent) {
        console.log("Remove Recursively Succeeded");
      }

      function fail(error) {
        console.log("Failed to remove directory or it's contents: " + error.code);
      }
      // remove the directory and all it's contents
      entry.removeRecursively(success, fail);

    });
  }

  Array.prototype.move = function(old_index, new_index) {
    if (new_index >= this.length) {
      var k = new_index - this.length;
      while ((k--) + 1) {
        this.push(undefined);
      }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
  };

  $scope.beginShiftChange = function() {
    $scope.$broadcast('shiftChange');
  };

  var setRequestTimestamp = function(flag) {
    var currentTimeStamp = moment.utc().subtract(2, "minutes"); // Current Date & time
    var lastRequestTime = currentTimeStamp.unix(); // Current timestamp
    if (flag == 1) {
      $localstorage.set('OpenlastRequestTimestamp', lastRequestTime);
    } else {
      $localstorage.set('ShiplastRequestTimestamp', lastRequestTime);
    }
  }

  /* Get current location based on the device */
  function getLocationUpdate() {
    if (navigator.geolocation) {
      var getWatch = $localstorage.get('watchPosition');
      if (getWatch == undefined) {
        var formObj = [];
        formObj.push({ "lat": null, "lon": null, "unique-timestamp": moment.utc().valueOf() });
        $localstorage.set('watchPosition', JSON.stringify(formObj));
      }
      navigator.geolocation.getCurrentPosition(showLocation, errorHandler);
    } else {
      console.log("Sorry, browser does not support geolocation!");
    }
  }

  setInterval(function() {
    if (navigator.geolocation) {
      if (window.cordova && window.cordova.plugins.locationServices) {
        var options = { timeout: 60000, interval: 180000 };
        cordova.plugins.locationServices.geolocation.watchPosition(showLocation, errorHandler, options);
      }
    } else {
      console.log("Sorry, browser does not support geolocation!");
    }
  }, 180000);

  function showLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;
    var formObj = [];
    formObj.push({ "lat": latitude, "lon": longitude, "unique-timestamp": moment.utc().valueOf() });
    $localstorage.set('watchPosition', JSON.stringify(formObj));
  }

  function errorHandler(err) {
    if (err.code == 1) {
      console.log("Error: Access is denied!");
    } else if (err.code == 2) {
      console.log("Error: Position is unavailable!");
    } else if (err.code == 3) {
      console.log("Error: Timeout expired!");
    }
  }

  /* Based on environment Doi Signature (48 Signature) is required or not */
  $rootScope.DoiFill = function() {
    $rootScope.isRequiredDoi = false;
    if (appConstants.env === "qa") {
      $rootScope.isRequiredDoi = true;
    }
  }

  $rootScope.DoiFill();
  
  /* Delete a record from OrderAttachmentMaster */
  $scope.deleteOrderAttachmentTable = function(){
    let currentMoment = moment.utc().valueOf();
    let deferred = $q.defer();
    dbo.OrderAttachmentTable(currentMoment, function(result) {
      let data = result.data.rows;
      let sysArr = [];
      if (data.length) {
        for (let i = 0; i < data.length; i++) {
          let arr = data[i];
          dbo.deleteTableData('OrderAttachmentMaster', "SysTrxNo=?", [arr.SysTrxNo], function(tx, res) {
            deferred.resolve();
          });
        }
      }
      else{
        console.log("No data found!");
      }
    });

  }

  /* Post offline data - SyncMaster table, if user click on the upload button */
  $rootScope.postSyncMasterData=function(){
    if ($rootScope.isInternet && $rootScope.online) {
      dbo.selectTable('SyncMaster', "", [], function(res) {
        var data = res.data.rows;
        console.log("data",data);
        if (data.length > 0) {
          getUniqueOrders("SyncMaster");
        }
        else{
          Notify.pop('error', 'No orders present in Sync Table', 'e101');
          return;
        }
      });
    }
  }

  /* In production, offline sync table check every 5 minutes to check the data is available or not */
  $scope.offlineSyncTable = function() {
    $timeout(function() {
      $scope.postSyncMasterData()
    }, 300000);
  };

  if(appConstants.env == 'prod'){
    $scope.offlineSyncTable();
  }


  /* Common Functions for new shiftChange and DOI */
  $rootScope.bulkItemNotInitial = function(itemList, activeAction) {
    //Check bulk items with Not initial status.
    let notInitial = false;
    angular.forEach(itemList, function(item) {
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
      if (bulk && item[activeAction].overallStatus !== 'initial') {
        notInitial = true;
      }
    });
    return (notInitial);
  }

  $rootScope.bulkItemStatus = function(itemList, activeAction){
    //1- Finished, 2- inprogress, 3- Initial
    let stsFlag = 1;
    let cont = true;
    angular.forEach(itemList, function(item) {
      var bulk;
      if(cont){
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
        if(bulk){
          if(item[activeAction].overallStatus == 'inprogress'){
            stsFlag=2;
            cont = false;
          }
          else if(item[activeAction].overallStatus == 'initial'){
            stsFlag=3;
          }
        }
      }
    });
    return (stsFlag);
  }

  $rootScope.autoLogOff = function(orders){
    orders.OrderHdr.currentUser = null;
    orders.OrderHdrData.currentUser = null;
    dbService.upsertOrder(orders, function(tx, res) {});
    dbService.upsertAndSave(orders, function(){ });
    if ($rootScope.isInternet && $rootScope.online) {
      $rootScope.loading = true;
      $rootScope.stOrdersBackground = false;
      addOrderService.logoutUser().then(function(res) {
        $rootScope.loading = false;
        $rootScope.loginData.pword = '';
        $rootScope.isDisabled = false;
        $rootScope.submitted = false;
        $state.go('login');
      });
    } else {
      $rootScope.loginData.pword = '';
      $rootScope.isDisabled = false;
      $('.modal-backdrop,.backdrop,.popup-container').remove();
      $('.modal-open,.popup-open').css({ "pointer-events": "auto" });
      $rootScope.closeSettingsPopover();
      $rootScope.submitted = false;
      $state.go('login');
    }
  }

});
