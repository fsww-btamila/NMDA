app.controller('doiController', function($scope, $ionicModal, $rootScope, $location, addOrderService, $stateParams, $ionicScrollDelegate, $state, appConstants, $http, Notify, $timeout, $localstorage) {

  dbo.createTable('DoiMaster', ['id INTEGER PRIMARY KEY', 'orderNo', 'SysTrxNo UNIQUE', 'shipId', 'itemId', 'doiData', 'timeStamp', 'dateTime']);
  $scope.currentDateTime = new Date($rootScope.getCurrentDateTime());
  $scope.states = { activeItem: 1 };
  $scope.today = new Date();
  $scope.signPad = { "disableSignPad": false };
  $scope.reasonModal = false;
  $scope.naReason = {};
  $scope.naReasons = {};
  $scope.isDvry;
  $scope.doiIncomplete = true;
  $scope.doiDataComplete = { 'Shipping': { "deliverySignature": [], "receiverSignature": [], "deliveryIsSignature": [], "receiverIsSignature": [], 'delTitle': [], 'recTitle': [] }, 'Delivering': { "deliverySignature": [], "receiverSignature": [], "deliveryIsSignature": [], "receiverIsSignature": [], 'delTitle': [], 'recTitle': [] } }
  var shipId = '';
  if ($scope.order.activeAction == 'Ship') {
    shipId = $scope.order.OrderHdr.VehicleID;
    $scope.currentdoiVessels = $scope.order.shippingVessels;
  } else if ($scope.order.activeAction == 'Deliver') {
    if ($scope.order.OrderHdr.InternalTransferOrder == "N") {
      if ($scope.currentEntry.vessel) {
        shipId = $scope.currentEntry.vessel.VesselID;
      } else {
        shipId = $scope.order.OrderHdr.VehicleID;
        $scope.currentdoiVessels = $scope.order.shippingVessels;
      }

    } else {
      shipId = $scope.order.OrderHdr.VehicleID;
    }
    $scope.currentdoiVessels = $scope.order.deliveryVessels;
  }
  if ($scope.currentdoiVessels.indexOf(shipId) == -1) {
    $scope.currentdoiVessels.push(shipId);
    $scope.currentEntry.doiMarker = true;
  }
  $scope.currentItem.doiVessel = shipId;
  var shipId = $scope.currentItem.doiVessel;
  if ($stateParams.isDoiComplete) {
    $scope.currentEntry.transferEndDate = $rootScope.getCurrentDateTime();
    $scope.isDoiComplete = $stateParams.isDoiComplete;
    setTimeout(function() {
      $ionicScrollDelegate.$getByHandle('doiContent').scrollBottom();
      $scope.$apply();
    }, 1000)

  } else {
    if (!$scope.order.shiftDetails[$scope.activeAction].transferStartDate) {
      $scope.order.shiftDetails[$scope.activeAction].transferStartDate = $rootScope.getCurrentDateTime();
    }
  }

  if ($stateParams.shiftChange) {
    $scope.shiftChange = $stateParams.shiftChange;
  }

  $scope.isEmpty = function(obj) {
    for (var i in obj)
      if (obj.hasOwnProperty(i)) return false;
    return true;
  };


  $rootScope.showResultsDoi = function(result) {
    if (result.success) {
      var res = result.data;
      var len = res.rows.length,
        i;

      if (len > 0) {
        var doiDataSet = [];
        var item = res.rows.item(len - 1);

        doiDataSet = item;
        var resultSet = angular.copy(JSON.parse(doiDataSet.doiData));
        $scope.doiData = resultSet.doiData;
        $scope.doiDataComplete = resultSet.doiDataComplete;
        formDoiJson($scope.doiData, function() {
          if ($scope.order.activeAction == "Ship") {
            $scope.doiDataCompleteTemp = $scope.doiDataComplete.Shipping;
            $scope.doiCompleteList = $scope.doiData[0].DoiSignData.ShippingDoiData;
            $scope.recLength = $scope.doiCompleteList.receiverSignature.length;
            $scope.delLength = $scope.doiCompleteList.deliverySignature.length;

          }
          if ($scope.order.activeAction == "Deliver") {
            $scope.doiDataCompleteTemp = $scope.doiDataComplete.Delivering;
            $scope.doiCompleteList = $scope.doiData[0].DoiSignData.DeliveringDoiData;
            $scope.recLength = $scope.doiCompleteList.receiverSignature.length;
            $scope.delLength = $scope.doiCompleteList.deliverySignature.length;

          }
        });

      } else {
        var i = 1;
        $scope.doiData = angular.copy(appConstants.doiData);
        formDoiJson($scope.doiData, function() {
          if ($scope.order.activeAction == "Ship") {
            $scope.doiDataCompleteTemp = $scope.doiDataComplete.Shipping;
            $scope.doiCompleteList = $scope.doiData[0].DoiSignData.ShippingDoiData;
            $scope.recLength = $scope.doiCompleteList.receiverSignature.length;
            $scope.delLength = $scope.doiCompleteList.deliverySignature.length;
          }
          if ($scope.order.activeAction == "Deliver") {
            $scope.doiDataCompleteTemp = $scope.doiDataComplete.Delivering;
            $scope.doiCompleteList = $scope.doiData[0].DoiSignData.DeliveringDoiData;
            $scope.recLength = $scope.doiCompleteList.receiverSignature.length;
            $scope.delLength = $scope.doiCompleteList.deliverySignature.length;
          }
        });
      }
      $scope.checkDoiSignatures();
      $scope.checkDoiDataSignatures();
      $scope.$digest();
    }
  };
  var res = dbo.selectTable('DoiMaster', "SysTrxNo=?", [$scope.order.OrderHdr.SysTrxNo], $rootScope.showResultsDoi);
  $ionicModal.fromTemplateUrl('modal.html', function($ionicModal) {}, {
    scope: $scope,
    animation: 'none',
    backdropClickToClose: false
  }).then(function(modal) {
    $scope.modal = modal;
  });

  var innerIndex = '';
  var currElem;
  $scope.doiRecordClick = function(item, sectionIndex, index, activeSignature, e) {
    currElem = null;
    if (e.target.tagName == 'TD' || e.target.tagName == 'DIV')
      currElem = angular.element(e.target.children[0]);
    else if (e.target.tagName == 'IMG') {

      currElem = angular.element(e.target);
    }

    $scope.index = sectionIndex;
    innerIndex = index;
    $scope.innerIndex = index;

    $scope.signPadId = sectionIndex + "" + index;
    $scope.isDoiQus = true;

    var currImg;
    if ($scope.order.activeAction == 'Deliver') {
      if (activeSignature === 'D')
        currImg = $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliverySignature[innerIndex];
      else
        currImg = $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverSignature[innerIndex];
    }
    if ($scope.order.activeAction == 'Ship') {
      if (activeSignature === 'D')
        currImg = $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliverySignature[innerIndex];
      else
        currImg = $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverSignature[innerIndex];
    }

    // if($scope.isDoiComplete && !(currImg == undefined || currImg == '' || currImg == null || currImg == " " || isEmptyObject(currImg))){
    //     return;
    // }

    $scope.openModal(item, activeSignature);
  };

  $scope.doiInchargeClick = function(actionCode, index, activeSignature) {
    $scope.states.activeItem = actionCode;
    $scope.doiCompleteIndex = index;
    $scope.isDoiQus = false;
    $scope.openModal('', activeSignature);
  };
  $scope.prev = function() {
    $scope.saveCanvas(function() {

      if ($scope.index > 0) {
        $scope.index--;

      }

      $scope.signPadId = $scope.index + "" + $scope.innerIndex;


      $scope.question = $scope.doiData[$scope.index];

      if ($scope.order.activeAction == 'Ship') {
        loadCanvasModal($scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliverySignature[innerIndex], $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverSignature[innerIndex], 1);
        $scope.disableSignPad = { "Receiving": $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableRecSignPad, "Delivering": $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableDelSignPad };
      }
      if ($scope.order.activeAction == 'Deliver') {
        loadCanvasModal($scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliverySignature[innerIndex], $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverSignature[innerIndex], 1);
        $scope.disableSignPad = { "Receiving": $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableRecSignPad, "Delivering": $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableDelSignPad };
      }

    });
    $scope.emptyReason();

  };

  $scope.next = function() {
    $scope.saveCanvas(function() {
      if ($scope.index < $scope.doiData.length - 1) {
        $scope.index++;
      }
      $scope.signPadId = $scope.index + "" + $scope.innerIndex;

      $scope.question = $scope.doiData[$scope.index];

      if ($scope.order.activeAction == 'Ship') {
        loadCanvasModal($scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliverySignature[innerIndex], $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverSignature[innerIndex], 2);
        $scope.disableSignPad = { "Receiving": $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableRecSignPad, "Delivering": $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableDelSignPad };
      }
      if ($scope.order.activeAction == 'Deliver') {
        loadCanvasModal($scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliverySignature[innerIndex], $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverSignature[innerIndex], 2);
        $scope.disableSignPad = { "Receiving": $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableRecSignPad, "Delivering": $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableDelSignPad };
      }
    });
    $scope.emptyReason();

  };
  var signaturePad, signaturePad1;
  $scope.openModal = function(item, activeSignature) {
    $scope.modal.show().then(function() {
      var wrapper = document.getElementById("signature-pad"),
        clearButton = wrapper.querySelector("[data-action=clear]"),
        saveButton = wrapper.querySelector("[data-action=save]"),
        canvas = wrapper.querySelector("canvas"),
        signaturePad;

      var wrapper1 = document.getElementById("signature-pad1"),
        clearButton1 = wrapper1.querySelector("[data-action=clear]"),
        saveButton1 = wrapper1.querySelector("[data-action=save]"),
        canvas1 = wrapper1.querySelector("canvas"),
        signaturePad1;



      var blank = document.getElementById("blank-signature-pad"),
        blankCanvas = blank.querySelector("canvas"),
        blankPad;

      if (!signaturePad) {

        signaturePad = new SignaturePad(canvas, {
          minWidth: 1,
          maxWidth: 1.5
        });
      }

      if (!signaturePad1) {
        signaturePad1 = new SignaturePad(canvas1, {
          minWidth: 1,
          maxWidth: 1.5
        });
      }

      if (!blankPad) {
        blankPad = new SignaturePad(blankCanvas, {
          minWidth: 1,
          maxWidth: 1.5
        });
      }

      $scope.isBlank = function(canvas) {
        return canvas.toDataURL() == document.getElementById('blank').toDataURL();
        // var blank = document.createElement('canvas');
        // blank.width = canvas.width;
        // blank.height = canvas.height;
        // return canvas.toDataURL() == blank.toDataURL();
      };


      if (item == '') {
        if ($scope.doiDataComplete) {
          loadCanvasModal($scope.doiDataCompleteTemp.deliverySignature[$scope.doiCompleteIndex], $scope.doiDataCompleteTemp.receiverSignature[$scope.doiCompleteIndex], 0);

        }

      } else {
        $scope.question = item;
        if ($scope.order.activeAction == 'Ship') {
          loadCanvasModal($scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliverySignature[innerIndex], $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverSignature[innerIndex], 0);
          $scope.disableSignPad = {
            "Receiving": $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableRecSignPad,
            "Delivering": $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableDelSignPad
          };

        }
        if ($scope.order.activeAction == 'Deliver') {
          loadCanvasModal($scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliverySignature[innerIndex], $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverSignature[innerIndex], 0);
          $scope.disableSignPad = { "Receiving": $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableRecSignPad, "Delivering": $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableDelSignPad };
        }
      }

      $scope.clearCanvas1 = function(isDvrySign, index) {
        $scope.removeNaReason($scope.index, isDvrySign);
        if (index == $scope.declineQuestion) {
          $scope.declineDoi = false;
          $scope.currentEntry.hideBack = false;
        }
        $scope.naEdited = false;
        //$scope.signPad.disableSignPad = false;
        signaturePad.clear();
      };

      $scope.clearCanvas2 = function(isDvrySign, index) {
        $scope.removeNaReason($scope.index, isDvrySign);
        if (index == $scope.declineQuestion) {
          $scope.declineDoi = false;
          $scope.currentEntry.hideBack = false;
        }
        $scope.naEdited = false;
        //$scope.signPad.disableSignPad = false;
        signaturePad1.clear();
      };

      $scope.clearOnlyCanvas = function(isDvrySign) {
        if (isDvrySign)
          signaturePad.clear();
        else
          signaturePad1.clear();
      };
      $scope.saveCanvas = function(callback) {
        var sign1 = '';
        var sign2 = '';
        if (!$scope.isBlank(signaturePad)) {
          sign1 = signaturePad.toDataURL();
          // signaturePad.clear();
        }
        if (!$scope.isBlank(signaturePad1)) {
          sign2 = signaturePad1.toDataURL();
          // signaturePad1.clear();
        }
        $scope.naEdited = false;
        loadCanvas(sign1, sign2, activeSignature, callback);
      };

      $scope.decline = function(isDvrySign, declinerName, declineQuestion) {
        // currElem.addClass('mask-release');
        // var qstr = "img#myCanvas";
        // isDvrySign ? qstr + 'Deliver_'
        var thisElem = document.querySelector('img#myCanvas')
        //removeNaReason($scope.index, isDvrySign);
        $scope.signPad.disableSignPad = true;
        var canvas = '';
        $scope.declineDoi = true;
        $scope.declinerName = declinerName;
        $scope.declineQuestion = declineQuestion;
        $scope.currentEntry.hideBack = true;
        //$scope.naEdited = false;
        $scope.modal.hide();
        // $scope.emptyReason();
        // if (isDvrySign) {
        //     signaturePad.clear();
        //     canvas = document.getElementById("signPad1");

        // } else {
        //     signaturePad1.clear();
        //     canvas = document.getElementById("signPad2");
        // }
        // var ctx = canvas.getContext("2d");
        // ctx.font = "140px Arial";
        // ctx.fillStyle = "#FF704D";
        // ctx.textAlign = 'center';
        // ctx.textBaseline = "middle";
        // var image = 'Decline';
        // ctx.fillText(image, canvas.width / 2, canvas.height / 2);
      };
    });

    $scope.clearDecline = function() {
      $scope.declineDoi = false;
    }

    $scope.closeModal = function() {
      if ($scope.isDoiQus) {
        $scope.saveCanvas(function() {

        });
      } else {
        $scope.saveCanvas(function() {

        });
      }
      var doiData = { "doiData": $scope.doiData, "doiDataComplete": $scope.doiDataComplete };
      $scope.insertSuccess = function() {

      };
      var currentTS = (moment.utc()).valueOf();
      dbo.deleteTableData('DoiMaster', "SysTrxNo=?", [$scope.order.OrderHdr.SysTrxNo]);
      dbo.insertTableData('DoiMaster', ['orderNo', 'SysTrxNo', 'shipId', 'itemId', 'doiData', 'timeStamp', 'dateTime'], [$scope.order.OrderHdr.OrderNo, $scope.order.OrderHdr.SysTrxNo, shipId, $scope.currentItem.MasterProdID, JSON.stringify(doiData), currentTS, new Date()], $scope.insertSuccess);
      $scope.modal.hide();
      $scope.emptyReason();
    };


  };

  $scope.saveDoiData = function() {
    $scope.startReading();
  }


  $ionicModal.fromTemplateUrl('naReasonModal.html', {
    scope: $scope,
    animation: 'none',
  }).then(function(modal) {
    $scope.naReasonModal = modal;
  });
  $ionicModal.fromTemplateUrl('naReasonShowModal.html', {
    scope: $scope,
    animation: 'none',
  }).then(function(modal) {
    $scope.naReasonShowModal = modal;
  });

  $scope.removeNaReason = function(id, isDvry) {
    if (id != null || id != undefined) {
      if ($scope.order.activeAction.toLowerCase() == 'ship') {
        if (isDvry) {
          if ($scope.doiData[id].DoiSignData.ShippingDoiData.deliveryNaReason)
            delete $scope.doiData[id].DoiSignData.ShippingDoiData.deliveryNaReason[innerIndex];
        } else {
          if ($scope.doiData[id].DoiSignData.ShippingDoiData.receiverNaReason)
            delete $scope.doiData[id].DoiSignData.ShippingDoiData.receiverNaReason[innerIndex];
        }
      } else {
        if (isDvry) {
          if ($scope.doiData[id].DoiSignData.DeliveringDoiData.deliveryNaReason)
            delete $scope.doiData[id].DoiSignData.DeliveringDoiData.deliveryNaReason[innerIndex];
        } else {
          if ($scope.doiData[id].DoiSignData.DeliveringDoiData.receiverNaReason)
            delete $scope.doiData[id].DoiSignData.DeliveringDoiData.receiverNaReason[innerIndex];
        }
      }
    }
    $scope.emptyReason();
  }
  $scope.showReason = function(id, action) {
    $scope.selectedNaReason = {};
    if (action.toLowerCase() == 'ship') {
      $scope.selectedNaReason.delivery = $scope.doiData[id].DoiSignData.ShippingDoiData.deliveryNaReason;
      $scope.selectedNaReason.receiving = $scope.doiData[id].DoiSignData.ShippingDoiData.receiverNaReason;
    } else {
      $scope.selectedNaReason.delivery = $scope.doiData[id].DoiSignData.DeliveringDoiData.deliveryNaReason;
      $scope.selectedNaReason.receiving = $scope.doiData[id].DoiSignData.DeliveringDoiData.receiverNaReason;
    }
    $scope.selectedNaReason.question = $scope.doiData[id].DOIText;
    $scope.naReasonShowModal.show();
  }

  $scope.currNaReason;
  $scope.checkNa = function(isDvry, id, action) {

    if (!$scope.naReason.txt || $scope.naReason.txt.length < 1) {
      $scope.isDvry = isDvry;
      var doiData = (action && action.toLowerCase() == 'ship') ? $scope.doiData[id].DoiSignData.ShippingDoiData : $scope.doiData[id].DoiSignData.DeliveringDoiData;

      if (isDvry)
        $scope.naReason.txt = doiData.deliveryNaReason ? doiData.deliveryNaReason[innerIndex] : '';
      else
        $scope.naReason.txt = doiData.receiverNaReason ? doiData.receiverNaReason[innerIndex] : '';

    }

    $scope.loadNaReason();
    $scope.naReasonModal.show();

  }
  $scope.loadNaReason = function() {
    var target = angular.element(document.querySelector('#reason'));
    if (target[0])
      target[0].value = ($scope.naReason.txt != undefined) ? $scope.naReason.txt : '';
  }
  $scope.getReasonFlag = function(id, action) {
    var doiData = (action && action.toLowerCase() == 'ship') ? $scope.doiData[id].DoiSignData.ShippingDoiData : $scope.doiData[id].DoiSignData.DeliveringDoiData;
    if (isEmptyObject(doiData.deliveryNaReason) && isEmptyObject(doiData.receiverNaReason))
      return false;
    else
      return true;
  }

  function isEmptyObject(obj) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop) && obj[prop] != null)
        return false
    }
    return true;
  }
  $scope.emptyReason = function() {
    $scope.naReason = {};
    setEmpty('#reason');
  }

  function setEmpty(selector) {
    var target = angular.element(document.querySelector(selector));
    if (target[0] != undefined)
      target[0].value = '';
  }
  $scope.naEdited = false;
  $scope.setNa = function(isDvrySign, naReason) {

    if ((naReason != undefined && naReason.length < 1) || naReason == undefined) {
      Notify.pop('error', 'Please enter a reason', 'e105');
      $scope.reasonModal = true;
      return false;
    } else {
      $scope.clearOnlyCanvas(isDvrySign);

      $scope.naReason.txt = naReason;
      //setEmpty('#reason');
      $scope.naEdited = true;
      $scope.naReasonModal.hide();
    }

    if (isDvrySign)
      $scope.disableSignPad.Delivering = true;
    else
      $scope.disableSignPad.Receiving = true;

    $scope.signPad.disableSignPad = true;
    var canvas = '';
    if (isDvrySign) {
      //$scope.clearCanvas1();
      canvas = document.getElementById("signPad1");
    } else {
      // $scope.clearCanvas2();
      canvas = document.getElementById("signPad2");
    }
    var ctx = canvas.getContext("2d");
    ctx.font = "140px Arial";
    ctx.textAlign = 'center';
    ctx.fillStyle = "#607D8B";
    ctx.textBaseline = "middle";
    var image = 'NA';
    ctx.fillText(image, canvas.width / 2, canvas.height / 2);
  };


  function loadCanvasModal(dataURL, dataURL1, doiFlag) {

    var canvas = document.getElementById('signPad1');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var imageObj = new Image();
    imageObj.onload = function() {
      context.drawImage(this, 0, 0);
    };
    imageObj.src = dataURL;

    var canvas1 = document.getElementById('signPad2');
    var context1 = canvas1.getContext('2d');
    context1.clearRect(0, 0, canvas1.width, canvas1.height);
    var imageObj1 = new Image();
    imageObj1.onload = function() {
      context1.drawImage(this, 0, 0);
    };
    imageObj1.src = dataURL1;

  }

  function loadCanvas(dataURL, dataURL1, activeSignature, callback) {
    var deliverSign = '',
      receiverSign = '';
    if ($scope.isDoiQus) {
      if (dataURL) {

        deliverSign = document.getElementById('myCanvasDeliver_' + $scope.signPadId);

        if (deliverSign) {
          deliverSign.src = '';
          deliverSign.src = dataURL;
        }
      }
      if (dataURL1) {
        receiverSign = document.getElementById('myCanvasReceiver_' + $scope.signPadId);
        if (receiverSign) {
          receiverSign.src = '';
          receiverSign.src = dataURL1;
        }
      }
    } else {
      deliverSign = document.getElementById('myCanvasDeliver' + $scope.doiCompleteIndex);
      receiverSign = document.getElementById('myCanvasReceiver' + $scope.doiCompleteIndex);
      if (dataURL && deliverSign) {

        deliverSign.src = '';
        deliverSign.src = dataURL;
      }
      if (dataURL1 && receiverSign) {

        receiverSign.src = '';
        receiverSign.src = dataURL1;
      }
    }

    if ($scope.isDoiQus) {
      if ($scope.order.activeAction == "Deliver") {
        if (activeSignature === 'D') {
          if (dataURL) {
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliveryIsSignature[innerIndex] = true;
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliverySignature[innerIndex] = dataURL;
            if ($scope.naReason.txt && $scope.naReason.txt.length > 0) {
              $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliveryNaReason = [];
              $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliveryNaReason[innerIndex] = $scope.naReason.txt;
            }
            if (!$scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableDelSignPad)
              $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableDelSignPad = $scope.signPad.disableSignPad;
          } else {
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliverySignature[innerIndex] = '';
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.deliveryIsSignature[innerIndex] = false;
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableDelSignPad = false;
          }
        }
        if (activeSignature === 'R') {
          if (dataURL1) {
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverIsSignature[innerIndex] = true;
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverSignature[innerIndex] = dataURL1;
            if ($scope.naReason.txt && $scope.naReason.txt.length > 0) {
              $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverNaReason = [];
              $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverNaReason[innerIndex] = $scope.naReason.txt;
            }
            if (!$scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableRecSignPad)
              $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableRecSignPad = $scope.signPad.disableSignPad;
          } else {
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverIsSignature[innerIndex] = false;
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.receiverSignature[innerIndex] = '';
            $scope.doiData[$scope.index].DoiSignData.DeliveringDoiData.disableRecSignPad = false;
          }
        }
        $scope.checkDoiSignatures();
      }
      if ($scope.order.activeAction == "Ship") {
        if (activeSignature === 'D') {
          if (dataURL) {
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliveryIsSignature[innerIndex] = true;
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliverySignature[innerIndex] = dataURL;
            if ($scope.naReason.txt && $scope.naReason.txt.length > 0) {
              if (!$scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliveryNaReason)
                $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliveryNaReason = [];
              $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliveryNaReason[innerIndex] = $scope.naReason.txt;
            }
            if (!$scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableDelSignPad)
              $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableDelSignPad = $scope.signPad.disableSignPad;
          } else {
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliveryIsSignature[innerIndex] = false;
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.deliverySignature[innerIndex] = '';
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableDelSignPad = false;
          }
        }

        if (activeSignature === 'R') {
          if (dataURL1) {
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverIsSignature[innerIndex] = true;
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverSignature[innerIndex] = dataURL1;
            if (!$scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableRecSignPad)
              $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableRecSignPad = $scope.signPad.disableSignPad;
            if ($scope.naReason.txt && $scope.naReason.txt.length > 0) {
              $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverNaReason = [];
              $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverNaReason[innerIndex] = $scope.naReason.txt;
            }
          } else {
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverIsSignature[innerIndex] = false;
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.receiverSignature[innerIndex] = '';
            $scope.doiData[$scope.index].DoiSignData.ShippingDoiData.disableRecSignPad = false;
          }
        }
        $scope.checkDoiSignatures();
      }



    } else {
      if (activeSignature === 'D') {
        if (dataURL) {
          $scope.doiDataCompleteTemp.deliveryIsSignature[$scope.doiCompleteIndex] = true;
          $scope.doiDataCompleteTemp.deliverySignature[$scope.doiCompleteIndex] = dataURL;
        } else {
          $scope.doiDataCompleteTemp.deliveryIsSignature[$scope.doiCompleteIndex] = false;
          $scope.doiDataCompleteTemp.deliverySignature[$scope.doiCompleteIndex] = '';
          deliverSign.src = '';
        }
      }

      if (activeSignature === 'R') {
        if (dataURL1) {
          $scope.doiDataCompleteTemp.receiverIsSignature[$scope.doiCompleteIndex] = true;
          $scope.doiDataCompleteTemp.receiverSignature[$scope.doiCompleteIndex] = dataURL1;
        } else {
          $scope.doiDataCompleteTemp.receiverIsSignature[$scope.doiCompleteIndex] = false;
          $scope.doiDataCompleteTemp.receiverSignature[$scope.doiCompleteIndex] = '';
          receiverSign.src = '';
        }
      }
      $scope.checkDoiDataSignatures();
    }
    setEmpty('#reason');
    $scope.naReason.txt = '';

    //DoiSignData.ShippingDoiData.deliverySignature[innerIndex]
    //check for any blank signs
    var doiIncompleteChk = false;

    for (let i = 0; i < $scope.doiData.length; i++) {
      let doiRow = $scope.doiData[i];
      if ($scope.order.activeAction == "Deliver") {
        for (let j = 0; j < doiRow.DoiSignData.DeliveringDoiData.deliverySignature.length; j++) {
          let value = doiRow.DoiSignData.DeliveringDoiData.deliverySignature[j];
          doiIncompleteChk = (value == "" || value == null || value == undefined);
          break;
        }

        if (!doiIncompleteChk) { //if all signs in deliver has been entered then check receivers
          for (let j = 0; j < doiRow.DoiSignData.DeliveringDoiData.deliverySignature.length; j++) {
            let value = doiRow.DoiSignData.DeliveringDoiData.deliverySignature[j];
            doiIncompleteChk = (value == "" || value == null || value == undefined);
            break;
          }
          // angular.forEach(doiRow.DoiSignData.DeliveringDoiData.receiverSignature, function(value, k){
          //     doiIncompleteChk = (value == "" || value == null || value == undefined);
          // });
        }

      } else if ($scope.order.activeAction == "Ship") {
        for (let j = 0; j < doiRow.DoiSignData.ShippingDoiData.deliverySignature.length; j++) {
          let value = doiRow.DoiSignData.ShippingDoiData.deliverySignature[j];
          doiIncompleteChk = (value == "" || value == null || value == undefined);
          break;
        }

        // angular.forEach(doiRow.DoiSignData.ShippingDoiData.deliverySignature, function(value, k){
        //     doiIncompleteChk = (value == "" || value == null || value == undefined);
        // });

        if (!doiIncompleteChk) {
          for (let j = 0; j < doiRow.DoiSignData.ShippingDoiData.receiverSignature.length; j++) {
            let value = doiRow.DoiSignData.ShippingDoiData.receiverSignature[j];
            doiIncompleteChk = (value == "" || value == null || value == undefined);
            break;
          }
          // angular.forEach(doiRow.DoiSignData.ShippingDoiData.receiverSignature, function(value, k){
          //     doiIncompleteChk = (value == "" || value == null || value == undefined);
          // });
        }
      }
      if (doiIncompleteChk) {
        break;
      }
    }
    // angular.forEach($scope.doiData, function(doiRow, key){

    //     if ($scope.order.activeAction == "Deliver"){
    //         if(!doiIncompleteChk){
    //             angular.forEach(doiRow.DoiSignData.DeliveringDoiData.deliverySignature, function(value, k){
    //                 doiIncompleteChk = (value == "" || value == null || value == undefined);
    //             });
    //         }
    //         if(!doiIncompleteChk){ //if all signs in deliver has been entered then check receivers
    //             angular.forEach(doiRow.DoiSignData.DeliveringDoiData.receiverSignature, function(value, k){
    //                 doiIncompleteChk = (value == "" || value == null || value == undefined);
    //             });
    //         }

    //     }else if($scope.order.activeAction == "Ship"){
    //         if(!doiIncompleteChk){
    //             angular.forEach(doiRow.DoiSignData.ShippingDoiData.deliverySignature, function(value, k){
    //                 doiIncompleteChk = (value == "" || value == null || value == undefined);
    //             });
    //         }
    //         if(!doiIncompleteChk){
    //             angular.forEach(doiRow.DoiSignData.ShippingDoiData.receiverSignature, function(value, k){
    //                 doiIncompleteChk = (value == "" || value == null || value == undefined);
    //             });
    //         }
    //     }
    // });
    if (!doiIncompleteChk) {
      $scope.doiIncomplete = false;
    }

    callback();
  }

  function getVisible() {
    var $el = $('.doiView'),
      scrollTop = $(this).scrollTop(),
      scrollBot = scrollTop + $(this).height(),
      elTop = $el.offset().top,
      elBottom = elTop + $el.outerHeight(),
      visibleTop = elTop < scrollTop ? scrollTop : elTop,
      visibleBottom = elBottom > scrollBot ? scrollBot : elBottom;
    return (visibleBottom - visibleTop);
  }
  $rootScope.initConverstion = function() {
    $rootScope.loading = true;
    var canvasEl = document.createElement('canvas');
    canvasEl.width = $('.doiView').width();
    canvasEl.height = $('.doiView').height();
    var context = canvasEl.getContext('2d');
    var images = [];
    var h = 0;
    $my_view = $('.doiView');
    $ionicScrollDelegate.$getByHandle('doiContent').scrollTop();
    $(function() {
      // wait till load event fires so all resources are available
      function htmlTocanvas() {
        var useHeight = $('.doiView').prop('scrollHeight');
        html2canvas($my_view[0], {
          height: useHeight,
          onrendered: function(canvas) {
            if ($my_view.height() > h) {
              context.drawImage(canvas, 0, 0, $my_view.width(), $my_view.height());
              h = h + getVisible();
              $ionicScrollDelegate.$getByHandle('doiContent').scrollTo(0, h);
              setTimeout(function() {
                htmlTocanvas();
              }, 0)
            } else {
              var imgSrc = canvasEl.toDataURL("image/jpeg");
              postDOIData(imgSrc, canvasEl.width, canvasEl.height)
            }
          }
        });

      }
      setTimeout(function() { htmlTocanvas(); }, 0)
    });
  };

  var offlineData = $localstorage.get('lastlogin');
  var data = JSON.parse(offlineData);
  var userName = '';
  if ($rootScope.loginCredentials) {
    userName = $rootScope.loginCredentials.UserName;
  } else {
    userName = data[1].uname;
  }
  $rootScope.postDOIData = function(doiDiv, flag) {
    if ($scope.activeAction == 'Deliver' && flag === 1) {
      $rootScope.setPartialDelivery();
    }

    var reqData = {
      "DoiData": [{
        "OrderNo": $scope.order.OrderHdr.OrderNo,
        "OrderItemID": $scope.currentItem.MasterProdID,
        "DeviceTime": $rootScope.getCurrentDateTime(),
        "DoiImg": '',
        "UserID": userName,
        "DOIDetails": {
          "DeliveringID": [],
          "ReceivingID": []
        },
        "CompanyID": $rootScope.CompanyID
      }]
    };

    var doiAlias = reqData.DoiData[0],
      shiftDetailsAlias = $scope.order.shiftDetails;

    if ($scope.order.activeAction == "Ship") {
      doiAlias.DOIType = "S";
      doiAlias.DOIDetails.DeliveringID = shiftDetailsAlias.Ship.Delivering;
      doiAlias.DOIDetails.ReceivingID = shiftDetailsAlias.Ship.Receiving;
    }

    if ($scope.order.activeAction == "Deliver") {
      doiAlias.DOIType = "D";
      doiAlias.DOIDetails.DeliveringID = shiftDetailsAlias.Deliver.Delivering;
      doiAlias.DOIDetails.ReceivingID = shiftDetailsAlias.Deliver.Receiving;
    }
    $scope.saveOrder();
    $rootScope.showLoading = false;

    var config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
      },
      timeout: 20000
    }
    var currentDate = $rootScope.getCurrentDateTime();
    $scope.currDate = moment(currentDate).format("YYYY-MM-DD");
    $scope.currHours = moment(currentDate).format("HH-mm-A");
    $scope.currDT = $scope.currDate + '_' + $scope.currHours;
    $scope.orderType = ($scope.activeAction == 'Ship') ? 'Ship' : 'Deliver';
    $scope.ticketName = $scope.orderType + '_' + $scope.order.OrderHdr.OrderNo + '_' + shipId;

    var url = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.ticketName + '_' + $scope.currDT + '_DOI.pdf';
    var thumbUrl = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.ticketName + '_' + $scope.currDT + '_DOI_THUMBNAIL.png';
    var localFilePath = $rootScope.DevicePath + $scope.order.OrderHdr.OrderNo + '/';
    var offlineUrl = localFilePath + $scope.ticketName + '_' + $scope.currDT + '_DOI.pdf';
    var offlineThumb = localFilePath + $scope.ticketName + '_' + $scope.currDT + '_DOI_THUMBNAIL.png';

    var dochtml = $('.html2canvasDiv').get(0);

    $(document).ready(function() {
      $.when($.get("css/doi.css"))
        .done(function(response) {

          var styleData = '<head><style>' + response + '</style></head>';
          var docData = styleData + dochtml.innerHTML + '</div>';

          var data = {
            type: 'DOI',
            data: doiDiv,
            OrderNo: $scope.order.OrderHdr.OrderNo,
            OrderItemID: $scope.currentItem.MasterProdID,
            UserID: userName,
            requestData: reqData,
            url: appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postDOI + "?" + appConstants.dreamFactoryApiKeySet,
            shipId: shipId,
            env: appConstants.env,
            dTime: $scope.currDT,
            ticketName: $scope.ticketName,
            offlineUrl: offlineUrl,
            offlineThumb: offlineThumb,
            offlineData: docData
          }

          $scope.newDoc = {};
          $scope.attachedDocument = [];
          $scope.newDoc.OrderNo = $scope.order.OrderHdr.OrderNo;
          $scope.newDoc.SysTrxNo = $scope.order.OrderHdr.SysTrxNo;
          $scope.newDoc.dataURL = url;
          $scope.newDoc.dataThumb = thumbUrl;
          $scope.newDoc.offlineUrl = offlineUrl;
          $scope.newDoc.offlineThumb = offlineThumb;
          $scope.newDoc.id = Math.floor(Math.random() * (999999 - 100000) + 100000);
          $scope.newDoc.dateTime = new Date();
          $scope.newDoc.type = "P";
          $scope.newDoc.name = $scope.ticketName + '_' + $scope.currDT + '-DOI';
          $scope.attachedDocument.push($scope.newDoc);
          if ($scope.order.OrderHdr.OrderAttachment == undefined) {
            $scope.order.OrderHdr.OrderAttachment = $scope.attachedDocument;
          } else {
            $scope.order.OrderHdr.OrderAttachment = $scope.order.OrderHdr.OrderAttachment.concat($scope.attachedDocument);
          }
          /* Offline Activity Logs */
          if (!$rootScope.isInternet || !$rootScope.online) {
            var formActivityData = {};
            formActivityData.DtTm = moment(currentDate).format("YYYY-MM-DD HH:mm");
            formActivityData.ID = 3;
            formActivityData.Type = ($scope.activeAction == 'Ship') ? "Ship DOI Added" : "Delivery DOI Added";
            formActivityData.UserID = $rootScope.loginData.uname;
            if ($scope.order.OrderHdr.OrderActivityLogs)
              $scope.order.OrderHdr.OrderActivityLogs.push(formActivityData);
          }

          $rootScope.showNodeLoader();
          $http.post(appConstants.nodeURL + 'doi', data, config)
            .success(function(res) {
              $rootScope.hideNodeLoader();
            })
            .error(function(err) {
              $rootScope.hideNodeLoader();
              $rootScope.showToastMessage("ERR - DOI - Attachment not added");
            });
          if ($scope.activeAction == "Deliver") {
            if (window.cordova)
              $localstorage.set($scope.order.OrderHdr.OrderNo, offlineUrl);
          }
        });
    });


  }


  function getBase64Image(imgElem) {
    return imgElem.replace(/^data:image\/(png|jpg);base64,/, "");
  }

  function getBase64Pdf(pdfElem) {
    return pdfElem.replace(/^data:application\/(pdf|jpg);base64,/, "");
  }

  $scope.getClass = function(path) {
    void 0;
    return ($location.path().substr(0, path.length) === path) ? 'active' : '';
  }

  $scope.getImage = function(data) {
    void 0;
    return data;
  }

  function formDoiJson(doiData, callback) {
    var doiAlias = [],
      delivering = [],
      receiving = [];
    angular.forEach(doiData, function(value, key) {
      if (!value.DoiSignData) {
        value.DoiSignData = { "ShippingDoiData": { "deliverySignature": [], "receiverSignature": [], "deliveryIsSignature": [], "receiverIsSignature": [], "disableDelSignPad": false, 'disableRecSignPad': false }, "DeliveringDoiData": { "deliverySignature": [], "receiverSignature": [], "deliveryIsSignature": [], "receiverIsSignature": [], "disableDelSignPad": false, 'disableRecSignPad': false } };
      }

      if ($scope.order.activeAction == 'Ship') {
        doiAlias = value.DoiSignData.ShippingDoiData;
        delivering = $scope.order.shiftDetails.Ship.Delivering;
        receiving = $scope.order.shiftDetails.Ship.Receiving;
      }

      if ($scope.order.activeAction == 'Deliver') {
        doiAlias = value.DoiSignData.DeliveringDoiData;
        delivering = $scope.order.shiftDetails.Deliver.Delivering;
        receiving = $scope.order.shiftDetails.Deliver.Receiving;
      }

      angular.forEach(delivering, function(value, key) {
        for (var i = 0; i < delivering.length - doiAlias.deliverySignature.length; i++) {
          doiAlias.deliverySignature.push({});
          doiAlias.deliveryIsSignature.push(false);
          doiAlias.disableDelSignPad = false;
        }
      });

      angular.forEach(receiving, function(value, key) {
        for (var i = 0; i < receiving.length - doiAlias.receiverSignature.length; i++) {
          doiAlias.receiverSignature.push({});
          doiAlias.receiverIsSignature.push(false);
          doiAlias.disableRecSignPad = false;
        }

      });

    });

    var ship = $scope.order.shiftDetails.Ship,
      deliver = $scope.order.shiftDetails.Deliver;
    if ($scope.order.activeAction == 'Ship') {
      $scope.doiDataComplete.Shipping.delTitle = [];
      $scope.doiDataComplete.Shipping.recTitle = [];
      for (var i = 0; i < ship.Delivering.length; i++) {
        $scope.doiDataComplete.Shipping.delTitle.push(ship.Delivering[i].title);
        $scope.doiDataComplete.Shipping.deliveryIsSignature[i] = $scope.doiDataComplete.Shipping.deliveryIsSignature[i] || false;
      }
      for (var i = 0; i < ship.Receiving.length; i++) {
        $scope.doiDataComplete.Shipping.recTitle.push(ship.Receiving[i].title);
        $scope.doiDataComplete.Shipping.receiverIsSignature[i] = $scope.doiDataComplete.Shipping.receiverIsSignature[i] || false;
      }
    }
    if ($scope.order.activeAction == 'Deliver') {
      $scope.doiDataComplete.Delivering.delTitle = [];
      $scope.doiDataComplete.Delivering.recTitle = [];
      for (var i = 0; i < deliver.Delivering.length; i++) {
        $scope.doiDataComplete.Delivering.delTitle.push(deliver.Delivering[i].title);
        $scope.doiDataComplete.Delivering.deliveryIsSignature[i] = $scope.doiDataComplete.Delivering.deliveryIsSignature[i] || false;
      }
      for (var i = 0; i < deliver.Receiving.length; i++) {
        $scope.doiDataComplete.Delivering.recTitle.push(deliver.Receiving[i].title);
        $scope.doiDataComplete.Delivering.receiverIsSignature[i] = $scope.doiDataComplete.Delivering.receiverIsSignature[i] || false;
      }
    }

    callback();

  }

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
    //$scope.modal.remove();
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
    //$scope.modal.remove();
  });
  $scope.findDoiClass = function(len, last, role) {
    if (len > 1 && !last) {
      return 'disableDOI';
    }
    if ($scope.shiftChange) {
      if (role != $scope.transferDetails.changedShift) {
        return 'disableDOI';
      }
    }

  }

  /* Shift Change logic */
  $ionicModal.fromTemplateUrl('newUserShiftModal.html', {
    scope: $scope,
    animation: 'none',
    backdropClickToClose: false
  }).then(function(modal) {
    $scope.newUserModal = modal;

    if ($scope.order.newDoiComplete == true) {
      if (!$scope.transferDetails.scByLoginUser) {
        // $scope.newUserModal.show();
      } else {
        var newUser = {};
        newUser.name = $rootScope.loginData.uname;
        newUser.lname = '';
        newUser.title = 'Tankerman';
        $scope.order.newDoiComplete = false;
        var currentPos = $scope.shiftDetails[$scope.order.activeAction][$scope.order.transferDetails.changedShift].length - 1;
        $scope.shiftDetails[$scope.order.activeAction][$scope.order.transferDetails.changedShift][currentPos] = newUser;
        $scope.transferDetails[$scope.order.transferDetails.changedShift] = newUser;
        $scope.saveOrders();
      }
    }
  });
  /* ShiftChange process popup functionality work out */
  $scope.newUser = {};
  $scope.transferDetails = $scope.order.transferDetails;
  $scope.shiftDetails = $scope.order.shiftDetails;
  $scope.processCompleteDoi = function() {
    $scope.newUserModal.hide();
    $scope.order.newDoiComplete = false;
    var currentPos = $scope.shiftDetails[$scope.order.activeAction][$scope.order.transferDetails.changedShift].length - 1;
    $scope.shiftDetails[$scope.order.activeAction][$scope.order.transferDetails.changedShift][currentPos] = $scope.newUser;
    $scope.transferDetails[$scope.order.transferDetails.changedShift] = $scope.newUser;
    $scope.saveOrders();
    // $scope.$digest();
  }
  $scope.saveOrders = function() {
    $scope.orderDT = moment.utc(); // Current Date & time
    $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
    $scope.order.cTs = $scope.orderTs;
    $scope.order.DeviceID = $rootScope.deviceUid || null;
    var orderTemp = { "Orders": $scope.order };
    $scope.updateSuccess = function(results) {
      if ($scope.role == 'userRole') {
        var idx = $scope.shiftChangeOrders.indexOf($scope.order);
        $scope.shiftChangeOrders.splice(idx, 1);
        if ($scope.shiftChangeOrders.length > 0) {
          $state.go('shiftchangeorders');
        } else {
          $rootScope.showToastMessage("Shift Change Done");
          $rootScope.loading = true;
          $rootScope.stOrdersBackground = false;
          addOrderService.logoutUser(function(response) {
            $rootScope.loading = false;
            $rootScope.loginData.pword = '';
            $rootScope.isDisabled = false;
            $rootScope.submitted = false;
            $state.go('login');
          });
        }
      }
    }
    $scope.order.OrderHdrData = $rootScope.formOrderHeaderJson(orderTemp.Orders.OrderHdr);
    $scope.getCount = function(results) {
      if (!results.success) {
        return false;
      }
      var len = results.data.rows.length;
      if (len > 0) {
        dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [$scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), $scope.order.OrderHdr.SysTrxNo], $scope.updateSuccess);
      } else {
        dbo.insertTableData('OrdersMaster', ['orderNo', 'SysTrxNo', 'status', 'orderData', 'orderHdrData', 'dateTime'], [$scope.order.OrderHdr.OrderNo, $scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), new Date()], $scope.insertSuccess);
      }

    };
    dbo.selectTable('OrdersMaster', "orderNo=?", [$scope.order.OrderHdr.OrderNo], $scope.getCount);
  };

  // Deliver doi location to change the logic,marine location code and default location description display(If Not set in ascend then display InsiteAddress)
  if ($scope.order.activeAction == 'Deliver') {
    if ($scope.order.OrderHdr.Destination != null) {
      if ($scope.order.OrderHdr.Destination.Code) {
        $scope.DoiLocation = $scope.order.OrderHdr.Destination.Code;
        if ($scope.order.OrderHdr.Destination.DefLocDescr && $scope.order.OrderHdr.Destination.DefLocDescr != 'NULL') {
          $scope.DoiLocation = $scope.DoiLocation + ', ' + $scope.order.OrderHdr.Destination.DefLocDescr;
        }
      } else {
        $scope.DoiLocation = $scope.order.OrderHdr.INSiteAddress;
      }
    }
  }

  /* Receiver/Deliver Siugnature box Disabled */
  $scope.signDelRecvDisabled = function(obj) {
    obj.name = (obj.name) ? obj.name : '';
    var returnClass;
    if (obj.name && obj.name != '') {
      returnClass = '';
    } else {
      returnClass = 'disableDOI';
    }
    return returnClass;
  }

  /* Required DOI Delivery/Receiving signature */
  $scope.checkDoiSignatures = function() {
    var passed = true;
    $scope.doiData.forEach(function(doiObj) {
      var doiCheckObj;
      if ($scope.order.activeAction == "Ship") {
        doiCheckObj = doiObj.DoiSignData.ShippingDoiData;
      } else {
        doiCheckObj = doiObj.DoiSignData.DeliveringDoiData;
      }
      if (doiCheckObj.deliveryIsSignature && doiCheckObj.deliveryIsSignature.length > 0) {
        doiCheckObj.deliveryIsSignature.forEach(function(deliveryObj) {
          if (!deliveryObj) {
            passed = false;
          }
        });
      } else {
        passed = false;
      }

      if (doiCheckObj.receiverIsSignature && doiCheckObj.receiverIsSignature.length > 0) {
        doiCheckObj.receiverIsSignature.forEach(function(receiverObj) {
          if (!receiverObj) {
            passed = false;
          }
        });
      } else {
        passed = false;
      }

    });
    
    if (passed) {
      $rootScope.allowDoiProceed = true;
    } else {
      $rootScope.allowDoiProceed = false;
    }

  }

  /* Required DOI Person Incharge Delivery/Receiving signature */
  $scope.checkDoiDataSignatures = function() {
    var passed = true;
    var doiFinalSignObj;
    if ($scope.order.activeAction == "Ship") {
      doiFinalSignObj = $scope.doiDataComplete.Shipping;
    } else {
      doiFinalSignObj = $scope.doiDataComplete.Delivering;
    }
    var skipDelivery, skipReceiving;

    skipDelivery = ($scope.shiftChange && $scope.transferDetails.changedShift != "Delivering")

    skipReceiving = ($scope.shiftChange && $scope.transferDetails.changedShift != "Receiving")

    if (!skipDelivery) {
      if (doiFinalSignObj.deliveryIsSignature && doiFinalSignObj.deliveryIsSignature.length > 0) {
        doiFinalSignObj.deliveryIsSignature.forEach(function(obj) {
          if (!obj) {
            passed = false;
          }
        });
      } else {
        passed = false;
      }
    }

    if (!skipReceiving) {
      if (doiFinalSignObj.receiverIsSignature && doiFinalSignObj.receiverIsSignature.length > 0) {
        doiFinalSignObj.receiverIsSignature.forEach(function(obj) {
          if (!obj) {
            passed = false;
          }
        });
      } else {
        passed = false;
      }
    }


    if (passed) {
      $rootScope.allowDoiDataProceed = true;
    } else {
      $rootScope.allowDoiDataProceed = false;
    }
  }

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.naReasonModal.remove();
    $scope.naReasonShowModal.remove();
    $scope.newUserModal.remove();
  });

});
