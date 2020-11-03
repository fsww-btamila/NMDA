app.service('commonService', function($q, appConstants, $rootScope, $localstorage, $filter) {
  /**
   * Convert a base64 string in a Blob according to the data and contentType.
   * @return Blob
   */
  this.b64toBlob = function(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];
    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);
      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  /* Create a PDF file according to its database64 content only.*/
  this.saveAttachments = function(type, config, callback, sdt) {
    var folderpath = window.cordova.file.externalRootDirectory;
    var self = this;
    config.data.attachmentAdded = true;
    console.log("type", type);
    if (type == "DT") {
      //Delivery Ticket
      var filename = config.data.offlineUrl;
      var thumbFileName = config.data.offlineThumb;
      var docData = config.data.offlineData;
      var base64 = config.data.offlineData;
      var OrderNo = config.data.OrderNo;

      var contentType = "application/pdf";
      let options = {
        documentSize: 'A4',
        type: 'base64',
        fileName: filename,
        thumbFileName: thumbFileName
      }
      /******************/
      /**** generate pdf *****/
      if (!sdt) {
        callback();
        self.savebase64AsPDF(folderpath, filename, base64, contentType, OrderNo);
      } else {
        self.savebase64AsPDF(folderpath, filename, base64, contentType, OrderNo, function() {
          callback();
        })
      }
      // pdf.fromData(docData, options)
      //   .then(function(base64) {
      //     config.data.data = base64;
      //     if(!sdt){
      //     callback();
      //     self.savebase64AsPDF(folderpath, filename, base64, contentType, OrderNo);
      //     }else{
      //       self.savebase64AsPDF(folderpath, filename, base64, contentType, OrderNo,function(){
      //         callback();
      //       })
      //     }
      //
      //   }).catch((err) => console.log('pdf cannot be generated', err));

    } else if (type == "MT") {
      //Meter Ticket
      var filename = config.data.requestData.MeterTicketData[0].offlineUrl;
      var thumbFileName = config.data.requestData.MeterTicketData[0].offlineThumb;
      var OrderNo = config.data.requestData.MeterTicketData[0].OrderNo;
      var dochtml = self.formMeterHtml(config.data.requestData.MeterTicketData);
      var docData = '<html><head>\
    	<style>\
       .flex-container{border:1px solid #000;height:auto;width:97%;background-color:transparent;margin:15px}.header-container{display:flex;border-bottom:1px solid #000;}.flex-item-contentL{justify-content:flex-start;align-content:flex-start;flex-grow:1;font-size:12px;margin:0 0 0 2px;}.flex-item-contentR{justify-content:flex-end;align-content:flex-end;margin:0 2px 0 0;}.flex-item-contentR>div{margin:5px 0px 5px 0px}.flex-meter-info{display:flex;-webkit-justify-content:space-around;justify-content:space-around;-webkit-flex-flow:row wrap;flex-flow:row wrap;-webkit-align-items:stretch;align-items:stretch;border-bottom:1px solid #000;height:60px}.flexitem-hdr1{flex-grow:1;text-align:center;margin:17px 0 0 0}.flexitem-hdr2{border-left:1px solid #000;flex-grow:1}.flex-item-contentR .text-right{float:right;margin-left:5px}.meter-reading{display:flex;border-bottom:1px solid #000;}.flexitem-r1{flex-grow:1;margin:0 0 0 2px;}.flexitem-r2{justify-content:flex-end;align-item:flex-end;margin:0 2px 0 0;}.flexitem-r2>div{text-align:right}.flexitem-r1>div{margin:7px 0 15px 0;font-size:16px;font-weight:700}.flexitem-r2>div{margin:7px 0 10px 0;font-size:19px;font-weight:700}.image-container{display:flex;-webkit-justify-content:space-around;justify-content:space-around;-webkit-flex-flow:row wrap;flex-flow:row wrap;-webkit-align-items:stretch;align-items:stretch}.attach-image{height:500px;width:600px}.fntR-item{font-weight:700;font-size:17px}section{display:flex;justify-content:center;flex-wrap:wrap}.media-container{min-width:0;margin:5px}.attach-image{width:750px;max-width:100%;max-height:750px}@media print{.flex-item-contentL{font-size: 18px;margin: 0 0 0 2px}.flexitem-r1>div{margin: 7px 0 15px 0;font-size: 16px;font-weight: 700}.flexitem-r2>div{margin: 7px 0 10px 0;font-size: 19px;font-weight: 700}.fntR-item{font-weight: 700;font-size: 17px}}\
    	</style>\
    	</head><body><div>';
      docData += dochtml + '</div></body></html>'; 
      var contentType = "application/pdf";
      let options = {
        documentSize: 'A4',
        type: 'base64',
        fileName: filename,
        thumbFileName: thumbFileName
      }
      /******************/
      /**** generate pdf *****/
      pdf.fromData(docData, options)
        .then(function(base64) {
          config.data.requestData.MeterTicketData[0].data = base64;
          callback();
          self.savebase64AsPDF(folderpath, filename, base64, contentType, OrderNo);
        }).catch((err) => console.log('pdf cannot be generated', err));

    } else if (type == "DOI") {
      //DOI
      var filename = config.data.offlineUrl;
      var thumbFileName = config.data.offlineThumb;
      var docData = config.data.offlineData;
      var OrderNo = config.data.OrderNo;
      var contentType = "application/pdf";
      let options = {
        documentSize: 'A4',
        type: 'base64',
        fileName: filename,
        thumbFileName: thumbFileName
      }
      /******************/
      /**** generate pdf *****/
      pdf.fromData(docData, options)
        .then(function(base64) {
          config.data.data = base64;
          callback();
          self.savebase64AsPDF(folderpath, filename, base64, contentType, OrderNo);
        }).catch((err) => console.log('pdf cannot be generated', err));

    } else if (type == "CAPTUREDOC") {
      // Notes Tab - Image Capture
      var data = config.data.requestData.Attachment[0];
      var filename = data.offlineUrl;
      var attachmentData = data.imageData;
      var OrderNo = data.OrderNo;
      var contentType = 'data:image/png;base64,';
      self.savebase64AsPDF(folderpath, filename, attachmentData, contentType, OrderNo);
      callback();
    } else {
      callback();
    }
  }

  this.savebase64AsPDF = function(folderpath, filename, content, contentType, OrderNo, callback) {
    var self = this;
    // Convert the base64 string in a Blob
    var DataBlob = self.b64toBlob(content, contentType);

    console.log("Starting to write the file :3");
    window.resolveLocalFileSystemURL(folderpath, function(path) {
      console.log("Access to the directory granted succesfully");
      path.getDirectory("Marine Attachments/", { create: true }, function(dir) {
        dir.getDirectory(OrderNo, { create: true }, function(orderDir) {
          var fpos = filename.lastIndexOf('/');
          var fn = filename.substring(fpos + 1);
          console.log("fn", fpos, '--', fn);
          orderDir.getFile(fn, { create: true }, function(file) {
            console.log("File created succesfully.");
            file.createWriter(function(fileWriter) {
              console.log("Writing content to file");
              fileWriter.write(DataBlob);
              if (callback) {
                callback();
              }
            }, function() {
              alert('Unable to save file in path ' + folderpath);
            });
          });
        });
      });
    });
  }

  this.formMeterHtml = function(obj) {
    var self = this;
    var obj = obj[0];

    var vesselName = $filter('unescape')(obj.vessel);
    var transfer = $filter('unescape')(obj.transfer);
    var itemNotes = $filter('unescape')(obj.itemNotes);
    var startMeter = obj.startMeter;
    var endMeter = obj.endMeter;
    var mQnty = self.numberWithCommas(obj.mQnty);

    var ticketNo = (obj.AttachmentNumber!='') ? `<div class="fntR-item">Ticket No &nbsp;: <span class="text-right" style="font-weight:normal;">${obj.AttachmentNumber}</span></div>` : '';

    var html = `<div class="flex-container">
        <div class="header-container">
            <div class="flex-item-contentL">
                <div style="margin-top:27px; ">${obj.itemDescr}</div>
            </div>
            <div class="flex-item-contentR">
                <div class="fntR-item">Order No &nbsp;&nbsp;: <span class="text-right" style="font-weight:normal;">${obj.OrderNo}</span></div>
                <div class="fntR-item">From Site &nbsp;: <span class="text-right" style="font-weight:normal;">${transfer}</span></div>
                ${ticketNo}
            </div>
        </div> 
        <div class="flex-meter-info">
            <div class="flexitem-hdr1" style="font-weight:bold; font-size:20px;">METER TICKET</div>
            <div class="flexitem-hdr2" style="width:200px;">
                <div style="margin-left: 5px; font-size;12px;">${vesselName}</div>
                <div style="margin-left: 5px; font-size;12px;">${itemNotes}</div>
            </div>
      </div> 
        <div class="meter-reading">
            <div class="flexitem-r1">
                <div>End Meter</div>
                <div>Start Meter</div>
                <div>METERED QUANTITY</div>
            </div>
            <div class="flexitem-r2">
                <div>${obj.endMeter}</div>
                <div>${obj.startMeter}</div>
                <div>${mQnty}&nbsp${obj.meterQtyLbl}</div>
            </div>
        </div>
        <section>
          <div class="media-container">
            <img class="attach-image" src=${obj.mImage}>
          </div>
        </section>  
    </div>`;
    return html;
  }


  this.formMeterHtmlOld = function(obj) {
    var self = this;
    var obj = obj[0];
    var vesselName = $filter('unescape')(obj.vessel);
    var transfer = $filter('unescape')(obj.transfer);
    var itemNotes = $filter('unescape')(obj.itemNotes); 
    var startMeter = obj.startMeter;
    var endMeter = obj.endMeter;
    var mQnty = self.numberWithCommas(obj.mQnty);

    var attachmentStr = (obj.AttachmentNumber!='') ? `<tr>
      <td>
      <div class="meter-info">
      <label>Ticket Number </label><span class="text-right">${obj.AttachmentNumber}</span> </div>
      </td>
      </tr>` : '';

    var html =`<table class="table" style="border: 1px solid #000;border-collapse: collapse;">
      <tr>
      <td colspan="3" align="right">
      <h3>Order ${obj.OrderNo} </h3></td>
      </tr>
      <tr>
      <td colspan="2" class="lft-side" width="200px">
      <h3>Meter Ticket</h3></td>
      <td>
      <table class="inner-tbl">
      <tbody>
      <tr class="maddr-hdr">
      <td><label> ${vesselName} </label></td>
      </tr>
      <tr class="maddr-hdr">
      <td><label> ${itemNotes} </label></td>
      </tr>
      <tr class="maddr-hdr">
      <td><label> ${transfer} </label></td>
      </tr>
      </tbody>
      </table>
      </div>
      </td>
      </tr>
      <tr>
      <td colspan="3">
      <table class="inner-tbl">
      <tbody>
      <tr class="minfo-hdr">
      <td>
      <div class="meter-info">
      <label>End Meter </label><span class="text-right"> ${endMeter} </span> </div>
      </td>
      </tr>
      <tr>
      <td>
      <div class="meter-info">
      <label>Start Meter </label><span class="text-right"> ${startMeter} </span> </div>
      </td>
      </tr>
        ${attachmentStr}
      </tbody>
      </table>
      </td> 
      </tr>
      <tr>
      <td colspan="2" class="lft-side" width="200px">
      <h3>Metered Quantity</h3>
      </td>
      <td>
      <div class="meter-gall">
      <label> ${mQnty}&nbsp${obj.meterQtyLbl} </label>
      </div>
      </td>
      </tr>
      <tr>
      <td colspan="3">
      <img class="attach-image" src=${obj.mImage}>
      </td>
      </tr>
      </table>`;
    return html;
  }
 
  this.numberWithCommas = function(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  /*
  .table {width: 40%;margin-bottom: 20px;background-color: transparent;border-collapse: collapse;border: 1px solid #000;margin: 30px;}.table tr td {border: 2px solid #000;font-size: 25px;padding: 8px;}.text-right {text-align: right;float: right;font-size:16px;}.meter-info {padding: 2px;margin: 0 0 0 5px;}.meter-gall {float: right;text-align: right;}.maddr-hdr {padding: 2px;width: 400px;float: right;}.minfo-hdr {padding: 2px;width: 500px;}.inner-tbl {width: 100%;}.inner-tbl tr td {border: none;}.lft-side {width: 500px;}.meter-info label,.maddr-hdr label,.meter-gall label {font-size: 17px;}.table .attach-image {height: 500px;width: 600px;}@media print{.table tr td {font-size: 25px;padding: 4px;}.meter-info label,.maddr-hdr label,.meter-gall label {font-size: 17px;}}
  */
  
});
