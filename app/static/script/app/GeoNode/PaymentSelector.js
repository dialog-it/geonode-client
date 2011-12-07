Ext.namespace("GeoNode");
GeoNode.PaymentSelector = Ext.extend(Ext.util.Observable, {

	paymentType : null,
	currency :  null,
	payment_options : null,
	
	edit_period : false,
	edit_byte : false,

	PAYMENT_BY_PERIOD : 'By Period',
	PAYMENT_BY_BYTE_USAGE : 'By Byte Usage',

	csrf_token : null, 
	
    constructor: function (config) {
    	Ext.apply(this, config);
    	
    	this.initPeriodStore();
        this.payment_options = config.payment_options;
        this.csrf_token = config.csrf_token;
    	this.panel = this.doLayout();
        this.setDisabled(true);
    },
    initPaymentOptions: function (payment_options){
    	    	
    	 if(payment_options != undefined ){
    		 if(payment_options.length > 0 && this.periodStore.getCount() > 0){
    			 for (var i = 0; i < payment_options.length ; i++){
    				 paymentType   =   payment_options[i][0];    				
    				 if (this.periodStore.find('payment_type_value', paymentType) >=  0){
    					 this.paymentTypeSelector.setValue( this.PAYMENT_BY_PERIOD);	
    					 this.setInitialPeriodOptionsforEditing();
    				 }else{
    					 this.paymentTypeSelector.setValue(  this.PAYMENT_BY_BYTE_USAGE );
    					 this.setinitialByteOptionForEditing(); 
    				 }
    				 this.currencyTypeSelector.setValue( currencyType );
    				 
    			 }

    		 }
    	 }
    },

    initPeriodStore: function () {
    	
    	
    	if (!this.peroidPaymentTypes) {
         this.peroidPaymentTypes = new Ext.data.ArrayStore({
                idIndex: 0,
                fields: ['payment_type_value', 'payment', 'payment_currency', 'payment_type_description'],
                data: []
            });
    	}

    	 if (!this.transactionPaymentTypes) {
             this.transactionPaymentTypes = new Ext.data.ArrayStore({
                 idIndex: 0,
                 fields: ['payment', 'payment_type_value', 'payment_currency'],
                 data: []
             });
         }
    	 
    	 if (!this.availabletransactions) {
             this.availabletransactions = new Ext.data.ArrayStore({
                 idIndex: 0,
                 id:0,
        		 storeId: 'availabletransactions',
                 fields: ['payment', 'numberOfTransactions', 'payment_type_value'],
                 data:[ ['0', '1', '5'] ]
             });
         }

         
         if (!this.paymentTypeStore) {
             var cfg = {
                 proxy: new Ext.data.HttpProxy({ url: '/payment/payment_options_lookup', method: 'POST' }),
                 reader: new Ext.data.JsonReader({
                     root: 'payment_options',
                     fields: [{name: 'payment_type_desc'}]
                 })
             };
             Ext.apply(cfg);
             this.paymentTypeStore = new Ext.data.Store(cfg);
             this.paymentTypeStore.load({params: {query: ''},
            	 	callback: function (r, options, success){
            	 		this.paymentTypeStore.add(r);
            	 	},
					scope : this
             
             });
         } 

         if (!this.CurrencyTypeStore) {
             var cfg = {
                 proxy: new Ext.data.HttpProxy({ url: '/payment/payment_currency_options', method: 'POST' }),
                 reader: new Ext.data.JsonReader({
                     root: 'payment_currency_options',
                     fields: [{ name : 'currency_id'},
                              { name : 'currency_type_code'}
                     		]
                 })
             };
             Ext.apply(cfg);
             this.CurrencyTypeStore = new Ext.data.Store(cfg);
             this.CurrencyTypeStore.load({
            	 						  params: {query: ''},
            	 						  callback: function (r, options, success){
            	 							  this.CurrencyTypeStore.add(r);
            	 						  	},
            	 						  	scope : this
            	 					});
         }


         if (!this.periodStore) {
             var cfg = {
                 proxy: new Ext.data.HttpProxy({ url: '/payment/payment_period_options', method: 'POST' }),
                 reader: new Ext.data.JsonReader({
                     root: 'payment_period_options',
                     fields: [{ name : 'payment_type_description'},
                              { name : 'payment_type_value'},
                              { name : 'payment'}
                     		]
                 })
             };
             Ext.apply(cfg);
             this.periodStore = new Ext.data.Store(cfg);
             this.periodStore.load({params: {query: ''},
             	callback: function (r, options, success){
             		this.periodStore.add(r);
         	 		this.initPaymentOptions(this.payment_options);
         	 	},
 				 scope : this,
          
          });
         }

         
         
    	 
    },
    doLayout: function () {
        var owner = this.owner;
        var periodOptionPlugin = (function () {
            var view;

            function init(v) {
            	 view = v;
                 view.on('render', addHooks);
            }

            function addHooks() {
            	 view.getEl().on('mousedown', removeItem, this, { delegate: 'button' });
            }

            function removeItem(e, target) {
            	 var item = view.findItemFromChild(target);
                 var idx = view.indexOf(item);
                 var rec = view.store.getAt(idx);
                 if (rec.get("payment_type_value") !== owner) {
                     view.store.removeAt(view.indexOf(item));
                 }
            }
            return {
                init: init
            };
        })();

        var transactoinOptionPlugin = (function () {
            var view;

            function init(v) {
            	 view = v;
                 view.on('render', addHooks);
            }

            function addHooks() {
            	 view.getEl().on('mousedown', removeItem, this, { delegate: 'button' });
            }

            function removeItem(e, target) {
            	 var item = view.findItemFromChild(target);
                 var idx = view.indexOf(item);
                 var rec = view.store.getAt(idx);
                 if (rec.get("payment_type_value") !== owner) {
                     view.store.removeAt(view.indexOf(item));
                 }
            }
            return {
                init: init
            };
        })();
        
        
        this.selectedPeriods = new Ext.DataView({
            store: this.peroidPaymentTypes,
            itemSelector: 'div.period_item',
            tpl: new Ext.XTemplate('<div><tpl for="."> <div class="x-btn period_item"><button class="icon-removeuser remove-button">&nbsp;</button>${payment} for {payment_type_description} </div></tpl></div>'),
            plugins: [periodOptionPlugin],
            autoHeight: true,
            multiSelect: true
            
        });


        this.transactionPayments = new Ext.DataView({
            store: this.transactionPaymentTypes,
            itemSelector: 'div.paymentTransaction_item',
            tpl: new Ext.XTemplate('<div><tpl for="."> <div class="x-btn paymentTransaction_item"><button class="icon-removeuser remove-button">&nbsp;</button> ${payment} per byte</div></tpl></div>'),
            plugins: [transactoinOptionPlugin],
            autoHeight: true,
        	multiSelect: true
        });
        
        function addSelectedPeriod() {	
            var value = this.availablePeriods.getValue();
            var index = this.availablePeriods.store.findExact('payment_type_value', value);
            if (index != -1 &&
                this.selectedPeriods.store.findExact('payment_type_value', value) == -1 &&
                this.paymentAmount.getValue() != ''
            ) {
            	period_obj = this.availablePeriods.store.getAt(index);
            	period_obj.set('payment', this.paymentAmount.getValue());
            	period_obj.set('payment_currency', this.currencyTypeSelector.getValue());
       
                this.selectedPeriods.store.add([period_obj]);
                this.availablePeriods.reset();
                this.paymentAmount.reset();
       	

            }         
        }
        
        function addTransactionPayment() {	
   
			var value = this.transactionPayment.getValue();
			
			var transaction_obj = this.availabletransactions.getAt(0);
            var index = this.transactionPayments.store.findExact('numberOfTransactions','1');
			if(index < 0 && value != ''){
				transaction_obj.set('payment', value);
				transaction_obj.set('payment_currency', this.currencyTypeSelector.getValue());
			
				this.transactionPayments.store.add([transaction_obj]);
				this.transactionPayment.reset();
			}
		}
        
        
        this.periodAddButton = new Ext.Button({
            iconCls: 'icon-adduser',
            handler: addSelectedPeriod,
            scope: this
        });
        this.transactionAddButton = new Ext.Button({
            iconCls: 'icon-adduser',
            handler: addTransactionPayment,
            scope: this
        });
        this.availablePeriods = new Ext.form.ComboBox({
            width: 100,
            store: this.periodStore,
            typeAhead: true,
            mode: 'remote',
            align: 'right',
            border: 'false',
            minChars: 0,
            displayField: 'payment_type_description',
		    valueField: 'payment_type_value',
		    triggerAction: 'all',
            emptyText: gettext("Add Period..."),
            listeners: {
                scope: this
            }
        });
        this.paymentAmount = new Ext.form.TextField({
            name: 'periodCost',
            id: 'periodCost',
            width: 130,
            allowBlank:false,
            emptyText: 'Enter dollars cost for period',
            listeners: {
           		scope: this,
           		specialkey: function(f,e){
                    if (e.getKey() == e.ENTER) {
                    	this.addSelectedPeriod;
                    }
           		}
            }
        });
        this.paymentTypeSelector =  new Ext.form.ComboBox({
            width: 130,
            store: this.paymentTypeStore,
            typeAhead: true,
            align: 'right',
            minChars: 0,
            border: 'false',
            mode: 'remote',
            displayField: 'payment_type_desc',
		    valueField: 'payment_type_desc',
		    value: this.paymentType,
            emptyText: gettext("Select Payment Type..."),
            listeners: {
                scope: this,
                'select': function( combo, index, scrollIntoView) {
                  if(combo.getValue() === this.PAYMENT_BY_PERIOD){
                	  this.setDisabledPeriodOptions(false);
                	  this.setDisabledTransactionOptions(true);
                  }else if (combo.getValue() === this.PAYMENT_BY_BYTE_USAGE){
                	  this.setDisabledPeriodOptions(true);
                	  this.setDisabledTransactionOptions(false);
                  }
                }
                
            }       	
        });
        
        this.currencyTypeSelector =  new Ext.form.ComboBox({
        	width: 130,
            store: this.CurrencyTypeStore,
            typeAhead: true,
            triggerAction: 'all',
            mode: 'remote',
            minChars: 0,
            border: 'false',
            displayField: 'currency_type_code',
		    valueField: 'currency_id',
		    value:this.currency,
            emptyText: gettext("Select Currency..."),
            listeners: {
                scope: this
            }       	
        });
        

        
        this.transactionPayment = new Ext.form.TextField({
            name: 'transactionPayment',
            id: 'transactionPayment',
            width: 180,
            allowBlank:false,
            emptyText: 'Enter dollars cost per byte..',
            listeners: {
           		scope: this
            }
        });
        
        this.paymentSelectorPanel = new Ext.Panel({
            border: false,
            renderTo: this.renderTo,
            width:400,
            height:28,
            items: [
                    {
                        border: false,
                        items: [                                	
                                {layout: 'hbox', border: false, items: [ this.paymentTypeSelector, this.currencyTypeSelector ]}
                               ]
                    }]           
        });
        
        this.paymentByPeriodPanel =  new Ext.Panel({
            border: false,
            renderTo: this.renderTo,
            width:400,
            
            items: [
                    {
                        border: false,
                        items: [
                                 { layout: 'hbox', border: false, items: [ this.periodAddButton, this.availablePeriods, this.paymentAmount ]} ,
                                 this.selectedPeriods
                               ]
                    }]           
        });
        
        this.transactionPaymentPanel = new Ext.Panel({
            border: false,
            renderTo: this.renderTo,
            width:400,
            items: [
                    {
                        border: false,
                        items: [
                                 { layout: 'hbox', border: false, items: [this.transactionAddButton, this.transactionPayment] },
                                 this.transactionPayments
                               ]
                    }]           
        });
        
       

        
       
        
        return new Ext.Panel({
        	
            border: false,
            renderTo: this.renderTo,
            width:400,
            items: [
            {
                border: false,
                items: [
                        this.paymentSelectorPanel,
                        this.paymentByPeriodPanel,
                        this.transactionPaymentPanel
                        ]
            }]
        });

        
    }, 
    setDisabled: function (disabled) {
    	
    	this.paymentSelectorPanel.setDisabled(disabled);

   		if(!disabled){
    		

    		if(this.paymentTypeSelector.getValue() == this.PAYMENT_BY_BYTE_USAGE){
    			this.setDisabledPeriodOptions(true);
    			this.setDisabledTransactionOptions(false);
   			}
    		if(this.paymentTypeSelector.getValue() == this.PAYMENT_BY_PERIOD){
    			this.setDisabledTransactionOptions(true);
    			this.setDisabledPeriodOptions(false);
    		}
    	}else{
    		this.setDisabledPeriodOptions(disabled);
    		this.setDisabledTransactionOptions(disabled);
    		
    	}  
    },
    setDisabledPeriodOptions: function (disable){
    	this.paymentByPeriodPanel.setDisabled(disable);
    	
    },
    setDisabledTransactionOptions: function (disable){
    	this.transactionPaymentPanel.setDisabled(disable);
    	
    },setInitialPeriodOptionsforEditing : function (){
    	
    	this.paymentSelectorPanel.setDisabled(false);
    	this.setDisabledPeriodOptions(false);
    	this.setDisabledTransactionOptions(true);
    	
    	
    	
    },setinitialByteOptionForEditing: function (){
    	this.paymentSelectorPanel.setDisabled(false);
    	this.setDisabledPeriodOptions(true);
    	this.setDisabledTransactionOptions(false);
    	 

    },
    readPaymentType: function (){
    	return this.paymentTypeSelector.getValue();
    }
    
});

