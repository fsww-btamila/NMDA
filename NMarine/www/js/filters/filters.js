//filter Multiple...
app.filter('filterMultiple', ['$filter', function($filter) {
  return function(items, keyObj) {
    if (items) {
      var filterObj = {
        data: items,
        filteredData: [],
        applyFilter: function(obj, key) {
          var fData = [];
          if (this.filteredData.length == 0)
            this.filteredData = this.data;
          if (obj) {
            var fObj = {};
            if (angular.isString(obj)) {
              fObj[key] = obj;
              fData = fData.concat($filter('filter')(this.filteredData, fObj));
            } else if (angular.isArray(obj)) {
              if (obj.length > 0) {
                for (var i = 0; i < obj.length; i++) {
                  if (angular.isString(obj[i])) {
                    fObj[key] = obj[i];
                    fData = fData.concat($filter('filter')(this.filteredData, fObj));
                  }
                }
              }
            }
            if (fData.length > 0) {
              this.filteredData = fData;
            }
          }
        }
      };

      if (keyObj) {
        angular.forEach(keyObj, function(obj, key) {
          filterObj.applyFilter(obj, key);
        });
      }
      return filterObj.filteredData;
    }
  }
}]);

function parseDate(input) {
  var parts = input.split('-');
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

app.filter("myfilter", function() {
  return function(items, from, to) {
    void 0;
    if (from && to) {
      var df = from;
      var dt = to;
      var result = [];
      for (var i = 0; i < items.length; i++) {
        var tf = new Date(items[i].Orders.OrderHdr.OrderDtTm * 1000),
          tt = new Date(items[i].Orders.OrderHdr.OrderDtTm * 1000);
        if (tf > df && tt < dt) {
          result.push(items[i]);
        }
      }
      return result;
    } else {
      return items;
    }

  };
});

app.filter('isEmpty', [function() {
  return function(object) {
    return angular.equals({}, object);
  }
}])

app.filter('tel', function() {
  return function(tel) {
    if (!tel) {
      return '';
    }
    var value = tel.toString().trim().replace(/^\+/, '');
    if (value.match(/[^0-9]/)) {
      return tel;
    }
    var country, city, number;
    switch (value.length) {
      case 10: // +1PPP####### -> C (PPP) ###-####
        country = 1;
        city = value.slice(0, 3);
        number = value.slice(3);
        break;
      case 11: // +CPPP####### -> CCC (PP) ###-####
        country = value[0];
        city = value.slice(1, 4);
        number = value.slice(4);
        break;
      case 12: // +CCCPP####### -> CCC (PP) ###-####
        country = value.slice(0, 3);
        city = value.slice(3, 5);
        number = value.slice(5);
        break;
      default:
        return tel;
    }
    if (country == 1) {
      country = "";
    }
    number = number.slice(0, 3) + '-' + number.slice(3);
    return (country + " (" + city + ") " + number).trim();
  };
})

app.filter("weightVol", function() {
  return function(origQty, item, activeAction) {
    if (activeAction === 'Deliver') {
      if (item.weightQty) {
        return item.weightQty;
      } else {
        return origQty;
      }
    } else {
      return origQty;
    }
  };
});

app.filter('eToMiddle', function() {
  return function(readingSide, compartment) {
    if (readingSide == 'E') {
      return 'M';
    } else {
      return readingSide;
    }
  }
});

app.filter('unescape', function() {
  var entityMap = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x2F;": "/",
    "&#36;": "$",
    "&#42;": '*',
    "&#63;": '?',
    "&#92;": '\\',
    "amp;": "&",
    "lt;": "<",
    "gt;": ">",
    "quot;": '"',
    "#39;": "'",
    "#x2F;": "/",
    "#36;": "$",
    "#42;": "*",
    "#92;": "\\",
    "#63;": "?"
  };

  return function(str) {
    if (str) {
      let parsedStr = str;
      angular.forEach(entityMap, function(val, key) {
        var rx = new RegExp(key, "g");
        parsedStr = parsedStr.replace(rx, val);
      });
      return parsedStr;
    } else {
      if (str == undefined) str = "";
      return str;
    }

  }
});

app.filter('escape', function() {

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;',
    "$": "&#36;",
    "*": "&#42;",
    "\\": "&#92;",
    "?": "&#63;"

  };
  var revEntityMap = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x2F;": "/",
    "&#36;": "$",
    "&#42;": '*',
    "&#63;": '?',
    "&#92;": '\\',
    "amp;": "&",
    "lt;": "<",
    "gt;": ">",
    "quot;": '"',
    "#39;": "'",
    "#x2F;": "/",
    "#36;": "$",
    "#42;": "*",
    "#92;": "\\",
    "#63;": "?"
  };

  return function(str) {
    if (str) {
      let parsedStr = str;
      angular.forEach(revEntityMap, function(val, key) {
        var rx = new RegExp(key, "g");
        parsedStr = parsedStr.replace(rx, val);
      });
      parsedStr = parsedStr.replace('\\', '&#92;')
      return String(parsedStr).replace(/[&<>"'\/\\]/g, function(s) {
        return entityMap[s];
      });
    } else {
      if (str == undefined) str = "";
      return str;
    }
  }

});
