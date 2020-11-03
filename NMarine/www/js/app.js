// Ionic Starter App
var app = angular.module('starter', ['ionic', 'ngCordova', 'ngAutocomplete', 'angular.filter', 'ngMaterial', 'ngIdle', 'templates', 'fileLogger']);
var productDB = null;
app.run(function($ionicPlatform, $ionicHistory, acuteSelectService, $cordovaSQLite, $rootScope, $state, $ionicPopup, Idle, $cordovaAppVersion, addOrderService, $mdSidenav) {
  $rootScope.viewState = $state;
  $rootScope.isInternet = true;
  $rootScope.syncOrderUpdateArray = [];

  window.addEventListener("online", function() {
    setTimeout(function() {
      $rootScope.isInternet = true;
      if ($rootScope.syncInProgress == 0) {
        $rootScope.syncOrders();
      }
    }, 1000);
  }, false);
  window.addEventListener("offline", function() {
    setTimeout(function() {
      $rootScope.isInternet = false;
      $rootScope.getSiteData(0);
    }, 1000);
  }, false);
  $ionicPlatform.ready(function() {
    /* Device uinque Id*/
    document.addEventListener("deviceready", onDeviceReady, false);

    $rootScope.DevicePath = window.cordova.file.externalRootDirectory + 'Marine Attachments/';

    window.resolveLocalFileSystemURL(window.cordova.file.externalRootDirectory, function(path) {
      // console.log("Access to the directory granted succesfully");
      path.getDirectory("MarineLogs/", { create: true }, function(dir) {
        // console.log("Logs Folder created successfully.");
      });
    });


    function onDeviceReady() {
      $rootScope.deviceUid = device.uuid;
      $rootScope.deviceVer = device.version;
      $cordovaAppVersion.getVersionNumber().then(function(version) {
        $rootScope.appVersion = version;
      });
      if (window.MobileAccessibility) {
        window.MobileAccessibility.usePreferredTextZoom(false);
      }
    }
    var conType = navigator.network.connection.type;
    setTimeout(function() {
      if (conType == Connection.NONE || conType == Connection.CELL_2G) {
        $rootScope.isInternet = false;
      } else {
        $rootScope.isInternet = true;
      }
    }, 1000);

    window.addEventListener('native.keyboardshow', function() {
      document.body.classList.add('keyboard-open');
    });
    window.addEventListener('native.keyboardhide', function() {
      setTimeout(function() {
        document.body.classList.remove('keyboard-open');
      }, 1000)
    });
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      //StatusBar.styleDefault();
    }
    // Device back button handle
    $ionicPlatform.registerBackButtonAction(function(event) {
      if (true) { // your check here
        var cView = $ionicHistory.currentView();
        var currentView = cView.url;
        var getCView = currentView.split('/');
        var getIView = getCView[1];
        if (cView.stateParams && cView.stateParams.order) {
          var orderNo = cView.stateParams.order;
        }
        if (getIView === 'addorder' || getIView === 'shiftchangeorders') {
          $state.go('orders');
        } else if (getIView === 'ship') {
          $state.go('addorder', { 'order': orderNo });
        } else if (getIView === 'printDeliveryTicket') {
          $state.go('shiporder', { 'order': orderNo });
        } else if (getIView === 'ordersList' || getIView === 'login') {
          setTimeout(function() {
            // console.log("sideNav Closed");
            $('.selectdemoSelectHeader').removeClass('md-active md-clickable').addClass('md-leave');
            $mdSidenav('right').close();
          }, 1);
          setTimeout(function() {
            $ionicPopup.confirm({
              title: 'System warning',
              template: 'Are you sure you want to exit?',
              cssClass: 'modal-backdrop',
              okText: 'Yes',
              cancelText: 'No'
            }).then(function(res) {
              if (res) {
                addOrderService.logoutUser().then(function(res) {
                  // console.log(res);
                  if (res) {
                    ionic.Platform.exitApp();
                  }
                });
              }
            });
          }, 2);
        } else {
          $ionicHistory.goBack();
        }

      }
    }, 100);
    /* Ask permissions */
    var permissions = cordova.plugins.permissions;
    if (permissions) {
      var list = [
        permissions.CAMERA,
        permissions.READ_EXTERNAL_STORAGE,
        permissions.ACCESS_FINE_LOCATION
      ];

      permissions.hasPermission(list, success, null);

      function success(status) {
        if (!status.hasPermission) {
          permissions.requestPermissions(
            list,
            function(status) {
              if (!status.hasPermission) error(status.hasPermission);
              console.log('success');
            },
            error);
        }
      }

      function error(err) {
        // console.log('Camera or Storage or location permission is not turned on');
        $ionicPopup.alert({
          title: "Alert!",
          template: "Camera or Storage or location permission is not turned on"
        });
      }
    }
    // window.sqlitePlugin.deleteDatabase({ name: 'offline.db', location: 'default' }, copyDb, copyDb);

    //Check if DB exists on Internal App Storage
    //If it does open a connection to the DB
    //Else copy from app www

    // window.plugins.sqlDB.checkDbOnStorage("offline.db",cordova.file.dataDirectory,copyDb)
    var dbPath = cordova.file.dataDirectory + "offline.db";

    window.resolveLocalFileSystemURL(dbPath, dbExists, copyDb);

    function dbExists() {
      productDB = $cordovaSQLite.openDB({ name: "offline.db", location: 'default' });
    }

    function copyDb(e) {
      window.plugins.sqlDB.copy("offline.db", 0, function() {
        productDB = $cordovaSQLite.openDB({ name: "offline.db", location: 'default' });
      }, function(error) {
        // console.log(error);
        // console.log(error.toString());
        console.error("There was an error copying the database: " + error);
        productDB = $cordovaSQLite.openDB({ name: "offline.db", location: 'default' });
      });
    }

    /* Check offline( SyncMaster) data is available or not, initial app lanuch we will check */
    $rootScope.postSyncMasterData();

  });

  //check wheather device idle start
  $rootScope.$on('IdleStart', function() {
    $rootScope.stOrdersBackground = false;
    if ($rootScope.isInternet && $rootScope.online) {
      addOrderService.logoutUser().then(function(res) {
        // console.log(res);
        if (res) {
          loginInfoClear();
        }
      });
    } else {
      // loginInfoClear();
    }
    loginInfoClear();
    /* If user click on Go offline menu, then idle logout we will switch option */
    if ($rootScope.online == false) {
      $rootScope.online = true;
    }

  });

  $rootScope.$on('IdleTimeout', function() {
    $rootScope.stOrdersBackground = false;
    if ($rootScope.isInternet && $rootScope.online) {
      addOrderService.logoutUser().then(function(res) {
        if (res) {
          loginInfoClear();
        }
      });
    } else {
      addOrderService.logoutUser()
      // loginInfoClear();
    }
    loginInfoClear();
    /* If user click on Go offline menu, then idle logout we will switch option */
    if ($rootScope.online == false) {
      $rootScope.online = true;
    }
  });


  var loginInfoClear = function() {
    $rootScope.loginData.pword = '';
    $rootScope.isDisabled = false;
    $('.modal-backdrop,.backdrop,.popup-container').remove();
    $('.modal-open,.popup-open').css({ "pointer-events": "auto" });
    $rootScope.closeSettingsPopover();
    $rootScope.submitted = false;
    $rootScope.loading = false;
    $state.go('login');
  }
  $rootScope.siteFlag = false;
  $rootScope.openSiteModal = function() {
    $rootScope.siteFlag = true;
  }

  /* If user lock and resume the device */
  document.addEventListener("pause", onPause, false);
  document.addEventListener("resume", onResume, false);

  function onPause() {
    $rootScope.pasueTimeStamp = moment.utc(); // Current Date & time
    $rootScope.DevicePauseTS = $rootScope.pasueTimeStamp.valueOf(); // Current timestamp
    // console.log("$rootScope.DevicePauseTS ", $rootScope.DevicePauseTS);
  }

  function onResume() {
    $rootScope.resumeTimeStamp = moment.utc(); // Current Date & time
    $rootScope.DeviceResumeTS = $rootScope.resumeTimeStamp.valueOf(); // Current timestamp
    deviceLockTime();
    // console.log(" $rootScope.DeviceResumeTS", $rootScope.DeviceResumeTS);
  }

  var deviceLockTime = function() {
    var DevicePauseTS = $rootScope.DevicePauseTS;
    var DeviceResumeTS = $rootScope.DeviceResumeTS;
    var totalTS = DeviceResumeTS - DevicePauseTS;
    // console.log("totalTS", totalTS);
    if (totalTS >= 1200000) {
      $rootScope.loading = true;
      $rootScope.stOrdersBackground = false;
      if ($rootScope.isInternet && $rootScope.online) {
        addOrderService.logoutUser().then(function(res) {
          // console.log("Online logout scenarios", res);
          $rootScope.loading = false;
          if (res) {
            loginInfoClear();
          }
        });
      } else {
        // console.log("Ofline logout scenarios");
        loginInfoClear();
      }
    }
    /* If user click on Go offline menu, then idle logout we will switch option */
    if ($rootScope.online == false) {
      $rootScope.online = true;
    }
  }

  Idle.watch();
});

