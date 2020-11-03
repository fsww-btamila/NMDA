var express = require('express');
var http = require("http");
var fs = require("fs");
var pdf = require("html-pdf");
var request = require('requestretry');
var dir = require('node-dir');
var pdf2png = require('pdf2png');
var azure = require('azure-storage');

var AZURE_STORAGE_ACCOUNT = 'fswwmarine';
var AZURE_STORAGE_ACCESS_KEY = 'iUDIk7ygzue9lzt8vStZiG7A9BYc3BhHRomPsbJzunQtIkvLX8vEO/6OC86QbdDExpQbX/bMU0AFASBfpE51Bw==';
var AZURE_URL = 'https://fswwmarine.blob.core.windows.net/order-data/';
var retryOperations = new azure.ExponentialRetryPolicyFilter();
var blobService = azure.createBlobService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY).withFilter(retryOperations);

var options = {
    format: 'Letter',
    border: {
        "top": "0.2in", // default is 0, units: mm, cm, in, px
        "right": "0.2in",
        "bottom": "0.2in",
        "left": "0.2in"
    },
    "height": "11in", // allowed units: mm, cm, in, px
    "width": "8.5in"
};

var completeHtml,
    div,
    html,
    ionicCss,
    bundledCss,
    posthead = "</style></head><body>",
    htmlend = "</body></html>";

if (!fs.existsSync('tmp')) { fs.mkdirSync('tmp'); }

function parameterize(val) {
    var parameter = {
        "params": [{
            "name": "JsonValue",
            "param_type": "IN",
            "value": JSON.stringify(val)
        }]
    };
    return JSON.stringify(parameter);
}

function uploadBlob(fileName, fileLocation, cb) {
    blobService.createBlockBlobFromLocalFile('order-data', fileName, fileLocation, function(error, result, response) {
        if (!error) {
            console.log(result.name + ' - Uploaded to Azure');
            if (cb) cb();
        } else {
            console.log('Upload Failed : ', error);
        }
    });
}

function uploadToAscend(httpURL, requestData) {
    console.log('ASCEND UPLOAD - httpURL - ', httpURL);
    var postHeaders = {
        'Content-Type': 'application/json'
    };
    fs.writeFile('tmp/request.txt',{
        'url':httpURL,
        'body':parameterize(requestData)            
        },function(err){
            console.log(err)   
            }
    )
    request.post({ url: httpURL, maxAttempts: 10, retryDelay: 180000, headers:postHeaders, body: parameterize(requestData) }, function optionalCallback(err, httpResponse, body) {
        if (err) { 
            console.error('upload failed:', err); 
        }
        if(httpResponse){
            console.log('The number of request attempts: ' + httpResponse.attempts);
        }

        console.log('Upload successful!  Server responded with:', body);
    });
}

function generateThumbnail(fileName, fileLocation, thumbFileLocation) {
    pdf2png.convert(fileLocation, { quality: 100 }, function(resp) {
        if (!resp.success) { return; }

        fs.writeFile(thumbFileLocation, resp.data, function(err) {
            if (err) { console.log(err); } else {
                uploadBlob(fileName, thumbFileLocation, success);
                // console.log("Thumbnail Created and Saved");
                function success() {
                    fs.unlink(thumbFileLocation, function(err) {
                        if (err) { console.log(err) } else {
                            // console.log('Temp Thumbnail Deleted');
                        }
                    });
                    // fs.unlink(fileLocation, function(err){
                    //   if(err){ console.log(err) }
                    //   else {
                    //     // console.log('Temp PDF Deleted');
                    //   }
                    // });
                }
            }
        });
    });

}

var app = express();

