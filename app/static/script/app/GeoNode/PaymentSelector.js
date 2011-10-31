Ext.namespace("GeoNode");
GeoNode.PaymentSelector = Ext.extend(Ext.util.Observable, {

    constructor: function (config) {
    	Ext.apply(this, config);
    	this.initPeriodStore();
        this.panel = this.doLayout();
    },
    initPeriodStore: function () {
    	
    	
   	    if (!this.peroidPaymentTypes) {
            this.peroidPaymentTypes = new Ext.data.ArrayStore({
                idIndex: 0,
                fields: ['payment_type_value', 'payment'],
                data: []
            });
        }
    	
    	this.periodStore = new Ext.data.ArrayStore({
    		 storeId: 'periodStore',
    		idIndex: 0,
    		id:0,
	        fields: ['payment_type_description', 'payment_type_value', 'payment'],
	        data:[
	                    [ '3 Months', '1',  '0'],
	                    ['6 Months', '2',  '0'],
	                    ['9 Months',  '4',  '0']
	                ] 
	    });
    	

    	 
    	 if (!this.transactionPaymentTypes) {
             this.transactionPaymentTypes = new Ext.data.ArrayStore({
                 idIndex: 0,
                 fields: ['payment', 'payment_type_value'],
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
    	 
     	this.paymentTypeStore = new Ext.data.ArrayStore({
     		storeId: 'paymentTypeStore',
    		idIndex: 0,
    		id:0,
   	        fields: ['payment_type_desc'],
   	        data:[
   	                    [ 'By Periods'],
   	                    ['By Byte']
   	             ] 
   	    });
     	
    	 
    	 
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
            lazyRender:true,
            mode: 'local',
            align: 'right',
            border: 'false',
            displayField: 'payment_type_description',
		    valueField: 'payment_type_value',
		    mode: 'local',
		    triggerAction: 'all',
            emptyText: gettext("Add Period..."),
            listeners: {
                scope: this
            }
        });
        this.paymentAmount = new Ext.form.NumberField({
            name: 'periodCost',
            id: 'periodCost',
            width: 130,
            emptyText: 'Enter dollor cost for period',
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
            width: 150,
            store: this.paymentTypeStore,
            typeAhead: true,
            lazyRender:true,
            mode: 'local',
            align: 'right',
            border: 'false',
            displayField: 'payment_type_desc',
		    valueField: 'payment_type_desc',
		    mode: 'local',
		    triggerAction: 'all',
            emptyText: gettext("Select Payment Type..."),
            listeners: {
                scope: this,
                'select': function( combo, index, scrollIntoView) {
                  if(combo.getValue() == 'By Periods'){
                	  this.setDisabledPeriodOptions(false);
                	  this.setDisabledTransactionOptions(true);
                  }else if (combo.getValue() == 'By Byte'){
                	  this.setDisabledPeriodOptions(true);
                	  this.setDisabledTransactionOptions(false);
                  }
                }
                
            }       	
        });
        
        this.transactionPayment = new Ext.form.NumberField({
            name: 'transactionPayment',
            id: 'transactionPayment',
            width: 180,
            emptyText: 'Enter dollor cost per byte..',
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
                                	this.paymentTypeSelector
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
    	if(disabled){
    		this.setDisabledPeriodOptions(disabled);
    		this.setDisabledTransactionOptions(disabled);
    	}
    },
    setDisabledPeriodOptions: function (disable){
    	this.paymentByPeriodPanel.setDisabled(disable);
    },
    setDisabledTransactionOptions: function (disable){
    	this.transactionPaymentPanel.setDisabled(disable);
    },
    readPaymentType: function (){
    	return this.paymentTypeSelector.getValue();
    }
    
});
