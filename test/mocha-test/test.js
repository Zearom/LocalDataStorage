var assert = require("assert");
var LocalDataStorage = require("../../datastorage.module.min.js");

var db = new LocalDataStorage({debug:false});

//creating Structure
db.addColumn({name:"id", type:"number", nullable:false});
db.addColumn({name:"givenname", type:"string", nullable:true});
db.addColumn({name:"surname", type:"string", nullable:true});
db.addColumn({name:"mail", type:"string", nullable:false});
db.addColumn({name:"city", type:"string", nullable:true});
db.addColumn({name:"zipcode", type:"string", nullable:true});
db.addColumn({name:"street", type:"string", nullable:true});
db.addColumn({name:"houseno", type:"string", nullable:true});
db.addColumn({name:"active", type:"boolean", nullable:false, defaultvalue:true});

//add some rows
var i = 0;
db.addRow({id:++i, givenname:"Peter", surname:"Müller", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Wolfgang", surname:"Weber", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Michael", surname:"Schneider", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Werner", surname:"Fischer", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Klaus", surname:"Weber", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Thomas", surname:"Meyer", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Manfred", surname:"Wagner", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Helmut", surname:"Becker", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Jürgen", surname:"Schulz", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Heinz", surname:"Hoffmann", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Gerhard", surname:"Schäfer", mail:"testmail." + i + "@example.org"});


describe('LocalDataStorage', function(){
	describe('#getStructure()', function(){
		it('should return 9 Columns', function(){
			assert.equal(9, db.getStructure().length);
		});
		it('Column Id should be not nullable', function(){
			assert.equal(false, db.getStructure()[0].nullable);
		});
		it('Column \"active\" should be of type \"boolean\"', function(){
			assert.equal("boolean", db.getStructure()[8].type);
		});
		it('Column \"active\"\' defaultsvalue should be of \"true\"', function(){
			assert.equal(true, db.getStructure()[8].defaultvalue);
		});
	}),
	describe('#selectRow()', function(){
		it('should return 10 objects when selecting without selector', function(){
			assert.equal(11, db.select(null, null, 0).length);
		});
		it('should return 10 objects when selecting withselector function(){return true;}', function(){
			assert.equal(11, db.select(function(){return true;}, null, 0).length);
		});
		it('should return 5 objects when selecting withselector function(){return true;} with limit 5', function(){
			assert.equal(5, db.select(function(){return true;}, null, 5).length);
		});
		it('should return 5 objects when selecting with selector function(){return true;} with limit 5 and sort \"surname\" DESC', function(){
			assert.equal("Weber", db.select(function(){return true;}, {name:"surname", direction:"DESC"}, 5)[0].surname);
		});
		it('should return 5 objects when selecting with selector function(){return true;} with limit 5 and sort \"surname\" DESC and \"givenname\" ASC', function(){
			assert.equal("Wolfgang", db.select(function(){return true;}, [{name:"surname", direction:"DESC"}, {name:"givenname", direction:"DESC"}] , 5)[0].givenname);
		});
	});
	describe('#updateRow()', function(){
		it('should return 11 when updating all entries column "city"', function(){
			assert.equal(11, db.updateRow(function(){return true;}, {city:"Berlin"}));
			assert.equal("Berlin", db.select(null, null, 1)[0].city);
		});
	});
});