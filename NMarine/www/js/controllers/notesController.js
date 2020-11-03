app.controller('notesController', function($scope, $rootScope, $cordovaCamera, $ionicPopup, $ionicModal, $fileFactory, $cordovaFileTransfer, $cordovaFile, $ionicPlatform, addOrderService, appConstants, $cordovaFileOpener2, dbService, $http, $timeout, ordersListService, $filter) {
  if (!$scope.OrderList.Orders.OrderHdr.OrderNotes) {
    $scope.OrderList.Orders.OrderHdr.OrderNotes = [];
  }
  if (!$scope.OrderList.Orders.OrderHdr.OrderActivityLogs) {
    $scope.OrderList.Orders.OrderHdr.OrderActivityLogs = [];
  }
  $scope.orderNotes = {};
  angular.forEach($scope.orderNotes, function(val, key) {
    val.Note = val.Note.replace(/\\r\\n/g, "\n");
  });
  $scope.editingId = null;

  if ($scope.OrderList.Orders.OrderHdr.PONo) {
    $scope.poNew = $scope.OrderList.Orders.OrderHdr.PONo;
  } else {
    $scope.poNew = '';
  }

  $scope.getNotes = function() {
    $scope.orderNotes = [];
    $scope.odrNoAttArr = [];
    if ($rootScope.isInternet && $rootScope.online) {
      ordersListService.getOrderNotes($scope.OrderList.Orders.OrderHdr.SysTrxNo).then(function(response) {
        var getNotes = response.data[0];
        var getNotesAttch = response.data[1];
        $scope.orderNoteLen = getNotes.length;
        if (getNotes) {
          angular.forEach(getNotes, function(value, key) {
            if (value && !value.NoteNo) {
              value.NoteNo = key;
            }
            if (value && value.Note && value.IsDeleted == 0) {
              value.Note = value.Note;
              $scope.orderNotes.push(value);
            }
          });
        }
        /* Ascend Notes and Attachments */
        angular.forEach(getNotesAttch, function(value, key) {
          var filename, fileExtension;
          var valArr = {};
          if (value.AzureFilePath && value.FileName) {
            valArr.dataURL = value.AzureFilePath;
            valArr.dataThumb = value.AzureFilePath;
            valArr.name = value.FileName;
            valArr.type = "P";
            if (value.FileName) {
              fileExtension = value.FileName.replace(/^.*\./, ''); // USING JAVASCRIPT REGULAR EXPRESSIONS.
              valArr.checkExt = $scope.checkExtension(fileExtension);
            }
            if (valArr.dataURL != null) {
              $scope.odrNoAttArr.push(valArr);
            }
          }
        });
        if ($scope.orderNotes.length > 0) {
          $scope.OrderList.Orders.OrderHdr.OrderNotes = $scope.orderNotes;
        }
        if ($scope.odrNoAttArr.length > 0) {
          $scope.OrderList.Orders.OrderHdr.orderNotesAttachment = $scope.odrNoAttArr;
        }
      });
    } else {
      $scope.orderNotes = $scope.OrderList.Orders.OrderHdr.OrderNotes;
    }
  }
  $scope.getNotes();

  $scope.addNote = function(note) {
    if (note != '' && note != undefined) {
      note = $scope.rTrim(note);
      var newNote = {};
      newNote.SysTrxNo = $scope.OrderList.Orders.OrderHdr.SysTrxNo;
      newNote.NoteId = 0;
      // newNote.NoteNo = ($scope.orderNoteLen != 0) ? $scope.orderNoteLen + 1 : 1;
      newNote.NoteNo = Math.floor(Math.random() * (999999 - 100000) + 100000);
      newNote.CompanyID = $rootScope.CompanyID;
      newNote.ClientID = $scope.OrderList.Orders.OrderHdr.CustomerID;
      newNote.Note = note;
      newNote.IsDeleted = 0;
      newNote.User = ($rootScope.loginData != undefined) ? $rootScope.loginData.uname : 'Username';
      newNote.DtTm = $rootScope.getCurrentDateTime();
      $scope.orderNotes.push(newNote);
      $scope.OrderList.Orders.OrderHdr.OrderNotes = $scope.orderNotes;
      $scope.noteNew = '';
      dbService.upsertOrder($scope.OrderList.Orders, function() {});
      ordersListService.updateOrderNote(newNote).then(function(response) {
        //$scope.getNotes();
      });
    }
  }

  $scope.deleteNote = function(note) {
    $scope.editNote(note, 2);
    note.IsDeleted = 1;
    if (!$scope.editing) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Delete Note',
        template: 'Are you sure to delete this note?',
        cssClass: 'modal-backdrop',
        okText: 'Yes',
        cancelText: 'No'
      });
      confirmPopup.then(function(res) {
        if (res) {
          ordersListService.updateOrderNote(note).then(function(response) {
            // $scope.getNotes(); 
          });
          var index = $scope.orderNotes.indexOf(note);
          if (index > -1) {
            $scope.orderNotes.splice(index, 1);
            angular.forEach($scope.orderNotes, function(value, key) {
              value.NoteNo = key + 1;
              value.IsDeleted = 1;
            });
          }
        }
        $scope.OrderList.Orders.OrderHdr.OrderNotes = $scope.orderNotes;
      });
    }
  }

  $scope.editNote = function(note, flag) {
    note.Note = $scope.rTrim(note.Note);
    note.Note = note.Note;
    $scope.newText = note.Note;
    if (flag == 1) {
      $scope.editingId = note.NoteNo;
      $scope.editing = true;
    } else {
      $scope.editingId = null;
      $scope.editing = false;
    }
  }

  $scope.saveEdit = function(note, newText) {
    note.Note = $scope.rTrim(newText);
    note.Note = note.Note;
    note.CompanyID = $rootScope.CompanyID;
    note.ClientID = note.CustomerID;
    note.IsDeleted = 0;
    if (note.$$hashKey)
      delete note.$$hashKey;
    ordersListService.updateOrderNote(note).then(function(response) {
      // $scope.getNotes();
    });
    $scope.editingId = null;
    $scope.editing = false;
  }

  $scope.hideCheckMark = function(note, newText) {
    if (newText.length != 0) {
      $scope.noteDisable = false;
    } else {
      $scope.noteDisable = true;
    }
  }

  /*PO Number added Order Header Level*/
  $scope.addPONo = function(pono) {
    if (pono != '' && pono != undefined) {
      pono = $scope.rTrim(pono);
      $scope.poNew = pono;
    }
  }

  $scope.editPoNo = function(po, flag) {
    $scope.poNewText = $scope.rTrim(po);
    $scope.poNewText = $scope.poNewText;
    if (flag == 1) {
      $scope.poEditingId = $scope.poNewText;
    } else {
      $scope.poEditingId = null;
    }
  }


  $scope.savePOEdit = function(poVal) {
    var getPoNo = $scope.rTrim(poVal);
    $scope.poNew = poVal;
    $scope.poEditingId = null;
    $scope.OrderList.Orders.OrderHdr.PONo = getPoNo;
  }

  $scope.poHideCheckMark = function(poOldval, poVal) {
    if (poVal.length != 0) {
      $scope.poNoDisable = false;
    } else {
      $scope.poNoDisable = true;
    }
  }

  // addOrderService.getAttachments(appConstants.customerId, $scope.OrderList.Orders.OrderHdr.OrderNo).then(function(res) {
  //     $scope.attachments = res.data;
  // });
  $scope.getLogs = function() {
    if ($rootScope.isInternet && $rootScope.online) {
      addOrderService.getActivityLog(appConstants.customerId, $scope.OrderList.Orders.OrderHdr.OrderNo).then(function(res) {
        $scope.aLogs = res.data;

        angular.forEach($scope.aLogs, function(value, key) {
          value.DtTm = new Date(value.DtTm);
        });
        if ($scope.OrderList.Orders.OrderHdr.OrderAttachment != undefined) {
          angular.forEach($scope.OrderList.Orders.OrderHdr.OrderAttachment, function(value, key) {
            angular.forEach($scope.aLogs, function(val, k) {
              if (val.ID == value.id) {
                val.path = value.path;
                val.data = value.data;
                val.type = value.type;
              }
            });
          });
        }
      });
    } else {
      if ($scope.OrderList.Orders.OrderHdr.OrderActivityLogs) {
        $scope.aLogs = $scope.OrderList.Orders.OrderHdr.OrderActivityLogs;
      }
    }
  }

  $scope.getLogs();

  $scope.captureDoc = function() {
    var options = {
      quality: 100,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.CAMERA,
      allowEdit: true,
      encodingType: Camera.EncodingType.JPEG,
      saveToPhotoAlbum: false,
      height: 800,
      width: 800
    };
    $scope.userOnline = $rootScope.online;
    $cordovaCamera.getPicture(options).then(function(imageData) {
      $scope.newDoc = {};
      $scope.attachedDocument = [];
      $scope.newDoc.id = Math.floor(Math.random() * (999999 - 100000) + 100000);
      $scope.newDoc.dateTime = new Date();
      $scope.newDoc.type = "CAPTUREDOC";

      var myPopup = $ionicPopup.show({
        template: '<md-input-container class="md-block" flex-gt-sm>\
		<label>Attachment Name</label>\
		<input ng-model="newDoc.name">\
		</md-input-container>',
        title: 'Enter Attachment Name',
        subTitle: '',
        cssClass: 'modal-backdrop',
        scope: $scope,
        buttons: [{
          text: 'Cancel',
          type: 'popclose',
          onTap: function(e) {
            return false;
          }
        }, {
          text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.newDoc.name) {
              e.preventDefault();
            } else {
              $rootScope.loading = true;
              return true;
            }
          }
        }]
      });
      myPopup.then(function(res) {
        if (res == true) {
          var formIMData = "data:image/jpg;base64," + imageData;
          var currentDate = new Date();
          $scope.currDate = moment(currentDate).format("YYYY-MM-DD");
          $scope.currHours = moment(currentDate).format("HH-mm-ss-A");
          $scope.currDT = $scope.currDate + '_' + $scope.currHours;
          setTimeout(function() {
            $rootScope.online = $scope.userOnline;
          }, 30);
          var localFilePath = $rootScope.DevicePath + $scope.OrderList.Orders.OrderHdr.OrderNo + '/';
          var imageUrl = localFilePath + $scope.OrderList.Orders.OrderHdr.OrderNo + '_ATTACHMENT_' + $scope.newDoc.name + '_' + $scope.currDT + '.png';
          var reqData = {
            "Attachment": [{
              "env": appConstants.env,
              'OrderNo': $scope.OrderList.Orders.OrderHdr.OrderNo,
              'SysTrxNo': $scope.OrderList.Orders.OrderHdr.SysTrxNo,
              "DeviceTime": $rootScope.getCurrentDateTime(),
              "CustomerID": appConstants.customerId,
              "Attachment": formIMData,
              "AttachmentID": $scope.newDoc.id,
              "UserID": $rootScope.loginData.uname,
              "name": $scope.newDoc.name,
              "dTime": $scope.currDT,
              "Attachment_name": $scope.newDoc.name,
              "CompanyID": $rootScope.CompanyID,
              "offlineUrl": imageUrl,
              "imageData": imageData

            }]
          };

          var config = {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
            },
            timeout: 60000
          };
          var data = {
            url: appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postAttachment + "?" + appConstants.dreamFactoryApiKeySet,
            requestData: reqData,
            OrderNo: $scope.OrderList.Orders.OrderHdr.OrderNo,
            type: "CAPTUREDOC"
          };

          /* Offline Notes Attachement */
          var url = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.OrderList.Orders.OrderHdr.OrderNo + '/ATTACHMENT_' + $scope.newDoc.name + '_' + $scope.currDT + '.jpg';
          $scope.newDoc.OrderNo = $scope.OrderList.Orders.OrderHdr.OrderNo;
          $scope.newDoc.SysTrxNo = $scope.OrderList.Orders.OrderHdr.SysTrxNo;
          $scope.newDoc.dataURL = url;
          $scope.newDoc.dataThumb = url;
          $scope.newDoc.offlineUrl = imageUrl;
          $scope.newDoc.offlineThumb = imageUrl;
          $scope.newDoc.dTime = $scope.currDT;
          $scope.newDoc.UserID = $rootScope.loginData.uname;
          $scope.newDoc.imageType = 100;

          $scope.attachedDocument.push($scope.newDoc);
          if ($scope.OrderList.Orders.OrderHdr.OrderAttachment == undefined) {
            $scope.OrderList.Orders.OrderHdr.OrderAttachment = $scope.attachedDocument;
          } else {
            $scope.OrderList.Orders.OrderHdr.OrderAttachment = $scope.OrderList.Orders.OrderHdr.OrderAttachment.concat($scope.attachedDocument);
          }
          /* Offline Activity Logs */
          if (!$rootScope.isInternet || !$rootScope.online) {
            var formActivityData = {};
            formActivityData.DtTm = moment(currentDate).format("YYYY-MM-DD HH:mm");
            formActivityData.ID = 2;
            formActivityData.Type = 'Attachment Added - ' + $scope.newDoc.name;
            formActivityData.UserID = $rootScope.loginData.uname;
            if ($scope.OrderList.Orders.OrderHdr.OrderActivityLogs)
              $scope.OrderList.Orders.OrderHdr.OrderActivityLogs.push(formActivityData);
          }

          $rootScope.showNodeLoader();
          $http.post(appConstants.nodeURL + 'notes', data, config).success(function(res) {
            $rootScope.hideNodeLoader();
            $rootScope.loading = false;;
            $scope.getLogs();
          }).error(function(err) {
            $rootScope.hideNodeLoader();
            $rootScope.showToastMessage("ERR - Attachment not added");
            console.log('err', err);
          });
        }
      });

    }, function(err) {
      console.log('err', err);
    });
  }

  $scope.deleteDoc = function(doc) {
    if ($scope.OrderList.Orders.OrderHdr.StatusCode == 'D') {
      $ionicPopup.alert({
        title: 'Alert!',
        template: "Cannot delete attachments after order is delivered!"
      });
    } else {
      if (doc.type != "P") {
        var confirmPopup = $ionicPopup.confirm({
          title: 'Delete Attachment',
          template: 'Are you sure you want to delete this attachment?',
          cssClass: 'modal-backdrop',
          okText: 'Yes',
          cancelText: 'No'
        });

        confirmPopup.then(function(res) {
          if (res) {
            var index = $scope.OrderList.Orders.OrderHdr.OrderAttachment.indexOf(doc);
            if (index > -1) {
              $scope.OrderList.Orders.OrderHdr.OrderAttachment.splice(index, 1);
            }
            addOrderService.deleteAttachment(doc.id, $scope.OrderList.Orders.OrderHdr.OrderNo).then(function(res) {
              $scope.getLogs();
            });
            $scope.closeModal('image');
          } else {
            $scope.swiped = false;
          }
        });
      }
    }
  }

  $ionicModal.fromTemplateUrl('my-modal.html', {
    scope: $scope,
    animation: 'none',
    backdropClickToClose: true
  }).then(function(modal) {
    $scope.imageViewModal = modal;
  });

  $ionicModal.fromTemplateUrl('file-picker.html', {
    scope: $scope,
    animation: 'none',
    backdropClickToClose: true
  }).then(function(modal) {
    $scope.filePickerModal = modal;
  });

  $scope.openModal = function(modal, doc) {
    if (modal == 'file') {
      $scope.filePickerModal.show();
    } else {
      $scope.displayDoc = doc;
      var url = '';
      if (!$rootScope.isInternet || !$rootScope.online) {
        url = doc.offlineUrl;
      } else {
        url = doc.dataURL;
      }
      if (doc.type == "P" || doc.type == "CAPTUREDOC" || doc.type == "DeviceAttachment") {
        window.cordova.plugins.FileOpener.openFile(url, function(res) {
		      console.log("rers", res);
        }, function(err) {
          window.cordova.plugins.FileOpener.openFile(doc.offlineUrl, function(res) {
		        console.log("rers", res);
          }, function(err) {
            $ionicPopup.alert({
              title: 'Alert!',
              template: "ERROR OCCURRED - Could not open the PDF Document"
            });
          });
        });
      }

      if (doc.type == "I") {
        $scope.imageViewModal.show();
      }
    }
  };

  $scope.closeModal = function(modal) {
    if (modal == 'file') {
      $scope.filePickerModal.hide();
    } else {
      $scope.imageViewModal.hide();
    }
  };

  if (window.cordova) {
    var fs = new $fileFactory();
    var path = window.cordova.file.externalRootDirectory;
    $ionicPlatform.ready(function() {
      fs.getEntries(path).then(function(result) {
          $scope.files = result;
        }),
        function(error) {
          console.log(error);
        };
      $scope.getContents = function(file) {
        if (file.isFile) {
          var name = file.name;
          var fileName = file.nativeURL.split('/').pop();
          var fileType = fileName.split('.').pop();
          var path = file.nativeURL.replace(fileName, '');
          fileType = fileType.toLowerCase();
          var filePath = $scope.urldecode(path) + fileName;
          if (fileType == 'pdf') {
            $scope.attachedDocument = [];
            $scope.newDoc = {};
            $scope.newDoc.id = Math.floor(Math.random() * (999999 - 100000) + 100000);
            $scope.newDoc.name = name.replace('.pdf', '').replace('.PDF', '');
            $scope.newDoc.dateTime = new Date();
            $scope.newDoc.type = "DeviceAttachment";
            $cordovaFile.readAsDataURL(path, encodeURI(fileName)).then(function(fileData) {

              $rootScope.showNodeLoader();
              /* Offline AttachmentDoc   */
              var url = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.OrderList.Orders.OrderHdr.OrderNo + '/ATTACHMENT_' + $scope.newDoc.name + '.pdf';
              var thumbUrl = appConstants.offlineAttachPath + appConstants.env + '/' + $scope.OrderList.Orders.OrderHdr.OrderNo + '/ATTACHMENT_' + $scope.newDoc.name + '_THUMBNAIL.png';
              $scope.newDoc.OrderNo = $scope.OrderList.Orders.OrderHdr.OrderNo;
              $scope.newDoc.SysTrxNo = $scope.OrderList.Orders.OrderHdr.SysTrxNo;
              $scope.newDoc.dataURL = url;
              $scope.newDoc.offlineUrl = filePath;
              $scope.newDoc.dataThumb = thumbUrl;
              $scope.newDoc.deviceAttachmentType = 1001;
              $scope.attachedDocument.push($scope.newDoc);
              if ($scope.OrderList.Orders.OrderHdr.OrderAttachment == undefined) {
                $scope.OrderList.Orders.OrderHdr.OrderAttachment = $scope.attachedDocument;
              } else {
                $scope.OrderList.Orders.OrderHdr.OrderAttachment = $scope.OrderList.Orders.OrderHdr.OrderAttachment.concat($scope.attachedDocument);
              }
              /* Offline Activity Logs */
              if (!$rootScope.isInternet || !$rootScope.online) {
                var formActivityData = {};
                formActivityData.DtTm = moment($scope.newDoc.dateTime).format("YYYY-MM-DD HH:mm");
                formActivityData.ID = 3;
                formActivityData.Type = 'Attachment Added - ' + $scope.newDoc.name;
                formActivityData.UserID = $rootScope.loginData.uname;
                $scope.OrderList.Orders.OrderHdr.OrderActivityLogs.push(formActivityData);
              }
              var config = {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                },
                timeout: 40000
              };

              nFileData = fileData.replace('data:application/pdf;base64,', '');
              var reqData = {
                "Attachment": [{
                  "name": $scope.newDoc.name,
                  "OrderNo": $scope.OrderList.Orders.OrderHdr.OrderNo,
                  'SysTrxNo': $scope.OrderList.Orders.OrderHdr.SysTrxNo,
                  "Attachment_name": fileName,
                  "DeviceTime": $rootScope.getCurrentDateTime(),
                  "CustomerID": appConstants.customerId,
                  "Attachment": nFileData,
                  "AttachmentID": $scope.newDoc.id,
                  "UserID": $rootScope.loginData.uname,
                  "CompanyID": $rootScope.CompanyID,
                  "offlineUrl": filePath,
                  "type": 0
                }]
              };
              var data = {
                url: appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postAttachment + "?" + appConstants.dreamFactoryApiKeySet,
                env: appConstants.env,
                requestData: reqData
              };

              $http.post(appConstants.nodeURL + 'attachmentDoc', data, config)
                .success(function(res) {
                  $rootScope.hideNodeLoader();
                })
                .error(function(err) {
                  $rootScope.hideNodeLoader();
                  $rootScope.showToastMessage("ERR - Attachment not added");
                  console.log('err', err);
                });

              // $rootScope.uploadPDF($scope.newDoc.id, fileName, nFileData, $scope.OrderList.Orders.OrderHdr);
            }, function(error) {
              console.log(error);
              var msg = (error.message == "NOT_FOUND_ERR") ? 'File Not Found!' : 'File Not Found!';
              var alertPopup = $ionicPopup.alert({
                title: 'Alert!',
                template: msg
              });
            });
            $scope.closeModal('file');
          } else {
            var alertPopup = $ionicPopup.alert({
              title: 'Alert!',
              template: 'Please select only PDF files'
            });
          }
        } else {
          fs.getEntries(file.nativeURL).then(function(result) {
            $scope.files = result;
            $scope.files.unshift({ name: "[parent]" });
            fs.getParentDirectory(file.nativeURL).then(function(result) {
              result.name = "[parent]";
              $scope.files[0] = result;
            });
          });
        }
      }
    });
  }
  $scope.checkExtension = function(ext) {
    var fileExtension = '';
    switch (ext) {
      case 'png':
      case 'jpeg':
      case 'jpg':
        fileExtension = ext;
        break;
      case 'html':
      case 'htm':
        fileExtension = ext;
      case 'txt':
        fileExtension = ext;
      case 'doc':
        fileExtension = ext;
      case 'xlsx':
      case 'xls':
        fileExtension = ext;
      case 'pdf':
        fileExtension = ext;
        break;
      default:
        fileExtension = null;
    }
    return fileExtension;
  }

  $scope.urldecode = function(url) {
    return decodeURIComponent(url.replace(/\+/g, ' '));
  }
  /* Resync Images,MeterPdf,Doi,Delivery ticket and Device attatchment */
  /* Here imageType==100 it represnts device capture images and resend to ascend as well as azure*/
  /* Here deviceAttachmentType==1001 it represnts device Pdf Attachment and resend to ascend as well as azure*/
  $scope.fileUploadAscendAzure = function(objData) {
    var path = objData.offlineUrl;

    getFileContentAsBase64(path, function(data) {
      var docID = objData.id || Math.floor(Math.random() * (999999 - 100000) + 100000);

      $rootScope.showNodeLoader();

      var config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        },
        timeout: 40000
      };
      var resyncName = objData.dataURL.split("/").pop();
      if (objData.imageType == 100) {
        fileData = data.replace('data:image/jpg;base64,', '');
        resyncName = resyncName.replace('.png', '');
      } else {
        fileData = data.replace('data:application/pdf;base64,', '');
        resyncName = resyncName.replace('.pdf', '').replace('.PDF', '');
      }
      var type = 1;
      if (objData.deviceAttachmentType == 1001) {
        type = 0;
      }
      var reqData = {
        "Attachment": [{
          "name": objData.name,
          "Attachment_name": objData.name,
          "resyncName": resyncName,
          "OrderNo": objData.OrderNo,
          'SysTrxNo': objData.SysTrxNo,
          "DeviceTime": $rootScope.getCurrentDateTime(),
          "CustomerID": appConstants.customerId,
          "Attachment": fileData,
          "AttachmentID": docID,
          "UserID": $rootScope.loginData.uname,
          "CompanyID": $rootScope.CompanyID,
          "dTime": objData.dTime,
          "env": appConstants.env,
          "type": type,
          "uploadAzure": objData.uploadAzure
        }]
      };

      if (objData.deviceAttachmentType == 1001) {
        reqData.Attachment[0].deviceAttachmentType = objData.deviceAttachmentType;
      }
      if (objData.imageType == 100) {
        var data = {
          url: appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postAttachment + "?" + appConstants.dreamFactoryApiKeySet,
          env: appConstants.env,
          requestData: reqData
        };
        $http.post(appConstants.nodeURL + 'notes', data, config).success(function(res) {
          $rootScope.hideNodeLoader();
          $scope.getLogs();
        }).error(function(err) {
          $rootScope.hideNodeLoader();
          $rootScope.showToastMessage("ERR - Attachment not added");
          console.log('err', err);
        });
      } else {
        var data = {
          url: appConstants.baseUrl + appConstants.baseProcedureUrl + appConstants.procedureServices.postAttachment + "?" + appConstants.dreamFactoryApiKeySet,
          env: appConstants.env,
          requestData: reqData
        };

        $http.post(appConstants.nodeURL + 'attachmentDoc', data, config)
          .success(function(res) {
            $rootScope.hideNodeLoader();
          })
          .error(function(err) {
            $scope.uploadingDoc = false;
            $rootScope.hideNodeLoader();
            $rootScope.showToastMessage("ERR - Attachment not added");
            console.log('err', err);
          });
      }
    });
  }


  function getFileContentAsBase64(path, callback) {
    window.resolveLocalFileSystemURL(path, gotFile, fail);

    function fail(e) {
      $ionicPopup.alert({
        title: 'Alert!',
        template: "Cannot find requested file"
      });
    }

    function gotFile(fileEntry) {
      fileEntry.file(function(file) {
        var reader = new FileReader();
        reader.onloadend = function(e) {
          var content = this.result;
          callback(content);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  /* Orders trim here */
  $scope.rTrim = function(str) {
    if (str != '' && str != null && str != undefined) {
      var trimmed = str.replace(/\s+$/g, '');
      return trimmed;
    }
  }

});
