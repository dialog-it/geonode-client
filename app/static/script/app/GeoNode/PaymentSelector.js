Ext.namespace("GeoNode");
GeoNode.PaymentSelector = Ext.extend(Ext.util.Observable, {

    constructor: function (config) {
    	Ext.apply(this, config);
    	this.initPeriodStore();
        this.panel = this.doLayout();
    },
    initPeriodStore: function () {
    	this.periodStore = new Ext.data.ArrayStore({
    		 storeId: 'periodStore',
    		idIndex: 0,
    		id:0,
	        fields: ['payment_type_description', 'payment_type_value', 'periodCost'],
	        data:[
	                    [ '3 Months', '1',  '0'],
	                    ['6 Months', '2',  '0'],
	                    ['9 Months',  '4',  '0']
	                ] 
	    });
    	
    	 if (!this.store) {
             this.store = new Ext.data.ArrayStore({
                 idIndex: 0,
                 fields: ['payment_type_description', 'payment_type_value', 'periodCost'],
                 data: []
             });
         }
    	 
    	 
    },
    doLayout: function () {
        var owner = this.owner;
        var plugin = (function () {
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
            store: this.store,
            itemSelector: 'div.period_item',
            tpl: new Ext.XTemplate('<div><tpl for="."> <div class="x-btn period_item"><button class="icon-removeuser remove-button">&nbsp;</button>${periodCost} for {payment_type_description} </div></tpl></div>'),
            plugins: [plugin],
            autoHeight: true,
            multiSelect: true
            
        });
        
        function addSelectedPeriod() {	
            var value = this.availablePeriods.getValue();
            var index = this.availablePeriods.store.findExact('payment_type_value', value);
            if (index != -1 &&
                this.selectedPeriods.store.findExact('payment_type_value', value) == -1
            ) {
            	period_obj = this.availablePeriods.store.getAt(index);
            	period_obj.set('periodCost', this.paymentAmount.getValue());
                this.selectedPeriods.store.add([period_obj]);
                this.availablePeriods.reset();
                this.paymentAmount.reset();
            }        
        }
        this.addButton = new Ext.Button({
            iconCls: 'icon-adduser',
            handler: addSelectedPeriod,
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
        this.paymentAmount = new Ext.form.TextField({
            name: 'periodCost',
            id: 'periodCost',
            width: 130,
            emptyText: 'Enter cost for period',
            listeners: {
           		scope: this,
           		specialkey: function(f,e){
                    if (e.getKey() == e.ENTER) {
                    	this.addSelectedPeriod;
                    }
           		}
            }
        });
        return new Ext.Panel({
        	
            border: false,
            renderTo: this.renderTo,
            width:400,
            items: [
            {
                border: false,
                items: [
                        { layout: 'hbox', border: false, items: [ this.addButton, this.availablePeriods, this.paymentAmount ]},
                        this.selectedPeriods
                        ]
            }]
        });
    },
    setDisabled: function (disabled) {
    	this.addButton.setDisabled(disabled);
    	this.availablePeriods.setDisabled(disabled);
    	this.paymentAmount.setDisabled(disabled);
    	this.selectedPeriods.setDisabled(disabled);
    },
    readSelectedPeriods: function (){
    	var store = this.selectedPeriods.getStore();
    	var records =  this.store.getRange();
    	var datar = new Array();
        for (var i = 0; i < records.length; i++) {
            datar.push(records[i].data);
        }
        return datar;
    }
    
});

