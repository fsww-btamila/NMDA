app.directive('focus', function() {
  return {
    restrict: 'A',
    link: function($scope, elem, attrs) {

      elem.bind('keydown', function(e) {
        var code = e.keyCode || e.which;
        if (code === 13 || code === 9) {
          var nextinput = '';
          if (attrs.transfer) {
            setTimeout(function() {
              elem.next().value = '';
              elem.next().focus();
            }, 0);

          } else {
            elem.parent('md-input-container').parent('div').next().find('input')[0].focus();
          }
          e.preventDefault();
        }
      });
    }
  }
});

app.directive('closekeyboard', function() {
  return {
    restrict: 'A',
    link: function($scope, elem, attrs) {

      elem.bind('keydown', function(e) {
        var code = e.keyCode || e.which;
        if (code === 13 || code === 9) {
          elem.blur();
          e.preventDefault();
        }
      });
    }
  }
});

function findNextTabStop(el) {
  var universe = document.querySelectorAll('input, button, select, textarea, a[href]');
  var list = Array.prototype.filter.call(universe, function(item) {
    return item.tabIndex >= "0"
  });
  var index = list.indexOf(el);
  return list[index + 1] || list[0];
}
