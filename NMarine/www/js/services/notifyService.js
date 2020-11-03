app.service('Notify', ['$rootScope', '$compile', '$timeout', function(rootScope, compile, $timeout) {

  this.pop = function(type, message, id, parent) {

    parent = 'body';
    var container = angular.element(document.querySelector(parent));
    var msgBody = angular.element(document.querySelector('.toastr-container'));
    var maxHeight = window.innerHeight - 120;
    rootScope.showToastMsg = true;
    $timeout(function() {
      if (msgBody.length < 1) {
        var msg = compile("<div ng-show='showToastMsg' class='toastr-container' style='top :" + maxHeight + "px'><notify-msg id='" + id + "' type='" + type + "' message='" + message + "'></notify-msg></div>")(rootScope);
        container.append(msg);
      } else {
        //var idMsg = 
        var oldMsg = angular.element(document.querySelector('#' + id));
        if (oldMsg.length > 0) {
          rootScope.$broadcast('dupErrorPop', { 'id': id });
        } else {
          var msg = compile("<notify-msg id='" + id + "' type='" + type + "' message='" + message + "'></notify-msg>")(rootScope);
          msgBody.append(msg);
        }
      }
    });
  }

}]);

app.directive('notifyMsg', function($timeout, $rootScope) {
  return {
    restrict: 'E',
    replace: true,
    template: `
    <div class="toastr-wrapper" >
    <div class="toastr-icon"><i class="ion-alert-circled"></i></div>
    <div class="toastr-text">
    <p>{{message}}</p>
    </div>
    </div>
    `,
    scope: { type: '@', message: '@', id: '@' },
    link: function($scope, elem, attrs) {
      var toastrWrapper = angular.element(elem[0]);
      var iconWrapper = angular.element(elem[0].querySelector('.toastr-icon'));
      var textWrapper = angular.element(elem[0].querySelector('.toastr-text'));
      var boxOffset = (toastrWrapper[0].offsetHeight / 2) + 10;
      var status = true;
      var hideTimeout;
      $scope.pop = function() {
        $rootScope.showToastMsg = true;
        toastrWrapper.css({ display: 'block', top: '-' + boxOffset + 'px', opacity: 1, position: 'relative' });
        hideTimeout = $timeout(function() {
          //console.log('timeout called');
          status = false;
          $rootScope.showToastMsg = false;
          toastrWrapper.css({ opacity: 0, top: '0px' });
          $timeout(function() {
            toastrWrapper.css({ position: 'absolute' });
          }, 1 * 1000);
        }, 4 * 1000);
      }
      //initialzing the error msg
      $scope.init = function() {
        toastrWrapper.css({ display: 'none', top: '-' + boxOffset + 'px', opacity: 0 });
        toastrWrapper.addClass('notify-' + $scope.type);
        $scope.pop();
      }
      $scope.init();


      $rootScope.$on('dupErrorPop', function(event, args) {
        //console.log(args.id, $scope.id);

        if (args.id == $scope.id) {
          if (status) {
            //console.log('canceling the timeout');
            $timeout.cancel(hideTimeout);
            $scope.pop();
          } else {
            //console.log('showing the msg again');
            $scope.pop();
            status = true;

          }
        }
      });

    }
  }
});
