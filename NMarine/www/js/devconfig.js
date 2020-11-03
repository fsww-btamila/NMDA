http: //dreamfactory.firestreamonline.com/api/v2/MarineDeliveryQA/_proc/MN_GetOrdersmda?api_key=0c11a07299ece16aa4d023a1bea6710a615c983ba06aebca1340975a6955d163


    var config = {
        "appName": "Marine Delivery",
        "appVersion": "0.1",
        "customerId": "4108",
        "companyId": "01",
        "database": "Ascend_QA(Sam)",
        "env": "devqa",
        "baseUrl": "dreamfactory.firestreamonline.com/api/v2/MarineDeliveryQA",
        "wcfBaseUrl": "http://testDeliverystream.firestreamonline.com:8099/MarineDeliveryCloudWCF/Cloud.svc/",
        "baseProcedureUrl": "/_proc/",
        "baseTableUrl": "/_table/",
        "dreamFactoryApiKeySet": "api_key=0c11a07299ece16aa4d023a1bea6710a615c983ba06aebca1340975a6955d163",
        "procedureServices": {
            "login": "MN_GetLoginUser",
            "logout": "MN_UpdateLogOutDetails",
            "ClearUserSession": "MN_ClearUserSession",
            "getAllSites": "MN_GetINSite",
            "getAllCustomers": "MN_GetARShipTo",
            "getProducts": "MN_GetProducts",
            "getVessels": "MN_GetVessels",
            "getVehicles": "MN_GetVehicle",
            "getDrivers": "MN_GetDrivers",
            "getAllDestinations": "MN_GetMarineLoc",
            "saveOrder": "MN_UpdateOrders",
            "getAvailability": "MN_GetOnHandQty?",
            "getTanks": "MN_GetARShipToTank",
            "getSourceTanks": "MN_GetINSiteTank",
            "getAllDoiQus": "MN_GetDOIItems",
            "postDOI": "MN_UpdateDOI",
            "getShortcuts": "MN_GetProductSalesPLUButtons",
            "postShipment": "MN_UpdateShipmentDetails",
            "postDelivery": "MN_UpdateDeliveryDetails",
            "getVehicleCompartments": "MN_GetVehicleCompartments",
            "getVehicleSubCompartments": "MN_GetVehicleSubCompartments",
            "calcShipReading": "MN_CalcShipReading",
            "getContacts": "MN_GetShipToContacts",
            "postDeliveryTicket": "MN_UpdateDeliveryTicket",
            "postMeterTicket": "MN_UpdateMeterTicket",
            "getDocMessages": "MN_GetDocMessage",
            "postAttachment": "MN_UpdateAttachment",
            "getAttachments": "MN_GetCloudAttachment",
            "getAttachment": "MN_GetAttachmentFile",
            "deleteAttachment": "MN_DeleteCloudAttachment",
            "getActivityLog": "MN_Activity",
            "updateOrderStatus": "MN_UpdateOrderStatusHistory",
            "calcWeightVolumeQty": "MN_GetCalcWeightVolumeQty",
            "getTankSubCompartments": "MN_GetInSiteTankSubCompartments",
            "deleteOrder": "MN_DeleteOrder",
            "postAdHocVessel": "MN_UpdateAdHocVessel",
            "updateTankVolume": "MN_UpdateINSiteTankVolume",
            "getOredersNew": "MN_GetOrdersmdaNew",
            "getOrderNotes": "MN_GetOrderNotes",
            "updateOrderNote": "MN_UpdateOrderNotesFromApp",
            "updateCancelOrders": "MN_CancelOrders",
            "some": "newservice"
        },
        "tableServices": {},
        "filepath": "http://dreamfactory.firestreamonline.com/api/v2/files/images/",
        "wcfServices": {
            "getOrders": "GetOrders",
            "getOrdersHistory": "GetOrderHistory",
            "getOrderNo": "GetOrderNo"
        },
        "nodeURL": "http://108.161.134.29:2994/",
        "nodeConfig": {
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8;"
            }
        },
        "doiData": [{
                "ID": "47",
                "DOIText": "Vessel security moored? [156. 120 (a)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "48",
                "DOIText": "Safe access between vessel and shore?",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "49",
                "DOIText": "Vessel ready to move under own power?",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "50",
                "DOIText": "Adequate personnel supervision in terminal and/or vessel? [156. 120 (o) (s)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "51",
                "DOIText": "Agreed vessel/shore communication system operative? [156. 120 (p)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "52",
                "DOIText": "Cargo, bunker, ballast, handling procedures agreed upon? [156.120 (g)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "53",
                "DOIText": "Emergency shut down procedures agreed upon? [156. 120 (n)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "54",
                "DOIText": "Fire fighting equipment on board/ on dock ready for immediate use?",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "55",
                "DOIText": "Oil transfer hoses/ arms good condition, adequate length, properly rigged? [156. 120 (b) (c) (h) 156. 170 ]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "56",
                "DOIText": "Scuppers plugged/containment adequate at vessel/shore manifolds? [156. 120 (j) (k) (l)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "57",
                "DOIText": "Unused cargo/bunker lines (stern line if fitted) blanked? [156. 120 (e)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "58",
                "DOIText": "Overboard discharge/sea suction valves not in use closed and sealed? [156. 120 (g)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "59",
                "DOIText": "All cargo/ bunker/ballast tank lids closed?",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "60",
                "DOIText": "Agreed tank venting system being used?",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "61",
                "DOIText": "Portable VHF/UHF transceivers approved type?",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "62",
                "DOIText": "Smoking requirements being observed? [35.35.30]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "63",
                "DOIText": "Requirements for boiler/galley fires/cooking appliances being observed? [35.35.30]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "64",
                "DOIText": "Naked light requirements being observed? [35.35.30]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "65",
                "DOIText": "Warning signs and red warning signals displayed? [35.35.30]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "66",
                "DOIText": "Each part transfer system necessary allow flow of oil lined up? [156. 120 (d)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "67",
                "DOIText": "Transfer system connected to fixed piping? [156. 120 (f)]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "68",
                "DOIText": "Connections correctly made? [156. 130]",
                "deliverySignature": "",
                "receiverSignature": ""
            },
            {
                "ID": "69",
                "DOIText": "All pre-transfer requirements been met? [156 .120 (g)]",
                "deliverySignature": "",
                "receiverSignature": ""
            }
        ],
        "version": "2.9",
        "source": "ordersNew"
    }