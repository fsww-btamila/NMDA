app.controller('shiftChangeController', function($scope, $rootScope, $ionicModal, $ionicPopover, $localstorage, addOrderService, ordersListService, getAllSiteService, $stateParams, $state, $ionicHistory, $q, $ionicPopup ) {
  $scope.pageTitle = 'Ship Order';
  $scope.numericIn = {};
  $scope.numericIn.quantity = '';
  $scope.finishText = "En Route";
  $scope.appState = "Ship";
  $scope.enableDOI = true;
  $scope.shiftchange = true;
  if ($rootScope.EnableElectronicDOI == 'N') {
    $scope.enableDOI = false;
  }
  $scope.gotoHeader = function() {
    $state.go('addorder', { order: $scope.order.OrderHdr.OrderNo });
  }
  $scope.routeItem = function() {
    $state.go('shiftchange.doi', { itemId: $scope.currentItem.MasterProdID, shiftChange: true, isDoiComplete: true });
  }
  if ($stateParams.order) {
    $scope.order = $stateParams.order;
    $scope.activeAction = $stateParams.order.activeAction;
    $scope.general = $scope.order.OrderHdr;
    // $scope.itemList = _.filter($scope.order.OrderItems, function(item) {
    //     return item[$scope.activeAction].doiMarker;
    // });
    $scope.itemList = $scope.order.OrderItems;
    $scope.enableShipping = true;
    $scope.enableDelivery = true;
    $scope.enableHighlight = true;
    for (var i = 0; i < $scope.itemList.length; i++) {
      if ($scope.itemList[i].IsPackaged == 'N' && $scope.itemList[i].IsBillable == 'N') {
        $scope.currentItem = $scope.itemList[i];
        break;
      }

      /* Special bulk item */
      if($scope.itemList[i].IsBulk == 'Y'){
        $scope.currentItem = $scope.itemList[i];
        break;
      }
    }
    $scope.currentEntry = $scope.currentItem[$scope.activeAction];
    $scope.transferDetails = $scope.order.transferDetails;
    $scope.shiftDetails = $scope.order.shiftDetails;
    $scope.role = $stateParams.role;
    $scope.routeItem();
  }

  $scope.hideNextBtn=false;
  $scope.clickOnce = function() {
    $scope.hideNextBtn=true;
  }

  $scope.processItemDoi = function() {
    $scope.currentItem.isDoiDone = true;
    //  $scope.currentEntry.status = "doi";
    var completed = true;
    var nextIndex;
    angular.forEach($scope.itemList, function(item, idx) {
      if (item.IsPackaged == 'N' && item.IsBillable == 'N') {
        if (item[$scope.activeAction].status == 'reading') {
          //    item[$scope.activeAction].status ='doi';
          if (!item.isDoiDone) {
            nextIndex = idx;
            completed = false;
          }
        }
      }
    })
    if (completed) {
      /* Check each bulk item status(Initial,Inprogress and Finished), based on the scenario we are saved doi are shiftchange process only. */
      let flag = $rootScope.bulkItemStatus($scope.itemList, $scope.activeAction);
      console.log("flag",flag)
      if(flag==1){
        // Check Each bulk item with status green and any Non bulk item (No Status Checked) - DOI automatically saved and without Question
        $scope.saveDoi();
      }
      else if(flag==2){
        // Check Each bulk item with status green and any other bulk item (Inprogress Status Checked) - DOI is not saved and without Question
        $scope.shiftChangeProcess();
      }
      else if(flag==3){
        // Check Each bulk item with status green and any other bulk item (Initial Status Checked) - Just User Confirm DOI Saved or Not(Yes - DOI saved Or No-DOI not saved), Question asked.
          if($scope.role == 'otherRole'){
            $scope.shiftChangeProcess();
          }else{
            $ionicPopup.confirm({
                title: "Alert!",
                template: "Do you wish to finalize the current DOI before processing your shift change?",
                cssClass: 'modal-backdrop reset-item-popup',
                okText: 'Yes',
                cancelText: 'No'
            }).then(function(res) {
              if(res){
                $scope.saveDoi();
              }else{
                $scope.shiftChangeProcess();
              }
            });
          }
      }
    } else {
      $scope.currentItem = $scope.itemList[nextIndex];
      $scope.currentEntry = $scope.currentItem[$scope.activeAction];
      $scope.hideNextBtn=false;
      $scope.routeItem();
    }
  }
  
  $scope.saveDoi = function(){
    if ($scope.enableDOI) {
      /* Check first doi completed or not, after we introduce a Edit Item button on item swipe */
      if($scope.order.OrderHdr.firstDoiComplete === undefined || $scope.order.OrderHdr.firstDoiComplete === false){
        $scope.order.OrderHdr.firstDoiComplete = true;
      }
      var doiData = $('.html2canvasDiv').get(0);
      doiData = encodeURIComponent(doiData.innerHTML);
      $rootScope.postDOIData(doiData, 2);
      setTimeout(function(){
        $scope.shiftChangeProcess();
      },1000);
    }else{
      $scope.shiftChangeProcess();
    }
  }

  $scope.shiftChangeProcess = function(){
    $scope.showDoiDone = true;
    $scope.order.newDoiComplete = true;
    /* Multi Doi flags */
    $scope.order.hideDoiButton = false;
    $scope.order.newDoiActive = false;
    $scope.order.forceDoiComplete = false;
    $scope.newUser = {};
    $scope.processCompleteDoi();
  }

  $scope.processCompleteDoi = function() {
    angular.forEach($scope.itemList, function(item) {
      if (item.IsPackaged == 'N' && item.IsBillable == 'N') {
        item.isDoiDone = false;
        //  item[$scope.activeAction].status ='doi';
      }
    })
    if ($scope.transferDetails.changedShift) {
      $scope.shiftDetails[$scope.activeAction][$scope.transferDetails.changedShift].push($scope.newUser);
      $scope.transferDetails[$scope.transferDetails.changedShift] = $scope.newUser;
    }
    $scope.order.skipDOIStart = false;
    if ($scope.role == 'userRole') {
      $scope.transferDetails.scByLoginUser = true;
      $scope.order.OrderHdr.currentUser = null;
    } else {
      $scope.transferDetails.scByLoginUser = false;
    }
    setTimeout(function() {
      $scope.saveOrder();
    }, 500)

  }
  $scope.setReadingState = function() {
    $scope.readingState = 'initial';
  }
  $scope.saveOrder = function() {
    $rootScope.loading = true;
    $scope.orderDT = moment.utc(); // Current Date & time
    $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
    $scope.order.cTs = $scope.orderTs;
    var orderTemp = { "Orders": $scope.order };
    dbo.selectTable('OrdersMaster', "SysTrxNo=?", [$scope.order.OrderHdr.SysTrxNo], $scope.getCount);
  };
  $scope.updateSuccess = function(results) {
    var o = { Orders: $scope.order }
    addOrderService.saveOrder(o, $scope.order.OrderHdr.OrderNo).then(function(response) {});
    if ($scope.role == 'userRole') {
      var idx = $scope.shiftChangeOrders.indexOf($scope.order);
      $scope.shiftChangeOrders.splice(idx, 1);
      if ($scope.shiftChangeOrders.length > 0) {
        $state.go('shiftchangeorders');
      } else {
        //$rootScope.showToastMessage("Shift Change Done");
        // $rootScope.doLogout();
        $rootScope.autoLogOff($scope.order);
      }
    } else {
      // $rootScope.showToastMessage("Shift Change Done");
      // $state.go('orders');
      $state.go('shiporder', { order: $scope.order.OrderHdr.OrderNo, item: $scope.currentItem, 'systrxno': $scope.order.OrderHdr.SysTrxNo })
    }

  }

  $scope.getCount = function(results) {
    if (!results.success) {
      return false;
    }
    var orderTemp = { "Orders": $scope.order };
    $scope.order.OrderHdrData = $rootScope.formOrderHeaderJson(orderTemp.Orders.OrderHdr);
    var len = results.data.rows.length;
    if (len > 0) {

      dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [$scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), $scope.order.OrderHdr.SysTrxNo], $scope.updateSuccess);
    } else {
      dbo.insertTableData('OrdersMaster', ['orderNo', 'SysTrxNo', 'status', 'orderData', 'orderHdrData', 'dateTime'], [$scope.order.OrderHdr.OrderNo, $scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), new Date()], $scope.insertSuccess);
    }

  };
  $scope.initiateFinalDoi = function() {
    $scope.activeView = 'doi';
    $scope.order.overallStatus = 'completedDoi';
    $state.go('shiporder.doi', { isDoiComplete: true })
  }

  $scope.navBack = function() {
    $state.go('shiftchangeorders');
  }

});
