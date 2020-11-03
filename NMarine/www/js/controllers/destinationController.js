app.controller('destinationController', function($scope, $rootScope, $ionicPopover, createOrderService, $cordovaSQLite, addOrderService) {

  $scope.clearDestinationData = function() {
    $scope.destinationData = '';
  }
  $scope.GPSFail = true;
  var zoomLevel = 14;
  $scope.result = '';
  $scope.options = null;
  $scope.details = '';
  var map = null,
    infoWindow;
  var markers = [];
  if ($rootScope.isInternet) {
    var mapOptions = {
      center: new google.maps.LatLng(50, 2),
      zoom: zoomLevel,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      scrollwheel: true,
      panControl: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    };
  }

  $scope.setMyLocation = function(position) {
    if (map) {
      setMyMarker(map, position, "Me");
    }
    geoCoding(position);
  };
  $scope.loadInsites = function(inSiteList) {
    angular.forEach(inSiteList, function(item, i) {
      if (map) {
        setMarker(map, new google.maps.LatLng(item.Latitude, item.Longitude), item.Code, item.Code, item.MarineLocId, item);
        if (i == 0) {
          map.setCenter(new google.maps.LatLng(item.Latitude, item.Longitude));

        }
      }

    });
    if (map)
      map.setCenter($scope.addressPosition)
  };

  $scope.getMyLocation = function() {
    gpsDetect.checkGPS(setGPSFromUI, failGps);

  };

  function setGPSFromUI(on) {
    if (on) {
      $rootScope.loading = true;
      $scope.$apply();
      var posOptions = { timeout: 5000, enableHighAccuracy: false };
      navigator.geolocation.getCurrentPosition(
        function(position) {
          var lat = position.coords.latitude;
          var long = position.coords.longitude;
          $scope.position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          $scope.setMyLocation($scope.position);

        },
        function(err) {
          failGps(err);
        }, posOptions);
    } else {
      $rootScope.showConfirm('GPS', 'Enable GPS!', function(res) {
        if (res)
          gpsDetect.switchToLocationSettings(onSwitchToLocationSettingsSuccess, onSwitchToLocationSettingsError);

      })
    }
  }

  function failGps(err) {
    setTimeout(function() {
      $scope.GPSFail = false;
      $rootScope.loading = false;
      if (!$scope.OrderList.Orders.OrderHdr.Destination.Code) {
        $scope.OrderList.Orders.Ordata = {};
        var result = res.rows.item(i);
        data["MarineLocID"] = result.MarineLocID;
        data["Code"] = result.Code;
        data["Descr"] = result.Descr;
        data["DefLocDescr"] = (result.DefLocDescr == "NULL") ? '' : result.DefLocDescr;
        daerHdr.Destination = {};
        // $rootScope.showAlert("GPS Error", "Unable to get Location please check Device Settings " );
      }
    }, 100)
  }



  $scope.initialize = function() {
    map = new google.maps.Map(document.getElementById("gmaps"), mapOptions);
    setTimeout(function() {
      google.maps.event.trigger(map, 'resize');
      clearOverlays(function() {
        $scope.loadInsites($scope.inSiteList);
        gpsDetect.checkGPS(getUserLoc, onGPSError);
      });

    }, 100);
    if ($scope.position) {
      setMyMarker(map, $scope.position, "Me");
    }
  };
  $scope.disableTap = function() {
    container = document.getElementsByClassName('pac-container');
    // disable ionic data tab
    angular.element(container).attr('data-tap-disabled', 'true');
    // leave input field if google-address-entry is selected
    angular.element(container).on("click", function() {
      document.getElementById('searchBar').blur();
    });
  };
  $ionicPopover.fromTemplateUrl('locationsPopover.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.popOverEventRegister = function(e) {
    void 0;
    $scope.popOverEvent = e;
  };



  $scope.locationChange = function(searchText) {
    if (searchText) {} else {
      return false;
    }
    if (searchText.geometry) {
      var latLong = JSON.stringify(searchText.geometry.location);
      var parsed = JSON.parse(latLong);
      $scope.addressPosition = new google.maps.LatLng(searchText.geometry.location.lat(), searchText.geometry.location.lng());
      var lat = searchText.geometry.location.lat(),
        long = searchText.geometry.location.lng();
      console.log("lat && long", lat, long);
      createOrderService.getAllDestinations(lat, long).then(function(response) {
        var inSiteList = response.data;
        if (inSiteList) {
          $scope.inSiteList = angular.copy(inSiteList);
          $scope.loadInsites(inSiteList);
        }
      });
    } else {
      if (window.cordova) {
        var query = "SELECT * FROM MarineLoc WHERE Descr like '%" + $scope.destinationData + "%' ORDER BY Code";
        console.log("query", query);
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
            $scope.inSiteList = angular.copy(locationArr);
            $scope.loadInsites($scope.inSiteList);
          } else {
            $scope.inSiteList = [];
          }
          console.log("inSiteList", $scope.inSiteList);
        }, function(err) {
          console.log(err);
        });
      }
    }
  };

  $scope.$watch('result', function() {
    $scope.position = null;
    if (map)
      clearOverlays(function() {
        $scope.locationChange($scope.details);
      });
    else {
      $scope.locationChange($scope.details);
    }

  });


  $scope.locationPopOverClose = function(event, item) {
    void 0;
    $scope.inSites = [item];
    $scope.closePopover(event);
  };

  $scope.selectDestination = function(event, item) {
    $scope.OrderList.Orders.OrderHdr.Destination = item;
    $scope.OrderList.Orders.OrderHdr.MarineLocID = item.MarineLocID;
    $scope.OrderList.Orders.OrderHdr.MarineLocDescr = item.Descr;
    $scope.result = item.Code;
    initMap();
    gpsDetect.checkGPS(setUserLoc, onGPSError);
    /*Google api hits on MDA*/
    if (window.cordova) {
      updateGoogleApi();
    }
  };
  $scope.removeDest = function() {
    $scope.OrderList.Orders.OrderHdr.Destination = {};
  };

  $scope.openPopover = function($event) {
    void 0;
    $scope.popover.show($event);
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };

  $scope.$on('$destroy', function() {
    $scope.popover.remove();
  });
  $scope.$on('popover.hidden', function() {
    void 0;
  });
  $scope.$on('popover.removed', function() {
    void 0;
  });

  function setMyMarker(map, position, title) {

    var marker;
    var markerOptions = {
      position: position,
      map: map,
      title: title,
      icon: 'img/myloc.png'
    };

    marker = new google.maps.Marker(markerOptions);
    google.maps.event.addListener(marker, 'click', function() {
      if (infoWindow !== void 0) {
        infoWindow.close();
      }
      var infoWindowOptions = {
        content: content
      };
      infoWindow = new google.maps.InfoWindow(infoWindowOptions);
      infoWindow.open(map, marker);

    });
    map.setZoom(zoomLevel);
    if (title !== "Map INIT") map.panTo(marker.getPosition());

  }

  function setMarker(map, position, title, content, id, data) {
    var marker;
    var markerOptions = {
      position: position,
      map: map,
      title: title,
      icon: 'http://www.google.com/mapfiles/marker.png',
      markerId: id,
      item: data
    };

    marker = new google.maps.Marker(markerOptions);
    markers.push(marker); // add marker to array

    google.maps.event.addListener(marker, 'click', function() {
      if (infoWindow !== void 0) {
        infoWindow.close();
      }
      var infoWindowOptions = {
        content: content
      };
      infoWindow = new google.maps.InfoWindow(infoWindowOptions);
      infoWindow.open(map, marker);
      $scope.selectDestination('', marker.item)
      $scope.$apply();
    });
  }

  function clearOverlays(callback) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    markers = [];
    callback();
  }


  function getUserLoc(on) {
    if (on) {
      var posOptions = { timeout: 5000, enableHighAccuracy: false };
      navigator.geolocation.getCurrentPosition(
        function(position) {
          var lat = position.coords.latitude;
          var long = position.coords.longitude;
          var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          setMyMarker(map, pos, "Map INIT");
        },
        function(err) {
          onGpsErrMessage(err);
        }, posOptions);
    }
  }

  function setUserLoc(on) {
    if (on) {
      var posOptions = { timeout: 5000, enableHighAccuracy: false };
      navigator.geolocation.getCurrentPosition(
        function(position) {
          var lat = position.coords.latitude;
          var long = position.coords.longitude;
          var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          var marker;
          var markerOptions = {
            position: pos,
            map: destMap,
            icon: 'img/myloc.png'
          };
          marker = new google.maps.Marker(markerOptions);
          markers.push(marker);
        },
        function(err) {
          onGpsErrMessage(err);
        }, posOptions);
    }
  }


  function onGPSSuccess(on) {
    if (on) {
      $rootScope.loading = true;
      $scope.$apply();
      var posOptions = { timeout: 5000, enableHighAccuracy: false };
      navigator.geolocation.getCurrentPosition(
        function(position) {
          var lat = position.coords.latitude;
          var long = position.coords.longitude;
          $scope.position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          $scope.setMyLocation($scope.position);

        },
        function(err) {
          onGpsErrMessage(err);
        }, posOptions);
    } else {
      $rootScope.showConfirm('GPS', 'Enable GPS!', function(res) {
        if (res)
          gpsDetect.switchToLocationSettings(onSwitchToLocationSettingsSuccess, onSwitchToLocationSettingsError);

      })
    }

  }

  var onGpsErrMessage = function(err) {
    // setTimeout(function() {
    //   $scope.GPSFail = false;
    //   $rootScope.loading = false;
    //   if (!$scope.OrderList.Orders.OrderHdr.Destination.Code) {
    //     $scope.OrderList.Orders.OrderHdr.Destination = {};
    //     // $rootScope.showAlert("GPS Error", "Unable to get Location please check Device Settings " );
    //   }
    // }, 100)
  }

  function onGPSError(e) {
    alert("GPS Error : " + e);
  }

  function onSwitchToLocationSettingsSuccess() {

  }

  function onSwitchToLocationSettingsError(e) {
    //alert("Error : " + e);
  }

  function geoCoding(position) {
    var geocoder = new google.maps.Geocoder();
    var latlng = position;
    var request = {
      latLng: latlng
    };
    geocoder.geocode(request, function(data, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (data[0] != null) {
          $scope.destinationData = data[0].formatted_address;
          $scope.locationChange(data[0]);
          $rootScope.loading = false;
          $scope.$apply();

        } else {
          $rootScope.showAlert("GPS Error", "Unable to get address!");
          $rootScope.loading = false;
          $scope.$apply();
        }
      }
    })
  }
  var destMap;

  function initMap() {
    var dest = { lat: parseFloat($scope.OrderList.Orders.OrderHdr.Destination.Latitude), lng: parseFloat($scope.OrderList.Orders.OrderHdr.Destination.Longitude) };
    destMap = new google.maps.Map(document.getElementById('map'), {
      zoom: 14,
      center: dest,
      mapTypeControl: false,
      streetViewControl: false,
    });
    var marker = new google.maps.Marker({
      position: dest,
      map: destMap
    });
    /*Google api hits on MDA*/
    if (window.cordova) {
      updateGoogleApi();
    }
    $scope.$apply();
  }

  if ($scope.OrderList.Orders.OrderHdr.Destination && $scope.OrderList.Orders.OrderHdr.Destination.Latitude) {
    setTimeout(function() {
      initMap();
      if (window.cordova) gpsDetect.checkGPS(setUserLoc, onGPSError);
      google.maps.event.trigger(destMap, 'resize');
    }, 1000)

  }

  /* If GPS Fail then automatically open the marine location popup(offline scenarion) */
  $scope.$watch('GPSFail', function(n, v) {
    if (n != v) {
      if (!n) {
        if ($scope.isObjectEmpty($scope.OrderList.Orders.OrderHdr.Destination)) {
          $scope.locationModal();
        }
      }
    }
  });

  $scope.locationModal = function() {
    $scope.loadLocations();
    setTimeout(function() {
      $scope['locationmodal'].show();
    }, 3000);
  }
  /*Google api hits on MDA*/
  var updateGoogleApi = function() {
    addOrderService.updateGoogleApi().then(function(res) {
      console.log(res);
    });
  };

});