/*-------------------------------------------------------------- 
Doi PDF
/*--------------------------------------------------------------*/
app.post('/doi', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    dir.readFilesStream(__dirname + '/template/doiCss',
        function(err, stream, next) {
            if (err) throw err;
            var content = '';
            stream.on('data', function(buffer) {
                content += buffer.toString();
            });
            stream.on('end', function() {
                bundledCss += content;
                next();
            });
        },
        function(err, files) {
            if (err) throw err;
            fs.readFile('./template/index.html', function(err, reshtml) {
                if (err) throw err;
                html = decodeURIComponent(reshtml);
                var body = '';
                req.on('data', function(data) {
                    body += data;
                });

                req.on('end', function() {
                    body = JSON.parse(body);
                    var ticketName = body.ticketName;
                    var dTime = body.dTime;
                    //Set file path
                    var sourceFn = body.env + '/' + ticketName + '_' + dTime + '_DOI.pdf';
                    var sourceTHUMBNAIL = body.env + '/' + ticketName + '_' + dTime + '_DOI_THUMBNAIL.png';
                    var path = 'tmp/' + body.env + '/';
                    var fileLocation = path + ticketName + '_' + dTime + '_DOI.pdf';
                    var thumbLocation = path + ticketName + '_' + dTime + '_DOI.png';
                    var result = {
                        url: AZURE_URL + sourceFn,
                        thumbUrl: AZURE_URL + sourceTHUMBNAIL
                    };
                    res.end(JSON.stringify(result));
                    var httpURL = body.url;
                    // div = decodeURIComponent(body.data);
                    completeHtml = html + bundledCss + posthead + div + htmlend;
                    //Ascend Attachments Name
                    body.requestData.DoiData[0].AscFname = ticketName + '_DOI.pdf';
                    fs.writeFile('tmp/temphtml.html', completeHtml, function(err) {
                        if (err) { console.log(err) } else {
                            console.log('success');
                        }
                    });

                    var base64Data = body.data;

                    fs.writeFile(fileLocation, base64Data, 'base64', function(err) {
                        if (err) { console.log(err) } else {
                            uploadBlob(sourceFn, fileLocation);
                            generateThumbnail(sourceTHUMBNAIL, fileLocation, thumbLocation);

                            function base64_encode(file) {
                                var bitmap = fs.readFileSync(file);
                                return new Buffer(bitmap).toString('base64');
                            }

                            var base64str = base64_encode(fileLocation);
                            body.requestData.DoiData[0].DoiImg = base64str;
                            uploadToAscend(httpURL, body.requestData);

                        }
                    });

                });
            });
        }
    );
});
/*-------------------------------------------------------------- 
Delivery Ticket PDF
/*--------------------------------------------------------------*/
app.post('/deliveryTicket', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('end', function() {
        body = JSON.parse(body);
        var dTime = body.dTime;
        var orderNo = body.OrderNo;
        //Set file path
        var sourceFn = body.env + '/' + orderNo + '_' + dTime + '_DELIVERY_TICKET.pdf';
        var sourceTHUMBNAIL = body.env + '/' + orderNo + '_' + dTime + '_DELIVERY_TICKET_THUMBNAIL.png';
        var path = 'tmp/' + body.env + '/';
        var fileLocation = path + orderNo + '_' + dTime + '_DELIVERY_TICKET.pdf';
        var thumbLocation = path + orderNo + '_' + dTime + '_DELIVERY_TICKET.png';
        //Ascend Attachments Name
        var fname = orderNo + '_DELIVERY_TICKET.pdf';
        var result = {
            url: AZURE_URL + sourceFn,
            thumbUrl: AZURE_URL + sourceTHUMBNAIL
        };
        res.end(JSON.stringify(result));
        var httpURL = body.url;

        // var base64String =Buffer.from(body.data, 'base64');
        var base64Data = body.data;

        fs.writeFile(fileLocation, base64Data, 'base64', function(err) {
            if (err) { console.log(err) } else {
                uploadBlob(sourceFn, fileLocation);
                generateThumbnail(sourceTHUMBNAIL, fileLocation, thumbLocation);

                function base64_encode(file) {
                    var bitmap = fs.readFileSync(file);
                    return new Buffer(bitmap).toString('base64');
                }

                var base64str = base64_encode(fileLocation);
                var reqData = {
                    "DeliveryTicketData": [{
                        "DeliveryImage": base64str,
                        "OrderNo": orderNo,
                        "DeviceTime": body.DeviceTime,
                        "CustomerID": body.CustomerID,
                        "UserID": body.UserID,
                        "CompanyID": body.CompanyID,
                        "AscFname": fname
                    }]
                };
                uploadToAscend(httpURL, reqData);
            }
        });


    });
});

app.post('/attachmentImage', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('end', function() {
        body = JSON.parse(body);
        var result = {
            url: AZURE_URL + body.env + '/' + body.OrderNo + '/ATTACHMENT_' + body.name + '.jpg'
        };
        res.end(JSON.stringify(result));
        var path = 'tmp/' + body.env + '/';

        var tempAIData = new Buffer(body.attachmentData, 'base64');
        fs.writeFile(path + body.OrderNo + '_' + body.name + '_att.jpg', tempAIData, function(err) {
            if (err) { console.log(err) } else {
                uploadBlob(body.env + '/' + body.OrderNo + '/ATTACHMENT_' + body.name + '.jpg', path + body.OrderNo + '_' + body.name + '_att.jpg');
            }
        });

    });
});

