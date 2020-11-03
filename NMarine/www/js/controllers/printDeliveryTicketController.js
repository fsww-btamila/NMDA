app.controller('printDeliveryTicketController', function($ionicPlatform, $scope, $rootScope, $stateParams, $cordovaPrinter, $state, $ionicModal, $ionicScrollDelegate, addOrderService, dbService, appConstants, $http, $timeout, OrderList, $ionicLoading, $localstorage, commonService, $filter, $q, $ionicPopup) {

  if (OrderList) {
    $scope.order = OrderList.Orders;
  }

  $scope.vesselStr = $rootScope.formMultiVesselStr($scope.order.OrderHdr);

  $scope.dTOrderList = angular.copy($scope.order);
  $scope.orderItems = $scope.dTOrderList.OrderItems;
  $scope.general = $scope.order.OrderHdr;
  $scope.order.Dcname = ($scope.order.Dcname) ? $scope.order.Dcname : '';
  /* Get Deliver Doi Attachment url */
  var doiCheck = $localstorage.get($scope.order.OrderHdr.OrderNo);
  if (doiCheck) {
    $scope.doiUrl = doiCheck;
  }

  // If user changed any items or added a new item then upon coming back to the Delivery Confirmation it should blank
  if ($scope.order.ClearDeliveryTicketSign) {
    $scope.order.signExists = false;
    $scope.DelSignClear = true;
    dbo.deleteTableData('DataMaster', "SysTrxNo=?", [$scope.order.OrderHdr.SysTrxNo]);
    $scope.order.signTime = new Date();
    $scope.order.ClearDeliveryTicketSign = false;
  }

  $scope.formatOrederHDRNotes = angular.copy($scope.order.OrderHdr.OrderNotes);
  if ($scope.formatOrederHDRNotes.length > 0) {
    //Get All OrderHeaderNotes and display  Delivery Confirmation
    $scope.notesArr = [];
    angular.forEach($scope.formatOrederHDRNotes, function(notes, key) {
      if (notes && notes.Note) {
        notes.Note = notes.Note;
        $scope.notesArr.push(notes.Note);
      }
    });

    if ($scope.notesArr.length > 0) {
      var getAllNotes = $scope.notesArr.toString();
      getAllNotes = getAllNotes.replace(/,/g, ",  ");
      $scope.orderHdrNotes = getAllNotes.substr(0, 200);
    }
  }

  // Functionality for grouping the OrderItems by their Vessel and also display marine location
  angular.forEach($scope.orderItems, function(value, key) {
    if (value.Deliver.vessel == undefined) {
      value.Deliver.vessel = {};
      value.Deliver.vessel.VesselCode = '';
    }
    var formStr = '';
    if (value.Descr) {
      formStr += value.Descr + "\n";
    }
    if (value.CriticalDescription) {
      formStr += value.CriticalDescription + "\n";
    }
    if (value.PONo) {
      formStr += "PO: " + value.PONo + "\n";
    }
    if (value.Notes) {
      formStr += "Comment: " + value.Notes + "\n";
    }
    if (value.VendorProductxRef) {
      formStr += "Product Code: " + value.VendorProductxRef + "\n";
    }
    $scope.orderItems[key].formMdaNotes = formStr;
  });

  if ($scope.general.InternalTransferOrder == 'N') {
    if ($scope.general.Vehicle.EnforceShipmentMarineApp == 'Y') {
      $scope.customerAddress = $scope.general.Destination.Code;
    } else if ($scope.general.Vehicle.EnforceShipmentMarineApp == 'N') {
      // if ($rootScope.selectedSite.SiteType == "F") {
      //   $scope.customerAddress = $scope.general.Destination.Descr;
      // } else if ($rootScope.selectedSite.SiteType != 'F') {
      //   $scope.customerAddress = $scope.general.Destination.Code;
      // }
      $scope.customerAddress = $scope.general.Destination.Code;
    }
  } else {
    if (!$scope.general.Destination) {
      $scope.customerAddress = $scope.dTOrderList.OrderHdr.ToSiteAddress;
    } else {
      $scope.customerAddress = $scope.general.Destination.Code;
    }
  }

  if ($scope.general.Destination && $scope.general.Destination.DefLocDescr && $scope.general.Destination.DefLocDescr != 'NULL') {
    $scope.customerAddress = $scope.customerAddress + ', ' + $scope.general.Destination.DefLocDescr;
  }

  var d = new Date();
  if (!$scope.order.finishDateTime) {
    $scope.order.finishDateTime = d;
  }
  $scope.currdate = d;

  $scope.onlyPrint = false;
  $scope.printDT = function(callback) {
    $scope.onlyPrint = true;
    var printHeader = document.querySelector('#newHead');
    printHeader.style.width = "65%";
    printHeader.style.fontWeight = "450";
    printHeader.style.color = "#000";
    var printBody = document.querySelector('#newprint');
    var printSignature = document.querySelector('#sigTab');
    printSignature.style.width = "65%";
    printSignature.style.fontWeight = "480";
    printSignature.style.color = "#000";
    var doc = new jsPDF();
    var tableData = doc.autoTableHtmlToJson(printBody, false);
    var totalPagesExp = "{total_pages_count_string}";


    var setMarTop;
    // var setMarTop = ($scope.logoActive=='Y') ? 63 : 58 ;
    if ($scope.logoActive == 'Y') {
      setMarTop = 63;
    } else {
      if ($scope.order.OrderHdr.PONo) {
        setMarTop = 63;
      } else {
        setMarTop = 58;
      }
    }
    var pngHeader, pngSignature, pdfOutput;
    printHeader.scrollIntoView();
    html2canvas(printHeader, {
      background: '#fff',
      onrendered: function(canvas) {
        pngHeader = canvas.toDataURL('image/jpeg', 1.0);
        printSignature.scrollIntoView();
        html2canvas(printSignature, {
          background: '#fff',
          onrendered: function(canvas2) {
            pngSignature = canvas2.toDataURL('image/jpeg', 1.0);
            var pageContent = function(data) {
              // HEADER
              doc.setFontSize(15);
              doc.setTextColor(40);
              doc.setFontStyle('normal');
              // if ($scope.companyImage) {
              //     doc.addImage($scope.companyImage, 'JPEG', 0, 100, 50);
              // }
              // window.scrollTo({
              //   top: 0,
              //   behavior: "smooth"
              // });
              document.body.scrollTop = document.documentElement.scrollTop = 0;


              doc.addImage(pngHeader, 'JPEG', 0, 10);

              // FOOTER
              var str = "Page " + data.pageCount;
              // Total page number plugin only available in jspdf v1.0+
              if (typeof doc.putTotalPages === 'function') {
                str = str + " of " + totalPagesExp;
              }
              doc.setFontSize(10);
              $scope.pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
              doc.text(str, doc.internal.pageSize.getWidth() - 30, $scope.pageHeight - 5);
              setTimeout(function() {
                if (data.pageCount == doc.internal.getNumberOfPages()) {
                  doc.addImage(pngSignature, 'JPEG', 0, $scope.pageHeight - 55);
                }
              }, 10)

            };

            doc.autoTable(tableData.columns, tableData.data, {
              theme: "plain",
              textColor: 100,
              addPageContent: pageContent,
              bodyStyles: { valign: 'top' },
              // margin: [55, 0, 30, 10],
              // styles: { overflow: 'linebreak', columnWidth: 40,halign: 'left'},
              margin: {
                top: setMarTop,
                left: 10,
                right: 10,
                bottom: 55
              },
              styles: {
                cellPadding: 1.5,
                overflow: 'linebreak',
                valign: 'middle',
                halign: 'left'
              },
              columnStyles: {
                0: { columnWidth: 20 },
                1: { columnWidth: 40 },
                2: { columnWidth: 95 },
                3: { columnWidth: 40 },
              }
            });


            if (typeof doc.putTotalPages === 'function') {
              doc.putTotalPages(totalPagesExp);
            }

            printHeader.style.width = "100%";
            printSignature.style.width = "100%";



            /**** generate options ******/


            //config.data.offlineData.slice(config.data.offlineData.indexOf('base64,')+7);
            setTimeout(function() {
              pdfOutput = doc.output('dataurlstring');
              pdfOutput = pdfOutput.slice(pdfOutput.indexOf('base64,') + 7);
              callback(pdfOutput);
            }, 1000);

            /********** end generate options ***/

          }
        });
      }

    });
  }
  $scope.hidePrintIcon= false;
  $scope.generatePreview = function() {
    $scope.hidePrintIcon= true;
    $scope.onlyPrint = true;
    var printHeader = document.querySelector('#newHead');
    printHeader.style.width = "65%";
    printHeader.style.fontWeight = "450";
    printHeader.style.color = "#000";
    var printBody = document.querySelector('#newprint');
    var printSignature = document.querySelector('#sigTab');
    printSignature.style.width = "65%";
    printSignature.style.fontWeight = "450";
    printSignature.style.color = "#000";

    var doc = new jsPDF();
    var tableData = doc.autoTableHtmlToJson(printBody, false);
    var totalPagesExp = "{total_pages_count_string}";
    var setMarTop;
    // var setMarTop = ($scope.logoActive=='Y') ? 63 : 58 ;
    if ($scope.logoActive == 'Y') {
      setMarTop = 63;
    } else {
      if ($scope.order.OrderHdr.PONo) {
        setMarTop = 63;
      } else {
        setMarTop = 58;
      }
    }

    var pngHeader, pngSignature, pdfOutput;
    printHeader.scrollIntoView();
    html2canvas(printHeader, {
      background: '#fff',
      onrendered: function(canvas) {
        pngHeader = canvas.toDataURL('image/jpeg', 1.0);
        printSignature.scrollIntoView();
        html2canvas(printSignature, {
          background: '#fff',
          onrendered: function(canvas2) {
            pngSignature = canvas2.toDataURL('image/jpeg', 1.0);
            var pageContent = function(data) {
              // HEADER
              doc.setFontSize(15);
              doc.setTextColor(40);
              doc.setFontStyle('normal');
              // if ($scope.companyImage) {
              //     doc.addImage($scope.companyImage, 'JPEG', 0, 100, 50);
              // }
              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });

              doc.addImage(pngHeader, 'JPEG', 0, 10);

              // FOOTER
              var str = "Page " + data.pageCount;
              // Total page number plugin only available in jspdf v1.0+
              if (typeof doc.putTotalPages === 'function') {
                str = str + " of " + totalPagesExp;
              }
              doc.setFontSize(10);
              $scope.pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
              doc.text(str, doc.internal.pageSize.getWidth() - 30, $scope.pageHeight - 5);
              setTimeout(function() {
                if (data.pageCount == doc.internal.getNumberOfPages()) {
                  doc.addImage(pngSignature, 'JPEG', 0, $scope.pageHeight - 55);
                }
              }, 10)

            };

            doc.autoTable(tableData.columns, tableData.data, {
              theme: "plain",
              textColor: 100,
              addPageContent: pageContent,
              bodyStyles: { valign: 'top' },
              // margin: [55, 0, 30, 10],
              // styles: { overflow: 'linebreak', columnWidth: 40,halign: 'left'},
              margin: {
                top: setMarTop,
                left: 10,
                right: 10,
                bottom: 55
              },
              styles: {
                cellPadding: 1.5,
                overflow: 'linebreak',
                valign: 'middle',
                halign: 'left'
              },
              columnStyles: {
                0: { columnWidth: 20 },
                1: { columnWidth: 40 },
                2: { columnWidth: 95 },
                3: { columnWidth: 40 },
              }
            });


            if (typeof doc.putTotalPages === 'function') {
              doc.putTotalPages(totalPagesExp);
            }

            printHeader.style.width = "100%";
            printSignature.style.width = "100%";
            setTimeout(function() {
              pdfOutput = doc.output('dataurlstring');
              pdfOutput = pdfOutput.slice(pdfOutput.indexOf('base64,') + 7);
              $scope.inPreview = true;
              var currentDate = $rootScope.getCurrentDateTime();
              $scope.currDate = moment(currentDate).format("YYYY-MM-DD");
              $scope.currHours = moment(currentDate).format("HH-mm-A");
              $scope.currDT = $scope.currDate + '_' + $scope.currHours;

              var url = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.order.OrderHdr.OrderNo + '_' + $scope.currDT + '_DELIVERY_TICKET.pdf';
              var thumbUrl = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.order.OrderHdr.OrderNo + '_' + $scope.currDT + '_DELIVERY_TICKET_THUMBNAIL.png';
              var localFilePath = $rootScope.DevicePath + $scope.order.OrderHdr.OrderNo + '/';
              var offlineUrl = localFilePath + $scope.order.OrderHdr.OrderNo + '_DELIVERY_TICKET.pdf';
              var offlineThumb = localFilePath + $scope.order.OrderHdr.OrderNo + '_DELIVERY_TICKET_THUMBNAIL.png';


              var config = {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                },
                timeout: 20000
              }

              var data = {
                type: 'DT',
                OrderNo: $scope.order.OrderHdr.OrderNo,
                offlineUrl: offlineUrl,
                offlineThumb: offlineThumb,
                offlineData: pdfOutput
              }
              $ionicLoading.show({
                template: '<ion-spinner></ion-spinner><br><br><br><br><p>Generating Print Preview.</p>'
              });
              commonService.saveAttachments('DT', { data: data }, function() {
                $ionicLoading.hide();
                if ($cordovaPrinter.isAvailable()) {
                  /* Deliver Doi Ticket printed */
                  window.plugins.PrintPDF.isPrintingAvailable(function(isAvailable) {
                    if ($scope.doiUrl && $scope.doiUrl != undefined) {
                      var file = $scope.doiUrl;
                      window.plugins.PrintPDF.print({
                        data: file,
                        type: 'File',
                        title: 'Print Document',
                        success: function() {
                          $scope.previewDeliveryTicket(offlineUrl);
                        },
                        error: function(data) {
                          data = JSON.parse(data);
                          console.log('failed: ' + data.error);
                        }
                      });
                    } else {
                      $scope.previewDeliveryTicket(offlineUrl);
                    }

                  });
                } else {
                  $ionicPopup.alert({
                    title: 'Alert!',
                    template: "Printing is not available on device"
                  });
                }

              }, true);

            }, 1000);
          }



          /********** end generate options ***/
        });
      }
    });
  }
  $scope.previewDeliveryTicket = function(offlineUrl) {
    /* Delivery Ticket printed */
    if (offlineUrl && offlineUrl != undefined) {
      var file = offlineUrl;
      window.plugins.PrintPDF.print({
        data: file,
        type: 'File',
        title: 'Print Document',
        success: function() {
          console.log('success');
          $scope.onlyPrint= false;
          $scope.hidePrintIcon= false;
        },
        error: function(data) {
          data = JSON.parse(data);
          console.log('failed: ' + data.error);
        }
      });
    }
  }

  $scope.goBack = function() {
    dbService.upsertOrder($scope.order, function(tx, res) {
      $state.go('shiporder', { 'order': $scope.order.OrderHdr.OrderNo, 'systrxno': $scope.order.OrderHdr.SysTrxNo });
    });
  };

  $scope.finishOrder = function() {
    $scope.onlyPrint = true;
    $scope.convertDeliveryTicket();
  }

  function getBase64Image(imgElem) {
    return imgElem.replace(/^data:image\/(png|jpg);base64,/, "");
  }

  function getBase64Pdf(pdfElem) {
    return pdfElem.replace(/^data:application\/(pdf|jpg);base64,/, "");
  }

  /*
  function postDeliveryTicket(imgSrc, divWidth, divHeight) {
  var doc = new jsPDF();
  var ratio = divHeight / divWidth;
  var width = doc.internal.pageSize.width;
  var height = doc.internal.pageSize.height;
  height = ratio * width;
  doc.addImage(imgSrc, 'JPEG', 0, 0, width - 20, height - 20);
  var pdfDoc = doc.output('datauristring');
  var reqData = {
  "DeliveryTicketData": [{
  "OrderNo": $scope.order.OrderHdr.OrderNo,
  "DeliveryImage": getBase64Pdf(pdfDoc),
  "DeviceTime": $rootScope.getCurrentDateTime(),
  "CustomerID": appConstants.customerId
  }]
  };
  if (!$scope.order.signedOrder) {
  $scope.order.signedOrder = true;
  $scope.order.OrderHdr.Status = "Delivered";
  $scope.order.OrderHdr.StatusCode = "D";
  $scope.order.OrderStatusCode = "D";
  dbService.upsertOrder($scope.order, function(tx, res) {
  updateCurrentLocation($scope.order);
  });
  addOrderService.postDeliveryTicket(reqData).then(function(response) {
  $scope.response = response.data;
  $rootScope.showLoading = true;
  });
  } else {
  $scope.goOrders();
  }
  }
  */


  function getDocMessages(imgSrc) {
    addOrderService.getDocMessages(function(response) {
      $scope.docMessages = response;
    })
  }
  getDocMessages();
  $ionicModal.fromTemplateUrl('delSignModal.html', {
    scope: $scope,
    animation: 'none'
  }).then(function(modal) {
    $scope.delSignmodal = modal;
  });

  $scope.printDelSign = function() {
    $scope.delSignmodal.show().then(function() {
      $scope.signTime = new Date();
      $scope.createSignPad();
    });
  };

  var signaturePad, blankPad;

  $scope.createSignPad = function() {
    var wrapper = document.getElementById("signature-pad"),
      clearButton = wrapper.querySelector("[data-action=clear]"),
      saveButton = wrapper.querySelector("[data-action=save]"),
      canvas = wrapper.querySelector("canvas");
    blank = document.getElementById("blank-signature-pad");
    var blankCanvas = blank.querySelector("canvas"),
      blank;
    if (!signaturePad) {
      signaturePad = new SignaturePad(canvas, {
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
    if ($scope.DelSign) {
      loadSign($scope.DelSign);
    }
  }

  $scope.clearDelSign = function(event) {
    $scope.signPad = { "disableSignPad": false };
    signaturePad.clear();
    $scope.order.signExists = false;
    $scope.DelSign = signaturePad.toDataURL();
    $scope.DelSignClear = true;
    dbo.deleteTableData('DataMaster', "SysTrxNo=?", [$scope.order.OrderHdr.SysTrxNo]);
    $scope.order.signTime = new Date();
  };

  function loadSign(dataURL) {
    var canvas = document.getElementById('signPadDel');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var imageObj = new Image();
    imageObj.onload = function() {
      context.drawImage(this, 0, 0);
    };
    imageObj.src = dataURL;
    if ($scope.DelSignClear) {
      $scope.signPad = { "disableSignPad": false };
    } else {
      $scope.signPad = { "disableSignPad": true };
    }
  }

  (function() {
    dbo.selectTable('DataMaster', "SysTrxNo=? AND type=?", [$scope.order.OrderHdr.SysTrxNo, 'DS'], function(results) {
      if (results.data.rows && results.data.rows.length > 0) {
        $scope.DelSign = results.data.rows[0].data;
        $scope.signPad = { "disableSignPad": true };
        $scope.order.signExists = true;
        $scope.$apply();
      } else {
        $scope.order.signExists = false;
      }
    });
  })();

  $scope.viewDT = function() {
    $scope.order.signTime = Date.now();
    if (blankPad.toDataURL() != signaturePad.toDataURL()) {
      dbo.createTable('DataMaster', ['id INTEGER PRIMARY KEY', 'orderNo', 'SysTrxNo UNIQUE', 'data', 'type']);
      $scope.DelSign = signaturePad.toDataURL();
      $scope.DelSignClear = false;
      dbService.upsertDTData($scope.order.OrderHdr.OrderNo, $scope.order.OrderHdr.SysTrxNo, $scope.DelSign, 'DS', function(val) {
        if (val) {
          console.log("Delivery ticket signature.");
        }
      });
      if (!$scope.order.signTime) {
        $scope.order.signTime = $scope.signTime;
      }
      $scope.order.signExists = true;
      dbService.upsertOrder($scope.order, function(tx, res) {
        $scope.closeDelSign();
        $state.go('printDeliveryTicket', { order: $scope.order.OrderHdr.OrderNo, delivery: true, systrxno: $scope.order.OrderHdr.SysTrxNo });
      });
    } else {
      $rootScope.showAlert("Delivery Ticket", "Please Sign!");
    }

  }

  $scope.closeDelSign = function() {
    $scope.delSignmodal.hide();
  };
  $scope.$on('$destroy', function() {
    $scope.delSignmodal.remove();
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

  function getVisible() {
    var $el = $('#deliveryTicket'),
      scrollTop = $(this).scrollTop(),
      scrollBot = scrollTop + $(this).height(),
      elTop = $el.offset().top,
      elBottom = elTop + $el.outerHeight(),
      visibleTop = elTop < scrollTop ? scrollTop : elTop,
      visibleBottom = elBottom > scrollBot ? scrollBot : elBottom;
    return (visibleBottom - visibleTop);
  }
  $scope.convertDeliveryTicket = function() {

    if (!$scope.order.signedOrder) {
      dbService.upsertOrder($scope.order, function(tx, res) {
        $scope.updateCurrentLocation($scope.order);
      });
    } else {
      $scope.goOrders();
    }
    localStorage.removeItem($scope.order.OrderHdr.OrderNo);
  };

  $scope.updateCurrentLocation = function(order) {
    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner><br><br><br><br><p>Uploading Delivery Details</p>'
    });
    var posOptions = { timeout: 5000, enableHighAccuracy: false };
    var getWatchPos = $localstorage.get('watchPosition');
    var jsonObj = JSON.parse(getWatchPos);
    var getData = jsonObj[0];
    var location_timeout = setTimeout(function() {
      order.OrderHdr.CurrLat = getData.lat;
      order.OrderHdr.CurrLong = getData.lon;
      $scope.formDeliveryJson(order);
    }, 10000);
    navigator.geolocation.getCurrentPosition(
      function(position) {
        clearTimeout(location_timeout);
        order.OrderHdr.CurrLat = position.coords.latitude;
        order.OrderHdr.CurrLong = position.coords.longitude;
        $scope.formDeliveryJson(order);
      },
      function(err) {
        clearTimeout(location_timeout);
        order.OrderHdr.CurrLat = getData.lat;
        order.OrderHdr.CurrLong = getData.lon;
        $scope.formDeliveryJson(order);
      }, posOptions);
  }

  $scope.saveDeliveryTicket = function(callback) {
    // var printHeader = document.querySelector('#printHeader');
    // var printBody = document.querySelector('#printBody');
    // printBody.style.width = "608px";
    // var printItems = document.querySelectorAll('#printBody tr.printItem, tr.additionalItem');
    // var signatureRow = document.querySelector('tr#signature-row')
    // var additionalItems = document.querySelectorAll('tr.additionalItem');
    // var printhtml = $scope.alterForPrintTable(printHeader, printBody, printItems, additionalItems, signatureRow, 22);

    /**** generate options ******/
    var currentDate = $rootScope.getCurrentDateTime();
    $scope.currDate = moment(currentDate).format("YYYY-MM-DD");
    $scope.currHours = moment(currentDate).format("HH-mm-A");
    $scope.currDT = $scope.currDate + '_' + $scope.currHours;

    var url = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.order.OrderHdr.OrderNo + '_' + $scope.currDT + '_DELIVERY_TICKET.pdf';
    var thumbUrl = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.order.OrderHdr.OrderNo + '_' + $scope.currDT + '_DELIVERY_TICKET_THUMBNAIL.png';
    var localFilePath = $rootScope.DevicePath + $scope.order.OrderHdr.OrderNo + '/';
    var offlineUrl = localFilePath + $scope.order.OrderHdr.OrderNo + '_DELIVERY_TICKET.pdf';
    var offlineThumb = localFilePath + $scope.order.OrderHdr.OrderNo + '_DELIVERY_TICKET_THUMBNAIL.png';
    // var documentData = encodeURIComponent(dochtml.innerHTML);
    // var documentData = dochtml.innerHTML;


    var config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
      },
      timeout: 20000
    }


    /* Offline Activity Logs */
    if (!$rootScope.isInternet || !$rootScope.online) {
      var formActivityData = {};
      formActivityData.DtTm = moment(currentDate).format("YYYY-MM-DD HH:mm");
      formActivityData.ID = 4;
      formActivityData.Type = 'Delivery Ticket Added';
      formActivityData.UserID = $rootScope.loginData.uname;
      if ($scope.order.OrderHdr.OrderActivityLogs)
        $scope.order.OrderHdr.OrderActivityLogs.push(formActivityData);
    }

    $rootScope.showNodeLoader();


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
    $scope.newDoc.name = $scope.order.OrderHdr.OrderNo + '_' + $scope.currDT + '- Delivery Ticket';
    $scope.attachedDocument.push($scope.newDoc);

    if ($scope.order.OrderHdr.OrderAttachment == undefined) {
      $scope.order.OrderHdr.OrderAttachment = $scope.attachedDocument;
    } else {
      $scope.order.OrderHdr.OrderAttachment = $scope.order.OrderHdr.OrderAttachment.concat($scope.attachedDocument);
    }
    $scope.printDT(function(output) {
      var data = {
        type: 'DT',
        data: output,
        OrderNo: $scope.order.OrderHdr.OrderNo,
        DeviceTime: $rootScope.getCurrentDateTime(),
        CustomerID: appConstants.customerId,
        url: appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postDeliveryTicket + "?" + appConstants.dreamFactoryApiKeySet,
        env: appConstants.env,
        dTime: $scope.currDT,
        UserID: $rootScope.loginData.uname,
        offlineUrl: offlineUrl,
        offlineThumb: offlineThumb,
        offlineData: output,
        CompanyID: $rootScope.CompanyID
      }
      $http.post(appConstants.nodeURL + 'deliveryTicket', data, config);
      callback();
    });



  }
  
  $scope.formDeliveryJson = function(order) {
    var d = new Date().toString();
    var dateTm = moment.parseZone(d).local().format('YYYY-MM-DD HH:mm:ss');
    if (!$scope.order.deliveredOnce) {
      var json = {
        "ShipmentList": {
          "Shipments": [{
            "ShipDoc": {
              "DtTm": dateTm,
              "PrintDtTm": dateTm,
              "ShipDtTm": $rootScope.formatForAscend($scope.order.OrderHdr.processOrginalTime) || dateTm,
              "DocType": "D",
              "DocNo": order.OrderHdr.ticketNumber || order.OrderHdr.OrderNo,
              "VehicleID": order.OrderHdr.VehicleID || order.OrderHdr.Vehicle.VehicleID,
              "BOLNo": order.OrderHdr.OrderNo,
              "Status": "En Route",
              "StatusCode": "O",
              "SessionNo": "",
              "SessionID": $rootScope.SessionID,
              "DiversionState": "test",
              "DiversionShipToID": order.OrderHdr.ToSiteID,
              "LoadNo": order.OrderHdr.OrderNo,
              "DefCarrierID": order.OrderHdr.DefCarrierID,
              "Longitude": order.OrderHdr.CurrLong || 0,
              "Latitude": order.OrderHdr.CurrLat || 0,
              "DeviceID": $rootScope.deviceUid,
              "DeviceTime": $rootScope.getCurrentDateTime()
            },
            "ShipDocItem": [],
          }],
          "CompanyID": $rootScope.CompanyID,
          "CustomerID": $rootScope.accSettings.customerId,
          "UserID": $rootScope.loginData.uname,
          "CustomerDesc": "Hinkle Floting",
          "OrderNo": $scope.order.OrderHdr.OrderNo,
          "OrderStatusCode": "D"
        }
      };
      angular.forEach(order.OrderItems, function(data, index) {

        function checkProperty(ppty) {
          var ret = "";
          try {
            var pptytest = eval(ppty);
            if (pptytest === undefined || pptytest === "")
              pptytest = "0";
            ret = pptytest;
          } catch (e) {
            if (e instanceof TypeError) {
              ret = "0";
            }
          }
          return ret;
        }
        var ccShipQty;
        var ccDelivQty
        var ccShipNQty
        if (data.cancelDelivery) {
          ccShipQty = 0;
          ccDelivQty = 0;
          ccShipNQty = 0;
        } else {
          ccShipQty = data.Ship.shipWeightQty || data.Ship.ShipQty || data.Ship.quantityShipped || data.Deliver.quantityShipped || data.Deliver.ShipQty || data.Qty || 0;
          ccDelivQty = data.Deliver.ShipQty || data.Deliver.shipWeightQty || data.Deliver.quantityShipped || data.Qty || 0;
          ccShipNQty = data.Ship.shipWeightQty || data.Ship.ShipQty || data.Ship.quantityShipped || 0;
        }
        var item = {
          "MasterProdID": data.MasterProdID,
          "MasterSiteID": data.MasterSiteID || 0,
          "DtTm": dateTm,
          "ShipQty": ccShipQty,
          "DelivDtTm": $rootScope.formatForAscend($scope.order.OrderHdr.processOrginalTime) || dateTm,
          "DelivQty": ccDelivQty,
          "Status": "Shipping in Progress",
          "StatusCode": "O",
          "OrderQty": data.Qty,
          "ShipNetQty": ccShipNQty,
          "BOLQtyVarianceReason": "test",
          "DeliveryQtyVarianceReason": "test",
          "ARShipToTankID": checkProperty('data.Ship.Source[0].TankID'),
          "VesselID": checkProperty('data.Deliver.vessel.VesselID'),
          "MarineLocID": checkProperty('order.OrderHdr.Destination.MarineLocID') || 0,
          "FromTankID": checkProperty('data.FromCsTankFuelHistoryID'),
          "ToTankID": checkProperty('data.ToCsTankFuelHistoryID'),
          "MarineSessionID": order.OrderHdr.SysTrxNo,
          "Notes": (data.Notes ? data.Notes.trim() : data.Notes),
          "IsBillable": data.IsBillable,
          "OnCountUOMID": data.OnCountUOMID || 0,
          "SellByUOMID": data.SellByUOMID || 0,
          "SysTrxLine": data.SysTrxLine || 0
        };
        if (!data.cancelDelivery) {
          if (data.Ship.readBy == 'Tank') {
            item.DelivQty = data.Deliver.ShipQty || data.Deliver.shipWeightQty || data.Deliver.quantityShipped || data.Qty || 0
          }
          if (data.Ship.readBy == 'Meter') {
            item.DelivQty = data.Ship.shipWeightQty || data.Deliver.ShipQty || data.Deliver.quantityShipped || data.Qty || 0;
          }
          if (data.Deliver.finalQty) {
            item.DelivQty = data.Deliver.finalQty;
          }
          if ($scope.general.Vehicle.EnforceShipmentMarineApp === 'N') {
            item.ShipQty = item.DelivQty;
            item.ShipNetQty = item.DelivQty;
          }
        }

        json.ShipmentList.Shipments[0].ShipDocItem.push(item);

      });
      $scope.order.OrderHdr.deliveryDtm = new Date();
      $scope.order.deliveredOnce = true;
      $scope.order.signedOrder = true;
      $scope.order.OrderHdr.Status = "Delivered";
      $scope.order.OrderHdr.StatusCode = "D";
      $scope.order.OrderStatusCode = "D";
      $scope.order.OrderDeliveryDetail = json;
      $scope.saveDeliveryTicket(function(){
        dbService.upsertOrder($scope.order, function(tx, res) {
          $ionicLoading.hide();
          $scope.goOrders();   
        });
      }, function(err) {
        if (!$rootScope.isInternet || !$rootScope.online) {
          console.log("offline process")
        } else {
          $ionicPopup.alert({
            title: 'Alert!',
            template: "There was an error uploading data"
          });
        }
        $ionicLoading.hide();
        $scope.goOrders(); 
      });
    

    }
  }

  $scope.saveOrder = function(cb) {
    $scope.orderDT = moment.utc(); // Current Date & time
    $scope.orderTs = $scope.orderDT.valueOf(); // Current timestamp
    $scope.order.cTs = $scope.orderTs;
    $scope.order.DeviceID = $rootScope.deviceUid || null;
    var OrderNo = $scope.order.OrderNo;
    var orderTemp = { "Orders": $scope.order };
    $scope.order.OrderHdrData = $rootScope.formOrderHeaderJson(orderTemp.Orders.OrderHdr);
    $scope.getCount = function(results) {
      if (!results.success) {
        return false;
      }
      var len = results.data.rows.length;
      if (len > 0) {
        dbo.updateTableData('OrdersMaster', ['SysTrxNo=?', 'status=?', 'orderData=?', 'orderHdrData=?'], ['SysTrxNo=?'], [$scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), $scope.order.OrderHdr.SysTrxNo], function() {
          addOrderService.saveOrder(orderTemp, $scope.order.OrderHdr.OrderNo).then(function(response) {});
        });
      } else {
        dbo.insertTableData('OrdersMaster', ['orderNo', 'SysTrxNo', 'status', 'orderData', 'orderHdrData', 'dateTime'], [$scope.order.OrderHdr.OrderNo, $scope.order.OrderHdr.SysTrxNo, $scope.order.OrderHdr.Status, JSON.stringify(orderTemp), JSON.stringify($scope.order.OrderHdrData), new Date()], $scope.insertSuccess);
      }

    };

    dbo.selectTable('OrdersMaster', "orderNo=?", [$scope.order.OrderHdr.OrderNo], $scope.getCount);
  };

  $scope.goOrders = function() {
    $localstorage.set('lastStatus', $scope.order.OrderHdr.Status);
    $rootScope.hideNodeLoader();
    if ($scope.order.OrderHdr.Status == 'Delivered') {
      setTimeout(function() {
        $state.go('addorder.notes', { 'order': $scope.order.OrderHdr.OrderNo, 'source': true, 'systrxno': $scope.order.OrderHdr.SysTrxNo });
      }, 2000);
    } else {
      setTimeout(function() {
        $state.go('orders');
      }, 2000)
    }

  }
  /*Get Company information*/
  $scope.companyName = ($rootScope.CompanyID == '01') ? appConstants.CompanyName[0].name : appConstants.CompanyName[1].name;
  var getLogo = function() {
    dbo.selectTable('CompanyMaster', "CompanyID=?", [$rootScope.CompanyID], function(results) {
      var data = results.data.rows[0];
      $scope.companyImage = "data:image/jpeg;base64," + data.LogoImage;
      $scope.logoActive = data.Active;
      $scope.CustomerNo = (data.CustomerNo && data.CustomerNo != null && data.CustomerNo != undefined) ? data.CustomerNo : '';
      $scope.$apply();
    });
  }
  getLogo();

  // Hardware Back buttons
  var deregisterFirst = $ionicPlatform.registerBackButtonAction(function() {
    $scope.goBack();
  }, 101);
  $scope.$on('$destroy', deregisterFirst);

});
