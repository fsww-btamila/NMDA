app.config(function($stateProvider, $urlRouterProvider) {
    var o = { "Orders": { "OrderItems": [{ "MasterProdID": "1064", "Code": "PRO", "Descr": "Propane/gallons", "DefOnCountUOMID": "1", "OnCountUOM": "Gallons", "DefConversionUOMID": "1", "OnConversionUOM": "Gallons", "ConversionFactor": "1.0000000", "IsPackaged": "Y", "UnitPrice": "1.65", "AvailableQty": "250.00", "QuantityOrdered": "7744", "statusList": ["initial", "inprogress"] }, { "MasterProdID": "1059", "Code": "NL87", "Descr": "No Lead Gasoline 87 Octane", "DefOnCountUOMID": "1", "OnCountUOM": "Gallons", "DefConversionUOMID": "1", "OnConversionUOM": "Gallons", "ConversionFactor": "1.0000000", "IsPackaged": "Y", "UnitPrice": "1.65", "AvailableQty": "250.00", "QuantityOrdered": "1111", "statusList": ["initial", "inprogress"] }, { "MasterProdID": "14853", "Code": "PRO_CRs", "Descr": "Propane/gallons", "DefOnCountUOMID": "1", "OnCountUOM": "Gallons", "DefConversionUOMID": "1", "OnConversionUOM": "Gallons", "ConversionFactor": "1.0000000", "IsPackaged": "N", "UnitPrice": "1.65", "AvailableQty": "250.00", "QuantityOrdered": "1100", "statusList": ["initial", "inprogress", "finished"] }, { "MasterProdID": "14852", "Code": "NL89/55Drum", "Descr": "NL89/55Drum", "DefOnCountUOMID": "1", "OnCountUOM": "Gallons", "DefConversionUOMID": "1", "OnConversionUOM": "Gallons", "ConversionFactor": "1.0000000", "IsPackaged": "N", "UnitPrice": "1.65", "AvailableQty": "250.00", "QuantityOrdered": "222", "statusList": ["initial", "inprogress", "finished"] }], "OrderHdr": { "Vessels": [{ "VesselID": "1001", "VesselCode": "Vessel Two", "VesselDescr": "Vessel Two", "$$hashKey": "object:528" }, { "VesselID": "1000", "VesselCode": "VTest001", "VesselDescr": "VTest001", "$$hashKey": "object:527" }], "PlannedDate": "2016-04-10T12:06:42.502Z", "INSiteCode": "0503 Git N Go", "EnteredOn": "2016-04-10T12:06:42.502Z", "EnteredBy": "sad", "OrderNo": 82475, "customerName": "test", "customerNumber": "100125", "CreditAvailable": 1000, "OnHold": false, "POD": false, "Vehicle": "International - 2HSCEAPR16C345929", "ReceivingContactName": "Akalya Kuppuraj", "ReceivingContactNumber": "100125", "Destination": "MTest001", "MarineLocID": "MTest001", "PONo": 54376, "OrderDtTm": "2016-04-10T12:09:38.365Z", "DtTm": "2016-04-10T12:09:38.365Z", "LastStatusDate": "2016-04-10T12:09:38.365Z", "ToSiteID": "1036", "CompanyID": "20", "MarineSessionID": 545, "VehicleID": "1010", "FavouriteOrder": true, "DriverID": "1020", "CustomerName": "test", "CustomerNumber": "100125", "Status": "Shipping in Progress" } }, "customerId": "59239", "customerDesc": "Hinkle Floting", "favouriteOrder": false }
    $stateProvider.state('login', {
            url: '/login',
            templateUrl: 'login.html',
            controller: 'loginController'
        }).state('defaults', {
            url: '/defaults',
            templateUrl: 'defaults.html',
            controller: 'loginController'
        }).state('sign', {
            url: '/sign',
            templateUrl: 'signature.html',
            controller: 'signController'
        }).state('doi', {
            url: '/doi',
            templateUrl: 'doi.html',
            controller: 'doiController'
        }).state('orders', {
            url: '/ordersList',
            templateUrl: 'ordersList.html',
            controller: 'ordersController'
        }).state('customers', {
            url: '/customersList',
            templateUrl: 'customersList.html',
            controller: 'ordersController'
        }).state('addorder', {
            url: '/addorder',
            templateUrl: 'addOrder.html',
            controller: 'addOrderController',
            resolve: {
                OrderList: function($stateParams, $q, $localstorage) {
                    var deferred = $q.defer();
                    var lastEditedOrder = $localstorage.get('lastEditedSysTrxNo');
                    dbo.selectTable('OrdersMaster', "SysTrxNo=?", [$stateParams.systrxno || lastEditedOrder], function(results) {
                        if (results.success) {
                            deferred.resolve(JSON.parse(results.data.rows[0].orderData));
                        }
                    });
                    return deferred.promise;
                }
            },
            params: { customer: null, order: null, isCod: false, source:null, systrxno:null }
        })
        .state('addorder.general', {
            url: '/general',
            views: {
                'add-general': {
                    templateUrl: 'general.html'
                }
            }
        })
        .state('addorder.destination', {
            url: '/destination',
            views: {
                'add-destination': {
                    templateUrl: 'destination.html',
                    controller: 'destinationController'
                }
            }
        })
        .state('addorder.destination.list', {
            url: '/list',
            views: {
                'destination-list': {
                    templateUrl: 'destinationList.html'
                }
            }
        })
        .state('addorder.destination.map', {
            url: '/map',
            views: {
                'destination-map': {
                    templateUrl: 'destinationMap.html',
                    controller: 'destinationMapController'
                }
            }
        })
        .state('addorder.availability', {
            url: '/availability',
            views: {
                'add-availability': {
                    templateUrl: 'availability.html'
                }
            }
        })
        .state('addorder.vessel', {
            url: '/vessel',
            views: {
                'add-vessel': {
                    templateUrl: 'vessel.html'
                }
            }
        })
        .state('addorder.notes', {
            url: '/notes',
            views: {
                'add-notes': {
                    templateUrl: 'notes.html',
                    controller: 'notesController'
                }
            }
        })
        .state('shiporder', {
            url: '/ship',
            templateUrl: 'shipOrder.html',
            controller: 'shipOrderController',
            resolve: {
                OrderList: function($stateParams, $q, $localstorage) {
                    var deferred = $q.defer();
                    var lastEditedOrder = $localstorage.get('lastEditedSysTrxNo');
                    dbo.selectTable('OrdersMaster', "SysTrxNo=?", [$stateParams.systrxno || lastEditedOrder], function(results) {
                        if (results.success) {
                            deferred.resolve(JSON.parse(results.data.rows[0].orderData));
                        }
                    });
                    return deferred.promise;
                }
            },
            params: { order: null, item: null, systrxno: null }
        })
        .state('shiporder.packaged', {
            url: '/packaged/:itemId/:uniqueId',
            views: {
                'ship-packaged': {
                    templateUrl: 'packaged.html'
                }
            }
        })
        .state('shiporder.billing', {
            url: '/billing/:itemId/:uniqueId',
            views: {
                'ship-billing': {
                    templateUrl: 'billing.html'
                }
            }
        })
        .state('shiporder.bulk', {
            url: '/bulk/:itemId/:uniqueId/:hasSource',
            views: {
                'ship-bulk': {
                    templateUrl: 'bulk.html',
                    controller: 'bulkController'
                }
            }
        })
        .state('shiporder.doi', {
            url: '/doi/:isDoiComplete/:itemId/:uniqueId',
            views: {
                'ship-doi': {
                    templateUrl: 'doi.html',
                    controller: 'doiController'
                }
            }
        })
        .state('shiporder.reading', {
            url: '/reading/:itemId/:uniqueId',
            views: {
                'ship-reading': {
                    templateUrl: 'reading.html',
                    controller: 'readingSetupController'
                }
            }
        })
        .state('shiporder.tank', {
            url: '/tank/:itemId/:tank/:tankID/:tankType/:uniqueId',
            views: {
                'ship-reading': {
                    templateUrl: 'tank.html',
                    controller: 'readingController'
                }
            },
            params: { tstate: null }
        })
        .state('shiporder.meter', {
            url: '/reading/:itemId/:meter/:uniqueId',
            views: {
                'ship-reading': {
                    controller: 'meterController',
                    templateUrl: 'meter.html'
                }
            },
            params: { currentMeter: null }
        })
        .state('shiporder.summary', {
            url: '/summary/:itemId/:uniqueId',
            views: {
                'ship-summary': {
                    templateUrl: 'summary.html',
                    controller: 'summaryController'
                }
            }
        })
        .state('shiporder.canceldelivery', {
            url: '/cancelled/:itemId',
            views: {
                'ship-cancelled': {
                    templateUrl: 'cancelDelivery.html'
                }
            }
        })
        .state('shiporder.directEntry', {
            url: '/directEntry/:itemId',
            views: {
                'ship-reading': {
                    templateUrl: 'directEntry.html'
                }
            }
        })
        .state('shiftchange', {
            url: '/shiftchange/:role',
            templateUrl: 'shiftChangeItems.html',
            controller: 'shiftChangeController',
            params: { order: null, item: null }
        })
        .state('shiftchange.doi', {
            url: '/doi/:itemId/:shiftChange/:isDoiComplete',
            views: {
                'ship-doi': {
                    templateUrl: 'doi.html',
                    controller: 'doiController'
                }
            }
        })
        .state('shiftchangeorders', {
            url: '/shiftchangeorders',
            templateUrl: 'shiftChangeOrders.html',
            controller: 'shiftChangeOrdersController',
            params: { shiftChangeOrders: null }
        })
        .state('printDeliveryTicket', {
            url: '/printDeliveryTicket',
            templateUrl: 'printDeliveryTicket.html',
            controller: 'printDeliveryTicketController',
            resolve: {
                OrderList: function($stateParams, $q, $localstorage) {
                    var deferred = $q.defer();
                    var lastEditedOrder = $localstorage.get('lastEditedSysTrxNo');
                    dbo.selectTable('OrdersMaster', "SysTrxNo=?", [$stateParams.systrxno || lastEditedOrder], function(results) {
                        if (results.success) {
                            deferred.resolve(JSON.parse(results.data.rows[0].orderData));
                        }
                    });
                    return deferred.promise;
                }
            },
            params: { order: null, systrxno: null },
            cache: false
        })
        .state('picker', {
            url: '/picker',
            templateUrl: 'picker.html',
            controller: function($scope) {
                $scope.data = {};
                $scope.data.month = '';
                $scope.monthOptions = [{
                    label: 'Jan',
                    value: 'january'
                }, {
                    label: 'Fev',
                    value: 'february'
                }, {
                    label: 'Mar',
                    value: 'march'
                }, {
                    label: 'Apr',
                    value: 'april'
                }, {
                    label: 'May',
                    value: 'may'
                }, {
                    label: 'Jun',
                    value: 'june'
                }, {
                    label: 'Jul',
                    value: 'july'
                }, {
                    label: 'Aug',
                    value: 'august'
                }, {
                    label: 'Sep',
                    value: 'september'
                }, {
                    label: 'Oct',
                    value: 'october'
                }, {
                    label: 'Nov',
                    value: 'november'
                }, {
                    label: 'Dec',
                    value: 'december'
                }];

            },
        }).state('tanks', {
            url: '/tankReading',
            templateUrl: 'tankReading.html',
            controller: 'tankReadingController'
        })
        .state('tankBE', {
            url: '/tankReading/:itemId/:tank/:tankID/:tankType/:InSiteID/:uniqueId',
            templateUrl: 'tankReadingBE.html',
            controller: 'readingController',
            params: { tstate: null }
        })

    $urlRouterProvider.otherwise('/login')
});

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('LoadingInterceptor');
}]);

app.config(function(IdleProvider, KeepaliveProvider) {
    IdleProvider.idle(1200);
    IdleProvider.timeout(1200);
    KeepaliveProvider.interval(2);
})