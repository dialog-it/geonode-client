Ext.namespace("GeoNode");
GeoNode.PermissionsEditor = Ext.extend(Ext.util.Observable, {
    // how do we determine permissions for viewing? one of:
    // ANYONE - all users can view
    // REGISTERED - all logged-in users can view
    // EDITORS - all users in the editor list can view
    viewMode: 'EDITORS', 

    // how do we determine permissions for editing? one of:
    // REGISTERED - all logged-in users can edit
    // EDITORS - all users in the editor list can view
    editMode: 'LIST',

    // a Store with the users that have editor permission
    editors: null,

    // a GeoNode.UserSelector widget for the editor list
    editorChooser: null,

    // a Store with the users that have manager permission
    managers: null,

    // a GeoNode.UserSelector widget for the manager list
    managerChooser: null,

    paymentNotRequired: false,
    
    licenseWindowClose: true, 
    
    applyButtonRequired : true,
    
    peroidPaymentTypes:null,
    
    transactionPaymentTypes:null,
    paymentTypeChooser: null,
    lisenceAgreement: '-1',
    payment_type_by_month_desc: 'MONTH_DURATION',
    csrf_token : null, 
    levels: {
        'admin': 'layer_admin',
        'readwrite': 'layer_readwrite',
        'readonly': 'layer_readonly',
        'none': '_none'
        
    },
    constructor: function(config) {
        Ext.apply(this, config);
        this.addEvents({ 'updated': true });
        GeoNode.PermissionsEditor.superclass.constructor.call(this, config);
        
        this.initStores();
        this.readPermissions(config.permissions);
        this.doLayout();
        this.csrf_token = config.csrf_token;
    },

    initStores: function(config) {
        var notifyOfUpdate = (function(t) {
            return function() { return t.fireEvent("updated", t); }
        })(this);
        this.editors = new Ext.data.Store({
            reader: new Ext.data.JsonReader({
                root: 'users',
                totalProperty: 'count',
                fields: [{name: 'username'}]
            }),
            listeners: {
                add: notifyOfUpdate,
                remove: notifyOfUpdate,
                update: notifyOfUpdate
            }
        });
        this.managers = new Ext.data.Store({
            reader: new Ext.data.JsonReader({
                root: 'users',
                totalProperty: 'count',
                fields: [{name: 'username'}]
            }),
            listeners: {
                add: notifyOfUpdate,
                remove: notifyOfUpdate,
                update: notifyOfUpdate
            }
        });
        this.peroidPaymentTypes = new Ext.data.Store({
            reader: new Ext.data.JsonReader({
                root: 'payment_options',
                totalProperty: 'count',
                fields: [{
                    name: 'payment_type_value',
                    name: 'payment',
                    name: 'payment_currency',
                    name: 'payment_type_description'
                }]
            }),
            listeners: {
                add: notifyOfUpdate,
                remove: notifyOfUpdate,
                update: notifyOfUpdate
            }
        });
        this.transactionPaymentTypes = new Ext.data.Store({
            reader: new Ext.data.JsonReader({
                root: 'payment_options',
                totalProperty: 'count',
                fields: [{
                    name: 'payment_type_value',
                    name: 'payment',
                    name: 'payment_currency'
                }]
            }),
            listeners: {
                add: notifyOfUpdate,
                remove: notifyOfUpdate,
                update: notifyOfUpdate
            }
        });
        
        if(!this.lisenceAgreementStore){
            var cfg = {
                    proxy: new Ext.data.HttpProxy({ url: '/payment/ajax_payment_lookup', method: 'POST' }),
                    reader: new Ext.data.JsonReader({
                        root: 'license_agreement_options',
                        fields: [{ name : 'title'},
                                 { name : 'filePath'},
                                 { name : 'id'}
                        		]
                    })
                };
                Ext.apply(cfg);
                this.lisenceAgreementStore = new Ext.data.Store(cfg);
                this.lisenceAgreementStore.load({params: {query: 'payment_license_agreement_list'},
            	callback: function (r, options, success){
            		this.lisenceAgreementList.getSelectionModel().suspendEvents();
          			 
            	 	for ( var i = 0; i < this.lisenceAgreementStore.getCount(); i++){
            	 			
            	 			if ( this.lisenceAgreement == this.lisenceAgreementStore.getAt(i).get('id') )
            	 				{
            	 					this.lisenceAgreementList.getSelectionModel().selectRow(i);
            	 				}
            	 		}
            	   this.lisenceAgreementList.getSelectionModel().resumeEvents();
          			
            	 	},
					scope : this
                });
        }
        
    },

    buildUserChooser: function(cfg) {
        var finalConfig = { owner: this.permissions.owner, userLookup: this.userLookup };
        Ext.apply(finalConfig, cfg);

        return new GeoNode.UserSelector(finalConfig);
    },
    buildPaymentTypesChooser: function (cfg) {
        var finalConfig = {
        	payment_options: this.permissions.payment_options,
            userLookup: this.userLookup,
            csrf_token : this.csrf_token
        };
        Ext.apply(finalConfig, cfg);
        return new GeoNode.PaymentSelector(finalConfig);
    },
    buildViewPermissionChooser: function() {
        this.paymentTypeChooser = this.buildPaymentTypesChooser({
        	peroidPaymentTypes: this.peroidPaymentTypes,
        	transactionPaymentTypes: this.transactionPaymentTypes

        });
        
        
       
        return new Ext.Panel({
            border: false,
            items: [
                {html: "<strong>" + gettext("Who can view and download this data?") + "</strong>", flex: 1, border: false},
                { xtype: 'radiogroup', columns: 1, value: this.viewMode, items: [
                    { xtype: 'radio', name: 'viewmode', inputValue: 'ANYONE', boxLabel: gettext( 'Anyone')},
                    { xtype: 'radio', name: 'viewmode', inputValue: 'REGISTERED', boxLabel: gettext('Any registered user')},
                    { xtype: 'radio', name: 'viewmode', inputValue: 'EDITORS', boxLabel: gettext('Only users who can edit')},
                    { xtype: 'radio', name: 'viewmode', disabled: this.paymentNotRequired, inputValue: 'PAID', boxLabel: gettext('Paid users')}
                ], 
                listeners: {
                    change: function(grp, checked) {
                        this.viewMode = checked.inputValue;
                        this.paymentTypeChooser.setDisabled(this.viewMode !== 'PAID');
                        this.fireEvent("updated", this);
                    },
                    scope: this
                }},
                this.paymentTypeChooser.panel
            ]
        }); 
    },

    buildEditPermissionChooser: function() {
        this.editorChooser = this.buildUserChooser({
            store: this.editors,
            availableUserConfig: {
                listeners: {
                    load: function(store, recs, opts) {
                        store.filterBy(function(rec) {
                            return this.editors.findExact("username", rec.get("username")) == -1 
                                && this.managers.findExact("username", rec.get("username")) == -1;
                        }, this);
                    },
                    scope: this
                }
            }
        });

        this.editorChooser.setDisabled(this.editMode !== 'LIST');

        return new Ext.Panel({
            border: false, 
            items: [
                {html: "<strong>" +  gettext('Who can edit this data?') + "</strong>", flex: 1, border: false},
                { xtype: 'radiogroup', columns: 1, value: this.editMode, items: [
                    { xtype: 'radio', name: 'editmode', inputValue: 'REGISTERED', boxLabel: gettext('Any registered user')},
                    { xtype: 'radio', name: 'editmode', inputValue: 'LIST', boxLabel: gettext('Only the following users or groups:')}
                ], listeners: {
                    change: function(grp, checked) {
                        this.editMode = checked.inputValue;
                        this.editorChooser.setDisabled(this.editMode !== 'LIST');
                        this.fireEvent("updated", this);
                    },
                    scope: this
                }},
                this.editorChooser.panel
            ]
        });
    },

    buildManagePermissionChooser: function() {
        this.managerChooser = this.buildUserChooser({
            store: this.managers,
            availableUserConfig: {
                listeners: {
                    load: function(store, recs, opts) {
                        store.filterBy(function(rec) {
                            return this.editors.findExact("username", rec.get("username")) == -1
                                && this.managers.findExact("username", rec.get("username")) == -1;
                        }, this);
                    },
                    scope: this
                }
            }
        });
        return new Ext.Panel({
            border: false, 
            items: [
                {html: "<strong>" +  gettext('Who can manage and edit this data?') + "</strong>", flex: 1, border: false},
                this.managerChooser.panel
            ]
        });
    },
    buildApplyChangesPanel: function (){
    	var applyButton = new Ext.Button({
    		
            scope: this,
            text : 'Save Changes',
            handler: function (){
            	alert("Your changes are saved");
            }
        });
    	if (!this.applyButtonRequired){
	        return new Ext.Panel({
	            border: false, 
	        });    		
    		
    	}else{
    	
	        return new Ext.Panel({
	            border: false, 
	            bodyStyle:'padding:8px 8px 8px',
	            items: [
	                    applyButton
	                    
	                    
	            ]
	        });
    	}
    }, 
    readPermissions: function(json) {
        this.editors.suspendEvents();
        this.managers.suspendEvents();
        
        this.lisenceAgreement = json['license_id'];
        
        if (json['authenticated'] == this.levels['readwrite']) {
            this.editMode = 'REGISTERED';
        } else if (json['authenticated'] == this.levels['readonly']) {
            this.viewMode = 'REGISTERED';
        }

        if (json['anonymous'] == this.levels['readonly']) {
            this.viewMode = 'ANYONE';
        }
        
        var payment_options = json['payment_options'];
	    if(payment_options != undefined ){
	        if(payment_options.length > 0 ){
	          	this.viewMode = 'PAID';
	        }
        }
       
        for (var i = 0; i < json.users.length; i++) {
            if (json.users[i][1] === this.levels['readwrite']) {
                this.editors.add(new this.editors.recordType({username: json.users[i][0]}, i + 500));
            } else if (json.users[i][1] === this.levels['admin']) {
                this.managers.add(new this.managers.recordType({username: json.users[i][0]}, i + 500));
            }
        }
        

        this.editors.resumeEvents();
        this.managers.resumeEvents();
        
        var paymentOptions = json['payment_options'];
        if(payment_options != undefined ){
	        this.peroidPaymentTypes.suspendEvents();
	        this.transactionPaymentTypes.suspendEvents();
	        for (var i = 0; i < paymentOptions.length ; i++){
				 paymentType   =   paymentOptions[i][0];
				 paymentAmount =   paymentOptions[i][1];
				 currencyType  =   paymentOptions[i][2];
				 typeDesc      =   paymentOptions[i][3];
				 paymentTyDesc =  paymentOptions[i][4];
	
				 if(this.payment_type_by_month_desc == paymentTyDesc){
					 var paymentData = {
							 payment_type_value:  paymentType,
							 payment: paymentAmount,
							 payment_currency : '' + currencyType,
							 payment_type_description : typeDesc,
							
							};
					 var r = new this.peroidPaymentTypes.recordType(paymentData, 100 + i); 		 
					 this.peroidPaymentTypes.add(r, i); 	 
				 }else{
					 var paymentByteData = {
							 payment_type_value: paymentType,
							 payment: paymentAmount,
							 payment_currency : currencyType,
							};
					 var r1 = new this.transactionPaymentTypes.recordType(paymentByteData, 200 + i); 		 
					 this.transactionPaymentTypes.add(r1, i); 					 
				 }
	        	
	        }
	        
	        var viewModeRd = json['viewMode'];
	        
	        if ( viewModeRd != '-1'){
				this.viewMode = viewModeRd;	
			}
	       			
	        this.peroidPaymentTypes.resumeEvents();
	        this.transactionPaymentTypes.resumeEvents();
        }
    },

    // write out permissions to a JSON string, suitable for sending back to the mothership
    writePermissions: function() {
    	
        var anonymousPermissions, authenticatedPermissions, perUserPermissions;
        if (this.viewMode === 'ANYONE') {
            anonymousPermissions = this.levels['readonly'];
        } else {
            anonymousPermissions = this.levels['none'];
        }

        
        if (this.editMode === 'REGISTERED') {
            authenticatedPermissions = this.levels['readwrite'];
        } else if (this.viewMode === 'REGISTERED') {
            //authenticatedPermissions = this.levels['readonly'];
        } else {
            authenticatedPermissions = this.levels['none'];
        }
       
        perUserPermissions = [];
        if (this.editMode === 'LIST') {
            this.editors.each(function(rec) {
                perUserPermissions.push([rec.get("username"), this.levels['readwrite']]);
            }, this);
        }

        this.managers.each(function(rec) {
            perUserPermissions.push([rec.get("username"), this.levels['admin']]);
        }, this);

        
        selectedPeriods = [];
        this.peroidPaymentTypes.each(function (rec) {
        	selectedPeriods.push([rec.get("payment_type_value"), rec.get('payment'), rec.get('payment_currency'), rec.get('licenseId')]);
        }, this);

        selectedTransaction = [];
        this.transactionPaymentTypes.each(function (rec) {
        	selectedTransaction.push([rec.get("payment_type_value"), rec.get('payment'), rec.get('payment_currency'), rec.get('licenseId')]);
        }, this);
        
        payment_options = [];
        
        if(this.viewMode === 'PAID'){
	        if(this.paymentTypeChooser.readPaymentType() == this.paymentTypeChooser.PAYMENT_BY_PERIOD){
	        	payment_options = selectedPeriods;
	        }else if(this.paymentTypeChooser.readPaymentType() == this.paymentTypeChooser.PAYMENT_BY_BYTE_USAGE){
	        	payment_options = selectedTransaction;
	        }
    	}
       
        return {
            anonymous: anonymousPermissions,
            authenticated: authenticatedPermissions,
            users: perUserPermissions,
            payment_options : payment_options,
            license_id : this.lisenceAgreement,
            viewMode   : this.viewMode
        };
    },

    doLayout: function() {
    	
    	
        this.liscgrdsm = new Ext.grid.CheckboxSelectionModel({
            checkOnly: true,
            singleSelect : true,
            renderer: function(v, p, record){
               return '<div class="x-grid3-row-checker">&#160;</div>';
              
            },
            listeners: {
                'beforerowselect' : function(sm, rowIndex, keepExisting, record){                  	
                	this.lisenceAgreement = record.get('id');	
                },
                'rowselect' : function (sm, rowIndex, r){
                	this.fireEvent("updated", this);
                },
                scope : this
            }
        });
        this.liscgrdsmcolumns = [
                        {
                            header: 'Title',
                            dataIndex: 'title',
                            id : 'title',
                            sortable: true,
                            width:200
                            
                          },
                          {
                              header: 'Action',
                              dataIndex: 'id',
                              id : 'id',
                              sortable: false,
                              width:60,
                              renderer: this.renderAction                	  
                           }

                        ];
        
        this.liscgrdsmcolumns.push(this.liscgrdsm);
        
        this.lisenceAgreementList = new Ext.grid.GridPanel({
        	store: this.lisenceAgreementStore,
            width: 260,
            height : 200,
            renderTo: this.renderTo,
            selModel:this.liscgrdsm,
            columns: this.liscgrdsmcolumns,
            frame: true,
            autoExpandColumn : 'title',
            bbar    : [
                       {
                         text    : 'Refresh',
                         handler : function() {
                        	 this.lisenceAgreementStore.reload({params: {query: 'payment_license_agreement_list'}
                             });
                         },
                         scope : this
                       } 
                   ]
          });
        
        
        this.uploadlicense = new Ext.ux.form.FileUploadField({
            id: 'licenseFile',
            emptyText: 'Select license file',
            name: 'licenseFile',
            allowBlank: false,
            fileUpload: true,
            listeners : {
            	scope : this,
            	fileselected : function (cmp, value){
            		if(this.licenseUploadForm.getForm().isValid()){
                		this.licenseUploadForm.getForm().submit({
                            url: '../payment/uploadLicense',
                            waitMsg: gettext('Uploading your License...'),
                            scope : this,
                            success: function uploaded(fp, o) {
                                alert("License Uploaded Successfully");
                           	 	this.lisenceAgreementStore.reload({params: {query: 'payment_license_agreement_list'}
                           	 	});
                           	    this.licenseUploadForm.getForm().reset();
                            },
                            failure: function(fp, o) {
                            	alert("Error Uploading License " + fp);
                           }
                        });
                		
            		}else{
            			alert('Please enter the license title ')
            		}

            	}
            }
            
        });
        
        this.licenseTitle = new Ext.form.TextField({
            name: 'licenseTitle',
            id: 'licenseTitle',
            width: 250,
            allowBlank:false,
            emptyText: 'License title'
            
        });
        
        this.licenseUploadForm = new Ext.form.FormPanel({
            width: 260,
            labelAlign: 'left',
            renderTo: this.renderTo,
            align:'left',
            labelWidth: 1,
            title: '<B>Upload License</B>',
            defaults: {
                anchor: '95%',
                msgTarget: 'side'
            },
            fileUpload: true,
            url : '../payment/uploadLicense',
            padding:1,
            frame: true,
            unstyled: true,
            items: [ this.licenseTitle, this.uploadlicense,
                     {
                xtype: "hidden",
                name: "csrfmiddlewaretoken",
                value: this.csrf_token
            }]

        });
        
        this.lisenceSelectionWindow = new Ext.Panel({
    	    title: 'Select License',
    	    renderTo: this.renderTo,
            width:260,
            collapsible:true,
            collapsed:this.licenseWindowClose,
            items: [
                    	this.lisenceAgreementList 
                    	,this.licenseUploadForm
                   ]
               			
          });
    	
        this.container = new Ext.Panel({
            renderTo: this.renderTo,
            border: false,
            items: [
                this.buildViewPermissionChooser(),
                this.lisenceSelectionWindow,
                this.buildEditPermissionChooser(),
                this.buildManagePermissionChooser(),
                this.buildApplyChangesPanel()
                
            ]
        });
    },renderAction: function(val){ 
	   	 var url = '../payment/license/'+val;
		 return '<a target = "_blank" href="' + url + '">'+ 'view' +'</a>';
    },licensePopup : function (url){
		popupWindow = window.open(
				url,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=yes')   	
    }