app.post('/attachmentDoc', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('end', function() {
        body = JSON.parse(body);
        var data = body.requestData.Attachment[0];
        var orderNo = data.OrderNo;
        var attachData = data.Attachment;
        var type= data.type;
        var deviceAttachmentType= data.deviceAttachmentType;
        var path = 'tmp/' + body.env + '/';
        if(type==0){ 
            var name='';
            if(deviceAttachmentType==1001){
                name = data.resyncName;                
            }else{
                name = 'ATTACHMENT_'+data.name;                
            }
            
            console.log("name", name);
            var result = {
                url: AZURE_URL + body.env + '/' + orderNo + '/' + name + '.pdf',
                thumbUrl: AZURE_URL + body.env + '/' + orderNo + '/' + name + '_THUMBNAIL.png'
            };
            res.end(JSON.stringify(result));
            data.AscFname = orderNo + '-' + name + '.pdf';
            var httpURL = body.url;
            var tempADData = new Buffer(attachData, 'base64');
            fs.writeFile(path + orderNo + '_' + name + '.pdf', tempADData, function(err) {
                if (err) { console.log(err) } else {
                    uploadBlob(body.env + '/' + orderNo + '/' + name + '.pdf', path + orderNo + '_' + name + '.pdf');
                    generateThumbnail(body.env + '/' + orderNo + '/' + name + '_THUMBNAIL.png', path + orderNo + '_' + name + '.pdf', path + orderNo + '_' + name + '.png');
                    uploadToAscend(httpURL, body.requestData);

                }
            });


        }else{
            var name = data.resyncName;
            var result = {
                url: AZURE_URL + body.env + '/' + name + '.pdf',
                thumbUrl: AZURE_URL + body.env + '/' + name + '_THUMBNAIL.png'
            };
            res.end(JSON.stringify(result));
            data.AscFname = orderNo + '-' + name + '.pdf';
            var httpURL = body.url;
            var tempADData = new Buffer(attachData, 'base64');
            fs.writeFile(path + orderNo + '_' + name + '.pdf', tempADData, function(err) {
                if (err) { console.log(err) } else { 
                    uploadBlob(body.env + '/' + name + '.pdf', path + orderNo + '_' + name + '.pdf');
                    generateThumbnail(body.env + '/' + name + '_THUMBNAIL.png', path + orderNo + '_' + name + '.pdf', path + orderNo + '_' + name + '.png');
                    uploadToAscend(httpURL, body.requestData);

                }
            });
        }

    });
});
/*-------------------------------------------------------------- 
Meter Ticket PDF
/*--------------------------------------------------------------*/
app.post('/meterTicket', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    dir.readFilesStream(__dirname + '/template/doiCss',
        function(err, stream, next) {
            if (err) throw err;
            var content = '';
            stream.on('data', function(buffer) {
                content += buffer.toString();
            });
            stream.on('end', function() {
                bundledCss += content;
                next();
            });
        },
        function(err, files) {
            if (err) throw err;
            fs.readFile('./template/index.html', function(err, reshtml) {
                if (err) throw err;
                html = decodeURIComponent(reshtml);
                var body = '';
                req.on('data', function(data) {
                    body += data;
                });
                req.on('end', function() {
                    body = JSON.parse(body);
                    var meterData = body.requestData.MeterTicketData[0];
                    var orderNo = meterData.OrderNo;
                    var attchNo = meterData.AttachmentNumber;
                    var ticketName = meterData.ticketName;
                    var dTime = meterData.dTime;
                    //Set file path
                    var sourceFn = body.env + '/' + ticketName + '_' + dTime + '_METER_TICKET.pdf';
                    var sourceTHUMBNAIL = body.env + '/' + ticketName + '_' + dTime + '_METER_TICKET_THUMBNAIL.png';
                    var path = 'tmp/' + body.env + '/';
                    var fileLocation = path + ticketName + '_' + dTime + '_METER_TICKET.pdf';
                    var thumbLocation = path + ticketName + '_' + dTime + '_METER_TICKET.png';
                    var result = {
                        url: AZURE_URL + sourceFn,
                        thumbUrl: AZURE_URL + sourceTHUMBNAIL
                    };
                    res.end(JSON.stringify(result));
                    var httpURL = body.url;
                    // div = formMeterHtml(body.requestData.MeterTicketData);
                    completeHtml = html + bundledCss + posthead + decodeURIComponent(meterData.data) + htmlend;
                    //Ascend Attachments Name
                    meterData.AscFname = orderNo + '-' + attchNo + '_METER_TICKET.pdf';
                    fs.writeFile('tmp/temphtml.html', completeHtml, function(err) {
                        if (err) { console.log(err) } else {
                            console.log('success');
                        }
                    });

                    var base64Data = meterData.data;

                    fs.writeFile(fileLocation, base64Data, 'base64', function(err) {
                        if (err) { console.log(err) } else {
                            uploadBlob(sourceFn, fileLocation);
                            generateThumbnail(sourceTHUMBNAIL, fileLocation, thumbLocation);

                            function base64_encode(file) {
                                var bitmap = fs.readFileSync(file);
                                return new Buffer(bitmap).toString('base64');
                            }

                            var base64str = base64_encode(fileLocation);
                            meterData.MeterImage = base64str;
                            uploadToAscend(httpURL, body.requestData);
                        }
                    });
                });
            });
        }
    );
});

