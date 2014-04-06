LocalDataStorage.js
================

This is a ECMAScript-based persistence library, with support for localStorage (http://www.w3.org/TR/webstorage/#storage).

## Development state

This library is currently under heavy development, and not ready for productive use. For the first release i want to reach the following milestones

* Milestone 1: Completing the documentation
* Milestone 2: Changing the row-storage to an array-based system for performance and filesize optimizing
* Milestone 3: Completing the testsuite powered by mocha

--> Release 1

* Milestone 4: add/select/update/delete functions should be run asynchronous on demand 
* Milestone 5: Restore/Store views from/to persistency-controller
* Milestone 6: API for remote synchronization

## Getting started

LocalDataStorage.js is really easy to use. Include the LocalDataStorage.min.js and you can start with the following example.

```javascript

// initialize the LocalDataStorage object
var db = new LocalDataStorage({id:"users"});

// creating the structure
db.addColumn({name:"id", type:"number", nullable:false});
db.addColumn({name:"givenname", type:"string", nullable:true});
db.addColumn({name:"surname", type:"string", nullable:true});
db.addColumn({name:"mail", type:"string", nullable:false});

//add some rows
var i = 0;
db.addRow({id:++i, givenname:"Peter", surname:"Müller", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Wolfgang", surname:"Weber", mail:"testmail." + i + "@example.org"});
db.addRow({id:++i, givenname:"Michael", surname:"Schneider", mail:"doesnotexists." + i + "@example.org"});
db.addRow({id:++i, givenname:"Werner", surname:"Fischer", mail:"testmail." + i + "@example.org"});
```

Now we create a database with structure and content, so we can now query:

```javascript
var results = db.selectRow(function () { 
	if (this.givenname === "Michael") {
		return true;
	}
});

for (var i = 0; i < results.length; i++) {
	console.log("Michaels mail-adress is \"" + results[i].mail + "\"");
}
```

Oooh! I made a mistake with michaels mail-address. So now we want to update my mistake:

```javascript

db.update(function () { 
	if (this.givenname === "Michael") {
		return true;
	}
}, {mail:"michael.schneider@example.org"});

```

Ok! Now its time to delete data:

```javascript

db.delete(function () { 
	if (this.givenname === "Werner") {
		return true;
	}
});
```

