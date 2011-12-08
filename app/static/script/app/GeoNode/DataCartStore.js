Ext.namespace("GeoNode"); 



GeoNode.DataCartStore = Ext.extend(Ext.data.Store, {
    getCookie:function(c_name){
        var i,x,y,ARRcookies=document.cookie.split(";");
	    for (i=0;i<ARRcookies.length;i++){
            x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
            y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
            x=x.replace(/^\s+|\s+$/g,"");
            if (x==c_name){
                  return unescape(y);
            }
        }
    },
    loadList:function(){
       var shoppingList = this.getCookie("shoppingList");
       var list = Ext.decode(shoppingList); 
       if (list) for(var i=0;i<list.length;i++){
           var record = list[i];
           var rType = Ext.data.Record.create([ 'name', 'title']);
           var myrec = new rType({
               "name":record.name,
               "title":record.title
           });
           myrec.id = record.name;
           this.add(myrec);
       }
    },
    saveList:function(){
       var toSave = [];
       var records = this.data.items;
       for(var i=0;i<records.length;i++){
           var record = records[i].json;
           if (!record){
               record = records[i].data;
           }
           var theRecord ={
               name:record.name,
               title:record.title
           }
           toSave.push(theRecord) ;
       }
       var ret = Ext.encode(toSave);
       document.cookie="shoppingList="+ret;
    },

    constructor : function(config) {
        this.selModel = config.selModel;
        this.reselecting = false; 
        
        this.selModel.on('rowselect', function(model, index, record) {
            if (this.reselecting == true) {
                return;
            }
            record.id = record.json.name;
            if (this.indexOfId(record.id) == -1) {
                this.add([record]);
                this.saveList();
            }
        }, this);
        this.selModel.on('rowdeselect', function(model, index, record) {
            if (this.reselecting == true) {
                return;
            }

            var index = this.indexOfId(record.id)
            if (index != -1) {
                this.removeAt(index);
                this.saveList();
            }
        }, this);
        
        GeoNode.DataCartStore.superclass.constructor.call(this, config);
        this.loadList();
    },
    
    reselect: function() {
        this.reselecting = true;
        this.selModel.clearSelections();
        var store = this.selModel.grid.store;
        this.each(function(rec) {
            var index = store.indexOfId(rec.id);
            if (index != -1) {
                this.selModel.selectRow(index, true);
            }
            return true;
        }, this);
        this.reselecting = false;
        this.saveList();
    }
});