/*--------------------------------------------------------------
Notes PDF and Images
/*--------------------------------------------------------------*/
app.post('/notes', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    dir.readFilesStream(__dirname + '/template/doiCss',
        function(err, stream, next) {
            if (err) throw err;
            var content = '';
            stream.on('data', function(buffer) {
                content += buffer.toString();
            });
            stream.on('end', function() {
                bundledCss += content;
                next();
            });
        },
        function(err, files) {
            if (err) throw err;
            fs.readFile('./template/index.html', function(err, reshtml) {
                if (err) throw err;
                html = decodeURIComponent(reshtml);
                var body = '';
                req.on('data', function(data) {
                    body += data;
                });
                req.on('end', function() {
                    body = JSON.parse(body);
                    var myFormData = body.requestData.Attachment[0];
                    var dTime = myFormData.dTime;
                    var env = myFormData.env;
                    var OrderNo = myFormData.OrderNo;
                    var name = myFormData.name;
                    //Set file path
                    var sourceFn = env + '/' + OrderNo + '-' + name + '-' + dTime + '_Notes.pdf';
                    var sourceTHUMBNAIL = env + '/' + OrderNo + '-' + name + '-' + dTime + '_Notes_THUMBNAIL.png';
                    var path = 'tmp/' + env + '/';
                    var fileLocation = path + OrderNo + '-' + name + '-' + dTime + '_Notes.pdf';
                    var thumbLocation = path + OrderNo + '-' + name + '-' + dTime + '_Notes.png';
                    noetsDeviceImage(myFormData, res);
                    var result = {
                        url: AZURE_URL + sourceFn,
                        thumbUrl: AZURE_URL + sourceTHUMBNAIL
                    };
                    res.end(JSON.stringify(result));
                    var httpURL = body.url;
                    div = '<div class="notes-img"> <img class="nimg" src=' + myFormData.Attachment + '> </div>';
                    completeHtml = html + bundledCss + posthead + decodeURIComponent(div) + htmlend;
                    //Ascend Attachments Name
                    body.requestData.Attachment[0].AscFname = OrderNo + '-' + name +'_'+ dTime +'_Notes.pdf';
                    fs.writeFile('tmp/temphtml.html', completeHtml, function(err) {
                        if (err) { console.log(err) } else {
                            console.log('success');
                        }
                    });
 
                    pdf.create(completeHtml, options).toBuffer(function(err, buffer) {
                        if (err) throw err;

                        pdfDataString = buffer.toString('base64');
                        var tempDOIData = new Buffer(pdfDataString, 'base64');

                        fs.writeFile(fileLocation, tempDOIData, function(err) {
                            if (err) { console.log(err) } else {
                                uploadBlob(sourceFn, fileLocation);
                                generateThumbnail(sourceTHUMBNAIL, fileLocation, thumbLocation);
                            }
                        });
                        body.requestData.Attachment[0].Attachment = pdfDataString;
                        uploadToAscend(httpURL, body.requestData);
                    });
                });
            });
        }
    );
});

function noetsDeviceImage(body, res) {
    body = body;
    var env = body.env;
    var OrderNo = body.OrderNo;
    var attachmentData = getBase64Image(body.Attachment);
    var name = body.name;
    var dTime = body.dTime;
    var result = {
        url: AZURE_URL + env + '/' + OrderNo + '/ATTACHMENT_' + name +'_'+ dTime + '.jpg'
    };
    res.end(JSON.stringify(result));
    var path = 'tmp/' + body.env + '/';
    var tempAIData = new Buffer(attachmentData, 'base64');
    fs.writeFile(path + OrderNo + '_' + name +'_'+ dTime+  '_att.jpg', tempAIData, function(err) {
        if (err) { console.log(err) } else {
            uploadBlob(env + '/' + OrderNo + '/ATTACHMENT_' + name +'_'+ dTime+ '.jpg', path + OrderNo + '_' + name+'_'+ dTime+ '_att.jpg');
        }
    });
}