app.filter('compareObjects', function() {
  return function(obj1, obj2) {
    var obj3 = [];
    if (JSON.stringify(obj2) == '{}') {
      return obj1;
    }
    for (i in obj2) {
      for (j in obj2[i]) {
        var test = new Object();
        test[i] = obj2[i][j];
        obj3.push(_.filter(obj1, test));
      }
      var final = [];
      for (k = 0; k < obj3.length; k++) {
        final = final.concat(obj3[k]);
      }
      obj1 = final;
      obj3 = [];
    }
    return final;
  }
})

app.config(function($mdDateLocaleProvider, $ionicConfigProvider) {
  $mdDateLocaleProvider.formatDate = function(date) {
    return moment(date).format('MM-DD-YYYY');
  };
  $ionicConfigProvider.views.transition('none');
  $ionicConfigProvider.scrolling.jsScrolling(false);
})

app.factory("$fileFactory", function($q) {
  var File = function() {};
  File.prototype = {
    getParentDirectory: function(path) {
      var deferred = $q.defer();
      window.resolveLocalFileSystemURL(path, function(fileSystem) {
        fileSystem.getParent(function(result) {
          deferred.resolve(result);
        }, function(error) {
          deferred.reject(error);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    },

    getEntriesAtRoot: function() {
      var deferred = $q.defer();
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
        var directoryReader = fileSystem.root.createReader();
        directoryReader.readEntries(function(entries) {
          deferred.resolve(entries);
        }, function(error) {
          deferred.reject(error);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    },

    getEntries: function(path) {
      var deferred = $q.defer();
      window.resolveLocalFileSystemURL(path, function(fileSystem) {
        var directoryReader = fileSystem.createReader();
        directoryReader.readEntries(function(entries) {
          deferred.resolve(entries);
        }, function(error) {
          deferred.reject(error);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    }

  };

  return File;

})

app.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
})

app.directive('elastic', [
  '$timeout',
  function($timeout) {
    return {
      restrict: 'A',
      link: function($scope, element) {
        $scope.initialHeight = $scope.initialHeight || element[0].style.height;
        var resize = function() {
          element[0].style.height = $scope.initialHeight;
          element[0].style.height = "" + element[0].scrollHeight + "px";
        };
        element.on("input change", resize);
        $timeout(resize, 0);
      }
    };
  }
])

app.directive('myMaxlength', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelCtrl) {
      var maxlength = Number(attrs.myMaxlength);

      function fromUser(text) {
        if (text.length > maxlength) {
          var transformedInput = text.substring(0, maxlength);
          ngModelCtrl.$setViewValue(transformedInput);
          ngModelCtrl.$render();
          return transformedInput;
        }
        return text;
      }
      ngModelCtrl.$parsers.push(fromUser);
    }
  };
});


app.factory('httpResponseErrorInterceptor', function($q, $injector, $localstorage, $rootScope, commonService, appConstants, $fileLogger) {
  return {
    'request': function(config) {
      if (config.method == 'POST') {
        var lastEditedOrder = $localstorage.get('lastEditedOrder');
        config.corderNo = lastEditedOrder;
        config.SysTrxNo = $localstorage.get('lastEditedSysTrxNo');
        if (config.data) {
          if (!config.data.UniqueID) {
            config.data.UniqueID = moment.utc().valueOf();
          }
        }
        $fileLogger.setStorageFilename((config.corderNo || 'log') + '.txt');
        var logParams = ['info', config.corderNo, 'Request', config.url];
        if (config.url.indexOf(appConstants.procedureServices.postShipment) > -1 || config.url.indexOf(appConstants.procedureServices.postDelivery) > -1) {
          logParams.push(config)
        };
        $fileLogger.log.apply(null, logParams);
        /* (MN_UpdateDeliveryDetails) Added SyncMaster - SyncMaster table data is available then added UpdateDeliveryDetails  */
        if (window.cordova) {
          if (config.url.indexOf(appConstants.procedureServices.postDelivery) > -1) {
            if(config.SysTrxNo && config.SysTrxNo!=undefined){
              dbo.selectTable('SyncMaster', "SysTrxNo=?", [config.SysTrxNo], function(result) {
                var data = result.data.rows;
                if (data.length > 0) {
                  var serviceName = config.url;
                  var UniqueID
                  if (config.data) {
                    UniqueID = config.data.UniqueID;
                  }
                  var canceler = $q.defer();
                  config.timeout = canceler.promise;
                  dbo.selectTable('SyncMaster', "SysTrxNo=? AND url=? AND id=?", [config.SysTrxNo, serviceName, UniqueID], function(results) {
                    if (results.data.rows && results.data.rows.length < 1) {
                      dbo.insertTableData('SyncMaster', ['id', 'orderNo', 'SysTrxNo', 'config', 'status', 'url', 'datetime'], [UniqueID, config.corderNo, config.SysTrxNo, JSON.stringify(config), 0, config.url, new Date()], function(tx, res) {});

                      if (true) {
                        // Canceling request
                        canceler.resolve();
                      }

                    }
                  });
                  return config;
                }
              });
            }
          }
        }
        
        /* Check Each Attachment Request, Stored to OrderAttachmentMaster */
        if (window.cordova) {
          let fileName = "attachment_" + config.corderNo;
          var attachmentCheck = ['meterTicket', 'doi', 'deliveryTicket', 'notes', 'attachmentDoc'];
          attachmentCheck.forEach(function(api, index) {
              if (config.url.indexOf(api) > -1) {
                  let invCTS = moment().add(5, 'days').utc();
                  invCTS = invCTS.valueOf();
                  var serviceName = config.url;
                  var UniqueID
                  if (config.data) {
                      UniqueID = config.data.UniqueID;
                  }
                  var deferred = $q.defer(); 
                  dbo.selectTable('OrderAttachmentMaster', "SysTrxNo=? AND url=? AND id=?", [config.SysTrxNo, serviceName, UniqueID], function(results) {
                      if (results.data.rows && results.data.rows.length < 1) {
                        dbo.insertTableData('OrderAttachmentMaster', ['id', 'orderNo', 'SysTrxNo', 'config', 'status', 'url', 'UTC', 'datetime'], [UniqueID, config.corderNo, config.SysTrxNo, JSON.stringify(config), 0, config.url, invCTS, new Date()], function(tx, res) {
                         deferred.resolve(config);
                        });
                      }
                  });
             
                  $fileLogger.setStorageFilename((fileName || 'log') + '.txt');
                  var logParams = ['info', config.corderNo, 'Request', JSON.stringify(config)];
                  $fileLogger.log.apply(null, logParams)

                  return config;
              }
          });
        }       

        if (window.cordova) {
          if (config.url.indexOf(appConstants.nodeURL) > -1 && !config.data.attachmentAdded) {
            //Node Request
            var deferred = $q.defer();
            commonService.saveAttachments(config.data.type, config, function(res) {
              // console.log("saveAttachments", config);
              delete config.data.offlineData;
              deferred.resolve(config)
            });
            return deferred.promise;
          } else {
            return config;
          }
        }

      }

      return config;
    },
    'responseError': function(response) {
      if ($rootScope.syncOrderUpdateArray.length == 0) {
        whereClause = ' url LIKE ' + '"' + '%' + 'MN_UpdateOrders' + '%"',
          dbo.getData('SyncMaster', whereClause, function(results) {
            angular.forEach(results.rows, function(record, key) {
              $rootScope.syncOrderUpdateArray.push(record.orderNo);
            });
          });
      }
      var deferred = $q.defer();
      if (response.config.method === 'POST') {
        var orderNo;
        if (response.config.data && response.config.data.params && response.config.data.params[0] && response.config.data.params[0].orderNo) {
          orderNo = response.config.data.params[0].orderNo;
        } else if (response.config.corderNo) {
          orderNo = response.config.corderNo;
        } else {
          orderNo = config.corderNo;
        }
        var SysTrxNo = response.config.SysTrxNo;
        $fileLogger.setStorageFilename((orderNo || 'log') + '.txt')
        var logParams = ['info', orderNo, 'ResponseError', response.config.url, response.status, response.data];
        $fileLogger.log.apply(null, logParams)

        var apiToCheck = ['MN_UpdateOrders', 'MN_UpdateOrderStatusHistory', 'MN_UpdateShipmentDetails', 'MN_UpdateDeliveryDetails', 'meterTicket', 'doi', 'deliveryTicket', 'notes', 'attachmentDoc', 'MN_UpdateOrderNotesFromApp', 'MN_UpdateINSiteTankVolume', 'MN_CalcShipReading', 'MN_UpdateLogOutDetails', 'MN_CancelOrders', 'MN_CalWeightVolumeQty'];

        //if update orders get order id and check duplicate and update
        //////////////////////////////////////////////////////////////

        // if (response.config && response.config.url && response.config.url.indexOf('MN_UpdateOrders') > -1) {
        //   if ($rootScope.syncOrderUpdateArray.includes(orderNo)) {
        //     dbo.updateTableData('SyncMaster', ['config=?', 'status=?', 'url=?', 'datetime=?'], ['orderNo=?'], [JSON.stringify(response.config), response.status, response.config.url, orderNo], function(tx, res) {
        //       console.info("UPDATED");
        //     });
        //   } else {
        //     $rootScope.syncOrderUpdateArray.push(orderNo);
        //     dbo.insertTableData('SyncMaster', ['orderNo', 'config', 'status', 'url', 'datetime'], [orderNo, JSON.stringify(response.config), response.status, response.config.url, new Date()], function(tx, res) {
        //       console.info("INSERTED");
        //     });
        //   }
        // } else {
        var serviceName = response.config.url;
        var UniqueID
        if (response.config.data) {
          UniqueID = response.config.data.UniqueID;
        }
        if(SysTrxNo && SysTrxNo!=undefined){
          apiToCheck.forEach(function(api, index) {
            if (serviceName.indexOf(api) > -1) {
              dbo.selectTable('SyncMaster', "SysTrxNo=? AND url=? AND id=?", [SysTrxNo, serviceName, UniqueID], function(results) {
                if (results.data.rows && results.data.rows.length < 1) {
                  dbo.insertTableData('SyncMaster', ['id', 'orderNo', 'SysTrxNo', 'config', 'status', 'url', 'datetime'], [UniqueID, orderNo, SysTrxNo, JSON.stringify(response.config), response.status, response.config.url, new Date()], function(tx, res) {});
                }
              });
            }
          });
        }

        // }
        return $q.reject(response);

        //////////////////////////////////////////////////////////////

        // should retry
        //var $http = $injector.get('$http');
        //return $http(response.config);
      }
      // give up
      return $q.reject(response);
    },
    'response': function(response) {
      if (response.config.method === 'POST' && response.config.url.indexOf("GetOrder") === -1) {
        var orderNo = response.config.corderNo;
        $fileLogger.setStorageFilename((orderNo || 'log') + '.txt')
        var logParams = ['info', orderNo, 'Response', response.config.url, response.status, response.data];
        $fileLogger.log.apply(null, logParams)
      };
      return response;
    }
  };
});

app.config(function($httpProvider) {
  $httpProvider.interceptors.push('httpResponseErrorInterceptor');
});

//javascript regex to validate alphanumeric text with spaces and reject special characters
app.directive('maxlength', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModelCtrl) {
      var len = Number(attrs.maxlength);

      function fromUser(text) {
        var transformedInput = text.replace(/[^A-Za-z\d\s]/g, '');
        if (text.length > len) {
          ngModelCtrl.$setViewValue(transformedInput);
          ngModelCtrl.$render();
          return transformedInput;
        } else {
          return transformedInput;
        }
      }
      ngModelCtrl.$parsers.push(fromUser);
    }
  };
});
app.filter('escString', ['$sce', function($sce) {
  return function(text) {
    if (text)
      return text.replace("#39;", "'");
  };
}]);
/* Item Notes description length exceeded*/
app.filter('keepDots', function keepDots() {
  return function(input, scope) {
    if (!input) return;
    if (input.length <= 38)
      return input;
    else
      return input + '...';
  }
});

/* Focus on input,textarea */
app.directive('focusMe', function($timeout) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.focusMe, function(value) {
        if (value === true) {
          $timeout(function() {
            element[0].focus();
            scope[attrs.focusMe] = false;
          }, 10);
        }
      });
    }
  };
});
