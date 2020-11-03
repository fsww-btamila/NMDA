/****************
Test Config JS
*****************/

var config = {
    'appName': 'Marine Delivery',
    'appVersion': '0.1',
    'customerId': '4108',
    'companyId': '01',
    'database': 'Ascend_Test',
    'baseUrl': 'http://devdreamfactory.firestreamonline.com/api/v2/MarineDelivery',
    // 'baseUrl': 'http://dreamfactory.firestreamonline.com/api/v2/MarineDeliveryProd',
    // 'wcfBaseUrl': 'http://208.96.32.150:8099/TWCloudWCF/Cloud.svc/',
    'wcfBaseUrl': 'http://testdeliverystream.firestreamonline.com:8099/MarineDeliveryCloudWCFProd/Cloud.svc/',
    'baseProcedureUrl': '/_proc/',
    'baseTableUrl': '/_table/',
    // 'dreamFactoryApiKeySet': 'api_key=ad2319d4c8037c5b11cb49d9dbf3f49e5e8b5d8aa965486a3b9c290991f2dfde',
    'dreamFactoryApiKeySet': 'api_key=ab2caf27537309975a2c39c42b0989397604afeca4c25d560ebeeba343443996',
    'procedureServices': {
        'login': 'MN_GetLoginUser',
        'getAllSites': 'MN_GetINSite',
        'getAllCustomers': 'MN_GetARShipTo',
        'getProducts': 'MN_GetProducts',
        'getVessels': 'MN_GetVessels',
        'getVehicles': 'MN_GetVehicle',
        'getDrivers': 'MN_GetDrivers',
        'getAllDestinations': 'MN_GetMarineLoc',
        'saveOrder': 'MN_UpdateOrders',
        'getAvailability': 'MN_GetOnHandQty?',
        'getTanks': 'MN_GetARShipToTank',
        'getSourceTanks': 'MN_GetINSiteTank',
        'getAllDoiQus': 'MN_GetDOIItems',
        'postDOI': 'MN_UpdateDOI',
        'getShortcuts': 'MN_GetProductSalesPLUButtons',
        'postShipment': 'MN_UpdateShipmentDetails',
        'postDelivery': 'MN_UpdateDeliveryDetails',
        'getVehicleCompartments': 'MN_GetVehicleCompartments',
        'getVehicleSubCompartments': 'MN_GetVehicleSubCompartments',
        'calcShipReading': 'MN_CalcShipReading',
        'getContacts': 'MN_GetShipToContacts',
        'postDeliveryTicket': 'MN_UpdateDeliveryTicket',
        'postMeterTicket': 'MN_UpdateMeterTicket',
        'getDocMessages': 'MN_GetDocMessage',
        'postAttachment': 'MN_UpdateAttachment',
        'getAttachments': 'MN_GetCloudAttachment',
        'getAttachment': 'MN_GetAttachmentFile',
        'deleteAttachment': 'MN_DeleteCloudAttachment',
        'getActivityLog': 'MN_Activity',
        'updateOrderStatus': 'MN_UpdateOrderStatusHistory'
    },
    'tableServices': {},
    "filepath": 'http://dreamfactory.firestreamonline.com/api/v2/files/images/',
    'wcfServices': {
        'getOrders': 'GetOrders',
        'getOrdersHistory': 'GetOrderHistory',
        'getOrderNo': 'GetOrderNo'
    }
};

console.log('this is test config');

app.constant('appConstants', config);