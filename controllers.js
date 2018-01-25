/**
 * Controllers
 * @module controllers
 */
define(function (require, exports) {

    'use strict';

    /**
     * Main controller
     * @ngInject
     * @constructor
     */
    // @ngInject
    function MainCtrl(WidgetModel,
                      lpWidget,
                      lpCoreUtils,
                      lpCoreError,
                      $scope,
                      $uibModal,
                      $window,
                      lpCoreBus,
                      authenticationService,
                      $timeout,
                      lpPortal,
                      CONSTANTS) {

        this.model = WidgetModel;
        this.utils = lpCoreUtils;
        this.error = lpCoreError;
        this.widget = lpWidget;
        this.bus = lpCoreBus;
        var service = authenticationService;

        var ctrl = this;
        ctrl.uibModal = $uibModal;
        $scope.expiry = {};
        ctrl.data = {};
        ctrl.data.nameFlag = false;
        ctrl.data.cardNumberFlag = false;
        ctrl.data.cvvFlag = false;
        ctrl.data.birthdayFlag = false;
        ctrl.data.expiryMonthFlag = false;
        ctrl.data.expiryYearFlag = false;
        ctrl.password = "";
        ctrl.creditCardNumber = "";
        ctrl.data.birthdate = '';
        ctrl.data.isFullCardValidation = true;
		ctrl.invCode = "invCode";
        var templateUrl = launchpad.staticRoot + '/widgets/[BBHOST]/widget-citibmx-card-validation/templates/';
        ctrl.templateUrl = templateUrl;
        ctrl.templates = {
                  popUpMsg: templateUrl + 'popup-msg.html',
                  hardBlock: templateUrl + CONSTANTS.HARD_BLOCK_INFO_HTML,
                  noRegistered: templateUrl + CONSTANTS.NO_REGISTERED_INFO_HTML,
                  modalBlockedAccesssCtrl : templateUrl + 'invalid-access-popup.html',
                  modalAccesssBlockedCtrl:  templateUrl + 'access-blocked.html',
                  lostBlock: templateUrl + CONSTANTS.LOST_BLOCK_INFO_HTML
        };
        ctrl.back = function(){
            if($window.location.href.indexOf('-es/') > 0){
               $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN_ES');
            }else{
               $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN');
            }
        };

        function addZero(num, places) {
            var zero = places - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + num;
        };

        function setAllInputsTouched(form) {
             angular.forEach(form.$error, function (field) {
                    angular.forEach(field, function(errorField){
                        errorField.$setTouched();
                    });
             });
        };

        lpCoreBus.subscribe("widget-bmx-card-validation:OPEN",function(obj){
             ctrl.data.endpoint = obj.endpoint;
             ctrl.data.origin = obj.origin;
             lpCoreBus.publish("rightPanelContent", {templateId:'cardValidation'});
             $("#widget-bmx-card-validation").removeClass("ng-hide");
             lpCoreBus.publish(CONSTANTS.CURRENT_STEP, 1);
             var currentMonth = moment().month();
             currentMonth = currentMonth + 1;
             var currentYear = moment().year();
             var year = currentYear;
             var month = 1;
             var day = 1;
             var monthAbbr = null;
             ctrl.data.years = [];
             ctrl.data.months = [];
             ctrl.data.bday = {};
             ctrl.data.bday.years = [];
             ctrl.data.bday.months = [];
             ctrl.data.bday.days = [];

             var maxAge = lpWidget.getPreference("MAX_AGE_ALLOWED");

             if($window.location.href.indexOf('-es/') > 0){
                 monthAbbr = lpWidget.getPreference("MONTH_LIST_ES");
             }else{
                 monthAbbr = lpWidget.getPreference("MONTH_LIST_EN");
             }

             monthAbbr = monthAbbr.split(",");

             for(var index = 1; index < 11; index++ ){
                 ctrl.data.years.push({"year":year});
                 year = year + 1;
             }
             for(var index = 1; index < 13; index++ ){
                  ctrl.data.months.push({"month":addZero(month, 2)});
                  ctrl.data.bday.months.push({"month":addZero(month, 2), "name": monthAbbr[index-1]});
                  month = month + 1;
             }

             year = currentYear-18;
             for(var index = 1; index < maxAge - 17; index++ ){
                  ctrl.data.bday.years.push({"year":year});
                  year = year - 1;
             }

            for(var index = 1; index < 32; index++ ){
                  ctrl.data.bday.days.push({"day":addZero(day, 2)});
                  day = day + 1;
            }

            $scope.data = {};
            $scope.data.alertList = [];
            ctrl.registrationForm = {};
            ctrl.model = {};
            $scope.themePath = launchpad.staticRoot + '/features/[BBHOST]/theme-banamex';
            ctrl.data.invalidityExp = false;
            ctrl.data.invalidityBday = false;
            ctrl.data.bdayBelow18 = false;

            var ExpUpdateInfoIcon = function(){
                 if(ctrl.data.invalidityExp){
                     $("#expTooltip .cb-input-infoIcon").addClass("invalid");
                  }
                  else{
                     $("#expTooltip .cb-input-infoIcon").removeClass("invalid");
                  }
            };

            var expDateInFuture = function(){
                if(ctrl.data.expiryYear.year === currentYear && ctrl.data.expiryMonth.month < currentMonth){
                    return true;
                }
                else{
                    return false;
                }
            };

            var bdayValid = function(){
                if(ctrl.data.bdayMonth && ctrl.data.bdayDay && ctrl.data.bdayYear){
                    var birthdateTMP = moment(ctrl.data.bdayMonth.month+"-"+ctrl.data.bdayDay.day+"-"+ctrl.data.bdayYear.year, "MM-DD-YYYY", true);
                    if(birthdateTMP.isValid()){
                        if(new moment().diff(birthdateTMP, 'year') >= 18){
                            return true;
                        }
                        else{
                            ctrl.data.bdayBelow18 = true;
                        }
                    }
                    else{
                        return false;
                    }
                }
                else{
                    return true;
                }
            };

            ctrl.validateYear = function(){
                if(!ctrl.data.invalidityExp){
                    if(!ctrl.data.expiryYear){
                        ctrl.data.invalidityExp = true;
                    }
                    else if(ctrl.data.expiryMonth && expDateInFuture()){
                        ctrl.data.invalidityExp = true;
                    }
                    else{
                        ctrl.data.invalidityExp = false;
                    }
                 }
                 else{
                    if(ctrl.data.expiryYear && ctrl.data.expiryMonth && !expDateInFuture()){
                       ctrl.data.invalidityExp = false;
                    }
                    else{
                      ctrl.data.invalidityExp = true;
                    }
                 }
                 ExpUpdateInfoIcon();
            };

            ctrl.validateMonth = function(){
                if(!ctrl.data.invalidityExp){
                    if(!ctrl.data.expiryMonth){
                        ctrl.data.invalidityExp = true;
                    }
                    else if(ctrl.data.expiryYear && expDateInFuture()){
                        ctrl.data.invalidityExp = true;
                    }
                    else{
                        ctrl.data.invalidityExp = false;
                    }
                }
                else{
                    if(ctrl.data.expiryYear && ctrl.data.expiryMonth && !expDateInFuture()){
                       ctrl.data.invalidityExp = false;
                    }
                    else{
                      ctrl.data.invalidityExp = true;
                    }
                }
                ExpUpdateInfoIcon();
            };

            ctrl.validateBdayDay = function(){
                ctrl.data.bdayBelow18 = false;
                if(!ctrl.data.invalidityBday){
                    if(!ctrl.data.bdayDay){
                        ctrl.data.invalidityBday = true;
                    }
                    else if(!bdayValid()){    //to be added
                        ctrl.data.invalidityBday = true;
                    }
                    else{
                        ctrl.data.invalidityBday = false;
                    }
                }
                else{
                    if(ctrl.data.bdayMonth && ctrl.data.bdayYear && bdayValid()){    //to be added
                        ctrl.data.invalidityBday = false;
                    }
                    else{
                      ctrl.data.invalidityBday = true;
                    }
                }
            };

            ctrl.validateBdayMonth = function(){
                ctrl.data.bdayBelow18 = false;
                if(!ctrl.data.invalidityBday){
                    if(!ctrl.data.bdayMonth){
                        ctrl.data.invalidityBday = true;
                    }
                    else if(!bdayValid()){    //to be added
                        ctrl.data.invalidityBday = true;
                    }
                    else{
                        ctrl.data.invalidityBday = false;
                    }
                }
                else{
                    if(ctrl.data.bdayDay && ctrl.data.bdayYear && bdayValid()){    //to be added
                        ctrl.data.invalidityBday = false;
                    }
                    else{
                      ctrl.data.invalidityBday = true;
                    }
                }
            };

            ctrl.validateBdayYear = function(){
                ctrl.data.bdayBelow18 = false;
                if(!ctrl.data.invalidityBday){
                    if(!ctrl.data.bdayYear){
                        ctrl.data.invalidityBday = true;
                    }
                    else if(!bdayValid()){    //to be added
                        ctrl.data.invalidityBday = true;
                    }
                    else{
                        ctrl.data.invalidityBday = false;
                    }
                }
                else{
                    if(ctrl.data.bdayMonth && ctrl.data.bdayYear && bdayValid()){    //to be added
                        ctrl.data.invalidityBday = false;
                    }
                    else{
                      ctrl.data.invalidityBday = true;
                    }
                }
            };
			
			ctrl.getParameterByName = function(name, url) {
				if (!url) url = window.location.href;
				name = name.replace(/[\[\]]/g, "\\$&");
				var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
					results = regex.exec(url);
				if (!results) return null;
				if (!results[2]) return '';
				return decodeURIComponent(results[2].replace(/\+/g, " "));
			};

            ctrl.submit = function () {
                ctrl.loading = true;
                var validation = true;

                setAllInputsTouched(ctrl.registrationForm);

                sessionStorage.setItem( CONSTANTS.CARD_DATA, JSON.stringify(ctrl.data));
                if(!ctrl.data.name){
                    ctrl.data.nameFlag = true;
                }else{
                    ctrl.data.nameFlag = false;
                }
                if(!ctrl.creditCardNumber || ctrl.creditCardNumber.length < 16){
                    ctrl.data.cardNumberFlag = true;
                }else{
                     ctrl.data.cardNumberFlag = false;
                 }
                if(!ctrl.password || ctrl.password.length < 3){
                    ctrl.data.cvvFlag = true;
                }else{
                     ctrl.data.cvvFlag = false;
                 }
                if(!ctrl.data.expiryMonth
                    || (ctrl.data.expiryYear && currentYear === ctrl.data.expiryYear.year && currentMonth > ctrl.data.expiryMonth.month)){
                    ctrl.data.expiryMonthFlag = true;
                }else{
                     ctrl.data.expiryMonthFlag = false;
                 }
                if(!ctrl.data.expiryYear || ctrl.data.expiryYear.year < currentYear){
                    ctrl.data.expiryYearFlag = true;
                }else{
                     ctrl.data.expiryYearFlag = false;
                 }
                if(!ctrl.data.bdayDay || !ctrl.data.bdayMonth || !ctrl.data.bdayYear){
                    ctrl.data.birthdayFlag = true;
                }
                else{
                    var birthdateTMP = moment(ctrl.data.bdayMonth.month+"-"+ctrl.data.bdayDay.day+"-"+ctrl.data.bdayYear.year, "MM-DD-YYYY", true);
                    if(birthdateTMP.isValid() && new moment().diff(birthdateTMP, 'year') >= 18){
                        ctrl.data.birthdayFlag = false;
                    }else{
                         ctrl.data.birthdayFlag = true;
                    }
                }


                if(!ctrl.data.birthdayFlag
                    && !ctrl.data.expiryYearFlag
                    && !ctrl.data.expiryMonthFlag
                    && !ctrl.data.cvvFlag
                    && !ctrl.data.cardNumberFlag
                    && !ctrl.data.nameFlag){
                    validation = true;
                }else{
                    validation = false;
                }
				
				/*---------------------------------US11344--------------------------*/
				var invCode = ctrl.getParameterByName(ctrl.invCode)
				if(invCode === null){
					invCode = "";
				}
				/*---------------------------------US11344--------------------------*/
				
                if(validation){
                    $scope.expiryDate = addZero(ctrl.data.expiryMonth.month,2)+ '' +ctrl.data.expiryYear.year.toString().substring(2, 4);
                    $scope.birthdate = addZero(birthdateTMP.month()+1,2) + addZero(birthdateTMP.date(),2)+ birthdateTMP.year().toString();
					
					/*---------------------------------US11344--------------------------*/
					//call the service for Invitation code validation...
					/*---------------------------------US11344--------------------------*/
					
                    service.validateCardCredentials(ctrl.data.endpoint, $scope.expiryDate, ctrl.data.cardnumber, ctrl.password, $scope.birthdate, ctrl.data.name, invCode, lpPortal.name, lpPortal.page.name)
                                    .then(function(cardCredentialsResponse){
                                    console.log(cardCredentialsResponse);
                              sessionStorage.setItem("customerName",ctrl.data.name);
                              sessionStorage.setItem("TempCardnumber",ctrl.creditCardNumber);
                              if(null != cardCredentialsResponse.maskedNumber ){
                                  sessionStorage.setItem("maskedMobileNumber",cardCredentialsResponse.maskedNumber);
                              }
                              if(null != cardCredentialsResponse.customerRelationshipID){
                                  var customerId = cardCredentialsResponse.customerRelationshipID;
                                  customerId = customerId.replace(/^0+/, '');
                                  sessionStorage.setItem("customerRelationshipID",customerId);
                              }
                              $("#widget-bmx-card-validation").addClass("ng-hide");
                              $scope.data.alertList = [];
                              ctrl.loading = false;
                              lpCoreBus.publish("widget-bmx-card-validation:CLOSE"+ctrl.data.origin, {
                                   validationSuccess: true,
                                   maskedMobileNumber: cardCredentialsResponse.maskedNumber
                              });


                      }).catch(function(errorResponse){

                            ctrl.loading = false;
                            if(errorResponse.data.errorType === "CARD_REGISTERED"){
                                var modalInstance = ctrl.uibModal.open({
                                   windowClass: 'modal-dialog-center',
                                   templateUrl: ctrl.templates.popUpMsg,
                                   controller: CONSTANTS.MODALCTRL,
                                   size: CONSTANTS.MD,
                                   backdrop: false,
                                   resolve: {
                                   data: function () {
                                    return {};
                                   }
                                  }
                                });
                            }

                            // For Card Block Popup
                            else if(errorResponse.data.errorType === CONSTANTS.LOST_CARD || errorResponse.data.errorType === CONSTANTS.STOLEN_CARD){
                                 lpCoreBus.publish(CONSTANTS.WIDGET_CITIBMX_CARDBLOCKED_STATUS_POPUP_OPEN, {
                                   blockCode: errorResponse.data.errorType
                                });

                            }
                            else if(errorResponse.data.type === CONSTANTS.BLOCK_CARD){
                                 lpCoreBus.publish(CONSTANTS.WIDGET_CITIBMX_CARDBLOCKED_STATUS_POPUP_OPEN, {
                                   blockCode: errorResponse.data.type
                                });

                            }
                            else if(errorResponse.data.errorType === "ACCESS_BLOCKED" || errorResponse.data.errorType === "SOFT_BLOCKED" || errorResponse.data.errorType === "HARD_BLOCKED"){
                                lpCoreBus.publish(CONSTANTS.WIDGET_CITIBMX_BLOCKED_STATUS_POPUP_OPEN, {
                                  blockedCode: errorResponse.data.errorType,
                                  isPreLogin: "true"
                                  });
                            }else{
                               ctrl.loading = false;
                               ctrl.model.error = errorResponse.data.errorType || CONSTANTS.TECHNICAL_DIFFICULTY;
                               $scope.data.alertList = [];
                               $scope.data.alertList.push({
                                 message:ctrl.model.error,
                                 messageType: "red-box"
                               });

                            }
                        });
                }else{
                    ctrl.loading = false;
                }

                //Validate Card Credentials

            };

    });

    lpCoreBus.subscribe(CONSTANTS.WIDGET_CITIBMX_CARDBLOCKED_STATUS_POPUP_OPEN,function(data){
        var blockedCode = data.blockCode;
        var modalOTPInstance = ctrl.uibModal.open({
            windowClass: 'modal-dialog-center',
            templateUrl: ctrl.templates.lostBlock,
            controller: CONSTANTS.MODALLOSTCARDCTRL,
            backdrop: false,
            size: CONSTANTS.MD,
            resolve: {
                data: function () {
                    return {
                        origin :data.origin,
                        backdrop: 'static',
                        keyboard: false,
                        blockedCode: blockedCode
                    };
                }
            }
        });
    });

        lpCoreBus.subscribe("widget-bmx-card-validation-reset:OPEN",function(obj){
            lpCoreBus.publish("rightPanelContent", {templateId:'IVR-PIN'});
            $("#widget-bmx-card-validation").removeClass("ng-hide");
            lpCoreBus.publish(CONSTANTS.CURRENT_STEP, 1);
            ctrl.data.isFullCardValidation = false;
            ctrl.data.endpoint = obj.endpoint;
            ctrl.data.title = obj.title;
            ctrl.data.origin = obj.origin;
            var currentMonth = moment().month();
            currentMonth = currentMonth + 1;
            var currentYear = moment().year();
            var year = currentYear;
            var month = 1;
            var day = 1;
            var monthAbbr = null;
            $scope.data = {};
            $scope.data.alertList = [];
            ctrl.data.years = [];
            ctrl.data.months = [];
            ctrl.data.invalidityExp = false;
            $scope.themePath = launchpad.staticRoot + '/features/[BBHOST]/theme-banamex';

            var expDateInFuture = function(){
                if(ctrl.data.expiryYear.year === currentYear &&
                   ctrl.data.expiryMonth.month < currentMonth){
                    return true;
                }
                else{
                    return false;
                }
            };
            var ExpUpdateInfoIcon = function(){
                 if(ctrl.data.invalidityExp){
                     $("#expTooltip .cb-input-infoIcon").addClass("invalid");
                  }
                  else{
                     $("#expTooltip .cb-input-infoIcon").removeClass("invalid");
                  }
            };
            for(var index = 1; index < 11; index++ ){
                ctrl.data.years.push({"year":year});
                year = year + 1;
            }
            for(var index = 1; index < 13; index++ ){
                ctrl.data.months.push({"month":addZero(month, 2)});
                month = month + 1;
            }
            ctrl.validateYear = function(){
                if(!ctrl.data.invalidityExp){
                    if(!ctrl.data.expiryYear){
                        ctrl.data.invalidityExp = true;
                    }
                    else if(ctrl.data.expiryMonth && expDateInFuture()){
                        ctrl.data.invalidityExp = true;
                    }
                    else{
                        ctrl.data.invalidityExp = false;
                    }
                 }
                 else{
                    if(ctrl.data.expiryYear && ctrl.data.expiryMonth && !expDateInFuture()){
                       ctrl.data.invalidityExp = false;
                    }
                    else{
                      ctrl.data.invalidityExp = true;
                    }
                 }
                 ExpUpdateInfoIcon();
            };
            ctrl.validateMonth = function(){
                if(!ctrl.data.invalidityExp){
                    if(!ctrl.data.expiryMonth){
                        ctrl.data.invalidityExp = true;
                    }
                    else if(ctrl.data.expiryYear && expDateInFuture()){
                        ctrl.data.invalidityExp = true;
                    }
                    else{
                        ctrl.data.invalidityExp = false;
                    }
                }
                else{
                    if(ctrl.data.expiryYear && ctrl.data.expiryMonth && !expDateInFuture()){
                       ctrl.data.invalidityExp = false;
                    }
                    else{
                      ctrl.data.invalidityExp = true;
                    }
                }
                ExpUpdateInfoIcon();
            };
            ctrl.validateCardDetails = function() {
                var validation = true;
                setAllInputsTouched(ctrl.registrationForm);

                if(!ctrl.creditCardNumber || ctrl.creditCardNumber.length < 16){
                    ctrl.data.cardNumberFlag = true;
                }else{
                     ctrl.data.cardNumberFlag = false;
                 }
                 if(!ctrl.password || ctrl.password.length < 3){
                     ctrl.data.cvvFlag = true;
                 }else{
                      ctrl.data.cvvFlag = false;
                  }
                 if(!ctrl.data.expiryMonth
                     || (ctrl.data.expiryYear && currentYear === ctrl.data.expiryYear.year && currentMonth > ctrl.data.expiryMonth.month)){
                     ctrl.data.expiryMonthFlag = true;
                 }else{
                      ctrl.data.expiryMonthFlag = false;
                  }
                 if(!ctrl.data.expiryYear || ctrl.data.expiryYear.year < currentYear){
                     ctrl.data.expiryYearFlag = true;
                 }else{
                      ctrl.data.expiryYearFlag = false;
                  }

                  if(!ctrl.data.expiryYearFlag
                      && !ctrl.data.expiryMonthFlag
                      && !ctrl.data.cvvFlag
                      && !ctrl.data.cardNumberFlag){
                      validation = true;
                  }else{
                      validation = false;
                  }

                  if(validation){
                    $scope.expiryDate = addZero(ctrl.data.expiryMonth.month,2)+ '' +ctrl.data.expiryYear.year.toString().substring(2, 4);
                    ctrl.loading = true;
                    //Validate Card Credentials
                    service.validateCardUsernameLookup(ctrl.data.endpoint,$scope.expiryDate, ctrl.data.cardnumber, ctrl.password, null, null, lpPortal.name, lpPortal.page.name)
                        .then(function(cardCredentialsResponse) {
                            //If the card is valid show Password screen

                            ctrl.loading = false;
                            if(cardCredentialsResponse.validCard &&
                               cardCredentialsResponse.ccsCardRegistry === true){
                               if(cardCredentialsResponse.cardTypeIndicator !== "P"){
                                    ctrl.model.error = 'NOT_PRM_CARD';
                                    $scope.data.alertList = [];
                                    $scope.data.alertList.push({
                                        message:ctrl.model.error,
                                        messageType:'red-box'
                                    });
                                    return;
                               }
                                if(null != cardCredentialsResponse.maskedNumber ){
                                    sessionStorage.setItem("maskedMobileNumber",cardCredentialsResponse.maskedNumber);
                                }
                                if(null != cardCredentialsResponse.customerRelationshipID){
                                    var customerId = cardCredentialsResponse.customerRelationshipID;
                                    customerId = customerId.replace(/^0+/, '');
                                    sessionStorage.setItem("customerRelationshipID",customerId);
                                }
                                sessionStorage.setItem("TempCardnumber",ctrl.creditCardNumber);
                                $("#widget-bmx-card-validation").addClass("ng-hide");
                                $scope.data.alertList = [];
                                ctrl.loading = false;
                                lpCoreBus.publish("widget-bmx-card-validation-reset:CLOSE_"+ctrl.data.origin, {
                                     validationSuccess: true,
                                     maskedMobileNumber: cardCredentialsResponse.maskedNumber
                                });

                            }

                            else if(cardCredentialsResponse.ccsCardRegistry === false){
                                var modalInstance = ctrl.uibModal.open({
                                    windowClass: 'modal-dialog-center',
                                    templateUrl: ctrl.templates.noRegistered,
                                    controller: CONSTANTS.MODALNOREGCTRL,
                                    size: CONSTANTS.MD,
                                    backdrop: false,
                                    resolve: {
                                        data: function () {
                                            return {}; //empty data
                                        }
                                    }
                                });
                            }else if(!cardCredentialsResponse.validCard){
                                ctrl.model.error = 'Invalid.Card.Reset';
                                $scope.data.alertList = [];
                                $scope.data.alertList.push({
                                    message:ctrl.model.error,
                                    messageType:'red-box'
                                });
                            }else{
                                ctrl.model.error = CONSTANTS.TECHNICAL_DIFFICULTY;
                                $scope.data.alertList = [];
                                $scope.data.alertList.push({
                                    message:ctrl.model.error,
                                    messageType:'red-box'
                                });
                            }

                        })
                        .catch(function(errorResponse) {

                            ctrl.loading = false;
                            if(errorResponse.data.errorType === 'INVALID_CARD'){
                                ctrl.model.error = 'Invalid.Card.Reset';
                                $scope.data.alertList = [];
                                $scope.data.alertList.push({
                                    message:ctrl.model.error,
                                    messageType:'red-box'
                                });
                            }
                            // For Card Block Popup
                             else if(errorResponse.data.errorType === CONSTANTS.LOST_CARD || errorResponse.data.errorType === CONSTANTS.STOLEN_CARD){
                                lpCoreBus.publish(CONSTANTS.WIDGET_CITIBMX_CARDBLOCKED_STATUS_POPUP_OPEN, {
                                   blockCode: errorResponse.data.errorType
                                });

                            }
                            else if(errorResponse.data.type === CONSTANTS.BLOCK_CARD){
                                 lpCoreBus.publish(CONSTANTS.WIDGET_CITIBMX_CARDBLOCKED_STATUS_POPUP_OPEN, {
                                   blockCode: errorResponse.data.type
                                });

                            }else if(errorResponse.data.errorType === "ACCESS_BLOCKED" || errorResponse.data.errorType === "SOFT_BLOCKED" || errorResponse.data.errorType === "HARD_BLOCKED"){
                                 lpCoreBus.publish(CONSTANTS.WIDGET_CITIBMX_BLOCKED_STATUS_POPUP_OPEN, {
                                   blockedCode: errorResponse.data.errorType,
                                   isPreLogin: "true"
                                   });
                            }
                            else{
                                 ctrl.model.error = CONSTANTS.TECHNICAL_DIFFICULTY;
                                 $scope.data.alertList = [];
                                 $scope.data.alertList.push({
                                     message:ctrl.model.error,
                                     messageType:'red-box'
                                 });

                             }

                        });
                  }
            };

        });

        lpCoreBus.subscribe(CONSTANTS.WIDGET_CITIBMX_BLOCKED_STATUS_POPUP_OPEN,function(data){
            var blockedCode = data.blockedCode;
            if(blockedCode === "ACCESS_BLOCKED"){
                var modalOTPInstance = ctrl.uibModal.open({
                    windowClass: 'modal-dialog-center',
                    templateUrl: ctrl.templates.modalAccesssBlockedCtrl,
                    controller: CONSTANTS.MODAL_BLOCKED_ACCESS_CTRL,
                    backdrop: false,
                    size: CONSTANTS.MD,
                    resolve: {
                        data: function () {
                            return {
                                origin :data.origin,
                                backdrop: 'static',
                                keyboard: false,
                                isPreLogin : data.isPreLogin,
                                blockedCode: blockedCode
                            };
                        }
                    }
                });
            }else{
                var modalOTPInstance = ctrl.uibModal.open({
                    windowClass: 'modal-dialog-center',
                    templateUrl: ctrl.templates.modalBlockedAccesssCtrl,
                    controller: CONSTANTS.MODAL_BLOCKED_ACCESS_CTRL,
                    backdrop: false,
                    size: CONSTANTS.MD,
                    resolve: {
                        data: function () {
                            return {
                                origin :data.origin,
                                backdrop: 'static',
                                keyboard: false,
                                isPreLogin : data.isPreLogin,
                                blockedCode: blockedCode
                            };
                        }
                    }
                });
            }
        });

        lpCoreBus.subscribe(CONSTANTS.WIDGET_CITIBMX_CARDBLOCKED_STATUS_POPUP_OPEN,function(data){
            var blockedCode = data.blockCode;
            var modalOTPInstance = ctrl.uibModal.open({
                windowClass: 'modal-dialog-center',
                templateUrl: ctrl.templates.lostBlock,
                controller: CONSTANTS.MODALLOSTCARDCTRL,
                backdrop: false,
                size: CONSTANTS.MD,
                resolve: {
                    data: function () {
                        return {
                            origin :data.origin,
                            backdrop: 'static',
                            keyboard: false,
                            blockedCode: blockedCode
                        };
                    }
                }
            });
        });
    };

     // @ngInject
     function ModalInstanceCtrl($scope, $window, $uibModalInstance, lpWidget, authenticationService, data,CONSTANTS,lpCoreBus,lpCoreUtils) {

        var ctrl = this;
         $scope.close = function () {
             $uibModalInstance.dismiss();
         };

         $scope.continue = function () {
                      $uibModalInstance.dismiss();
                      if($window.location.href.indexOf('-es/') > 0){
                       $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN_ES');
                       }else{
                       $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN');
                       }
          };
     };

      // @ngInject
     function ModalNoRegCtrl($scope, $window, $uibModalInstance, lpWidget, authenticationService, data,CONSTANTS,lpCoreBus,lpCoreUtils) {

         var ctrl = this;

          $scope.cancel = function () {
                       $uibModalInstance.dismiss();
                       if($window.location.href.indexOf('-es/') > 0){
                            $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN_ES');
                       }else{
                            $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN');
                       }
           };

           $scope.register = function () {
                      $uibModalInstance.dismiss();
                      if($window.location.href.indexOf('-es/') > 0){
                            $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_REGISTRATION_SCREEN_ES');
                      }else{
                            $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_REGISTRATION_SCREEN');
                      }
          };
      };

    // @ngInject
function ModalBlockedAccesssCtrl($scope, $window, $uibModalInstance, lpCoreBus, lpWidget, authenticationService, data, lpCoreUtils) {
    $scope.isPreLogin = data.isPreLogin;
    $scope.origin =  data.origin;
    $scope.blockedCode = data.blockedCode;
    $scope.title = "BlockedAccess.Title."+$scope.blockedCode;
    $scope.blockedDescription = "BlockedAccess.Msg.Description."+$scope.blockedCode;
    $scope.primaryButton = "BlockedAccess.Btn.Accept."+$scope.blockedCode;
    $scope.blockedErrorCode ="BlockedAccess.Error."+$scope.blockedCode;
    var ctrl = this;
    $scope.timer = null;
    $scope.expTime = lpWidget.getPreference('expirationTime');
    if($scope.expTime != null && typeof $scope.expTime === 'string' && !isNaN($scope.expTime)){
        $scope.expTime = parseInt($scope.expTime);
    }
    else{
        console.log("Error in retrieving configurations");
    }

    $scope.close = function () {
       $uibModalInstance.dismiss();
       clearTimeout($scope.timer);
       if($window.location.href.indexOf('-es/') > 0){
           $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference("USER_LOGIN_SCREEN_ES");
       }else{
           $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference("USER_LOGIN_SCREEN");
       }
    };

    $scope.resetTimer = function () {
        clearTimeout($scope.timer);
        $scope.timer = setTimeout($scope.close, 60000*$scope.expTime);
    };
    $scope.resetTimer();

    $scope.closeAndDirect = function(){
        clearTimeout($scope.timer);
        if($scope.blockedCode === "ACCESS_BLOCKED"){
            if($window.location.href.indexOf('-es/') > 0){
                $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference("USER_LOGIN_SCREEN_ES");
            }else{
                $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference("USER_LOGIN_SCREEN");
            }
        }else{
            //unblock page
            if($window.location.href.indexOf('-es/') > 0){
                $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference("UNBLOCK_ACCESS_ES");
            }else{
                $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference("UNBLOCK_ACCESS");
            }
        }
    };
    };

    // @ngInject
function ModalLostCtrl($scope, $window, $uibModalInstance, lpWidget, authenticationService, data,CONSTANTS,lpCoreBus,lpCoreUtils) {

            var ctrl = this;
            $scope.blockedCode = data.blockedCode;
            $scope.blockedErrorCode =CONSTANTS.CARD_BLOCK_ERROR+$scope.blockedCode;
            $scope.blockedDescription = CONSTANTS.CARD_BLOCK_ERROR_MSG+$scope.blockedCode;
            $scope.close = function(){
                $uibModalInstance.dismiss();
                if($window.location.href.indexOf('-es/') > 0){
                        $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN_ES');
                }else{
                        $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN');
                }
            };

            $scope.accept = function(){
                if($window.location.href.indexOf('-es/') > 0){
                        $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN_ES');
                }else{
                        $window.location.href = lpCoreUtils.getPortalProperty('serverRoot') + lpWidget.getPreference('USER_LOGIN_SCREEN');
                }

            };

     };
    /**
     * Export Controllers
     */
    exports.ModalBlockedAccesssCtrl = ModalBlockedAccesssCtrl;
    exports.MainCtrl = MainCtrl;
    exports.ModalInstanceCtrl = ModalInstanceCtrl;
    exports.ModalNoRegCtrl = ModalNoRegCtrl;
    exports.ModalLostCtrl = ModalLostCtrl;
});