function getBase64Image(imgElem) {
    if (imgElem) {
        return imgElem.replace(/^data:image\/(png|jpg);base64,/, "")
    } else {
        return false;
    }
}

/*************************************************************/
/* Export MarineSales Database */
/*************************************************************/
app.post('/dumpData', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('end', function() {
        body = JSON.parse(body);
        var obj = body.requestData.dump[0];
        var dTime = obj.dTime;
        var file = obj.file;
        var SessionID = obj.SessionID;
        var User = obj.User;
        var fileName = (obj.type == 'json') ? 'OrdersMaster' : 'MarineSales';
        var fileType = (obj.type == 'json') ? 'json' : 'sql';
        var filePath = (obj.type == 'json') ? 'tmp/logs/' : 'tmp/logs/sql/';
        //Set file path
        var fileLocation = filePath + fileName + '_' + User + '_' + SessionID + '_' + dTime + '.' + fileType;

        fs.writeFile(fileLocation, file, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Dump has been snt to the srever.');
            }

        });
    });
    res.end();
});
/*************************************************************/
/* Ascend Notes(Attachment) from Ascend. */
/*************************************************************/
/*app.post('/AscendNotes', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('end', function() {
        body = JSON.parse(body);
     body = body.OrderAttachmentList[0];
        var env = body.env;
        var OrderNo = body.OrderNo;
        var attachmentData = getBase64Image(body.attachementData);
        var name = body.name;
        var type = body.type;
        var checkType = name.indexOf(".");
        var filename = '';
        if (checkType) {
            filename = name;
        } else {
            filename = name + type;
        }
        var uploadAzure = AZURE_URL + env + '/' + OrderNo + '/' + filename;
        var result = {
            url: uploadAzure
        };
        //res.end(JSON.stringify(result));
        var tempAIData = new Buffer(attachmentData, 'base64');
        var tempFn = 'tmp/' + OrderNo + '_' + filename;
        var severFn = env + '/' + OrderNo + '/' + filename;
        fs.writeFile(tempFn, tempAIData, function(err) {
            if (err) { console.log(err) } else {
                uploadBlob(severFn, tempFn, function() {
                    res.send(uploadAzure);
                });
                console.log("uploadAzure test", uploadAzure);
            }
        });
    });
});*/

/*************************************************************/
app.post('/UploadMdaDocument', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('end', function() {
        body = JSON.parse(body);
        var type = body.type;
        var typeName = body.typeName;
        var orderNo = body.OrderNo;
        var sysTrxNo = body.sysTrxNo;
        var docName = body.name;
        //Set file path
        var sourceFn = docName;
        var fileLocation = 'tmp/' + docName;
        var result = {
            url: AZURE_URL + sourceFn
        };
        res.end(JSON.stringify(result));
        var httpURL = body.url;

        var base64Data = body.data;
        fs.writeFile(fileLocation, base64Data, 'base64', function(err) {
            if (err) { console.log(err); } else {
                uploadBlob(sourceFn, fileLocation);
                var reqData = {
                    "DeliveryTicketData": [{
                        "DeliveryImage": body.data,
                        "OrderNo": orderNo,
                        "sysTrxNo": sysTrxNo,
                        "AscFname": docName,
                        "DocType":body.docType,
                        "AttachmentType":type,
                        "AttachmentName":typeName
                    }]
                };

                console.log("httpURL", httpURL);
                uploadToAscend(httpURL, reqData);
            }
        });


    });
});


app.post('/mdaPDF', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var body = '';
    req.on('data', function(data) {
        body += data;
    });
    req.on('end', function() {
        body = JSON.parse(body);

        console.log(body)
        let obj = body.requestData.data[0];
        let dTime = obj.dTime;
        let file = obj.requestData;
        let User = obj.User;
        let fileName = obj.fname;
        let fileType = 'txt';
        let filePath = 'tmp/logs/AttachmentMaster/';
        //Set file path
        let fileLocation = filePath + fileName +'_'+ User +'_'+ dTime + '.' + fileType;
        console.log(fileLocation);

        fs.writeFile(fileLocation, file, {flag:"a+"},  function(err) {
            if (err) {
                 console.log(err);
            }else{
              console.log('MDA Attachment request are writting success.');
            }

        });
    });
    res.end();
});

/*************************************************************/
app.get('/', function(req, res) {
    res.send("This is working")
});

app.listen(2994, function() {
    console.log('Node server running at port 2994!');
});