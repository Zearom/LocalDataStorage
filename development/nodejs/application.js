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
db.addRow({id:++i, givenname:"Wolfgang", surname:"Schmidt", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Michael", surname:"Schneider", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Werner", surname:"Fischer", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Klaus", surname:"Weber", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Thomas", surname:"Meyer", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Manfred", surname:"Wagner", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Helmut", surname:"Becker", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Jürgen", surname:"Schulz", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Heinz", surname:"Hoffmann", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Gerhard", surname:"Schäfer", mail:"testmail." + i + "@example.org"});

console.log(db.updateRow(function() { return true;}, {surname:"Krüger"}));

console.log(db.select(null, [{name:"surname", direction:"ASC"}, {name:"givenname", direction:"ASC"}], 0));
console.log(db.select(null, {name:"mail", direction:"DESC"}, 0));

console.log(db.select(function() { if (this.givenname==="Helmut") { return true;}}, null, 0));