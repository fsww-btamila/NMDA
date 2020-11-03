app.directive('myMap', function() {
  // directive link function
  var link = function(scope, element, attrs) {
    console.log('link');
    var map, infoWindow;
    var markers = [];

    // map config
    var mapOptions = {
      center: new google.maps.LatLng(50, 2),
      zoom: 5,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      scrollwheel: true,
      panControl: true,
      zoomControl: true,
    };
    // init the map
    function initMap() {
      if (!map) {
        //  map = new google.maps.Map(element[0], mapOptions);
      }
    }
    // place a marker
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
        // create new window
        var infoWindowOptions = {
          content: content
        };
        infoWindow = new google.maps.InfoWindow(infoWindowOptions);
        infoWindow.open(map, marker);
        scope.selectDestination('', marker.item)
        scope.$apply();
      });
    }

    // show the map and place some markers
    initMap();

    scope.setMyLocation = function(position) {
      alert("mylocation" + JSON.stringify(position));
    };
    scope.loadInsites = function(inSiteList) {
      angular.forEach(inSiteList, function(item, i) {
        void 0;
        setMarker(map, new google.maps.LatLng(item.Latitude, item.Longitude), item.Code, item.Code, item.MarineLocId, item);
        if (i == 0) {
          map.setCenter(new google.maps.LatLng(item.Latitude, item.Longitude));
        }

      });
    };
    scope.loadInsites(scope.inSiteList);
  };

  return {
    restrict: 'E',
    template: '<div id="gmaps"></div>',
    replace: true,
    link: link
  };
});
