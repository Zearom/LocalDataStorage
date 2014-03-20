var LocalDataStorage = function (configuration) {
	var id = "";
	var structure = [];
	var rows = [];
	var debug = false;
	//GET
	this.getId = function () {
		return id;
	};
	
	this.getStructure = function () {
		return structure;
	};
	
	this.isDebug = function () {
		return debug;
	};

	//SET
	this.setDebug = function (value) {
		debug = value;
	};
	//Functions
	this.addColumn = function (configuration) {
		for (var i = 0; i < structure.length;i++) {
			var currentColumn = structure[i];
			
			if (currentColumn.name === configuration.name) {
				console.error("Column \"" + configuration.name + "\" already exists");
				return null;
			}
		}
		
		if (configuration.type === undefined) {
			configuration.type = "string";
		}
		
		if ((configuration.type !== "string") && (configuration.type !== "number") && (configuration.type !== "boolean")) {
			console.error("Column \"" + configuration.name + "\" does not support datatype \"" + configuration.type + "\"");
			return null;
		}
		
		if ((configuration.defaultvalue !== undefined) && (configuration.defaultvalue !== null)) {
			
			if (configuration.type === "string") {
				configuration.defaultvalue = this.validateDefaultValueString(configuration.defaultvalue);
			} else if (configuration.type === "number") {
				configuration.defaultvalue = this.validateDefaultValueNumber(configuration.defaultvalue);
			} else if (configuration.type === "boolean") {
				configuration.defaultvalue = this.validateDefaultValueBoolean(configuration.defaultvalue);
			}
		} else {
			configuration.defaultvalue = null;
		}
		
		if ((configuration.nullable !== undefined) && (configuration.nullable !== null)) {
			if ((configuration.nullable !== true) && (configuration.nullable !== false)) {
				configuration.nullable = true;
			}
		} else {
			configuration.nullable = true;
		}
		
		
		structure.push({"name":configuration.name, "type": configuration.type, "defaultvalue":configuration.defaultvalue, "nullable":configuration.nullable});
		
		return true;
	};
	
	this.addRow = function (row) {
		var rawDataRow = {};
		
		if ((row !== undefined) && (row !== null)) {
			for (var i = 0;i < structure.length; i++) {
				var currentColumn = structure[i];
				
				if (row[currentColumn.name] !== undefined) {
					rawDataRow[currentColumn.name] = row[currentColumn.name]; 
				} else {
					if ((currentColumn.nullable === false) && (configuration.defaultvalue === null)) {
						console.error("Column \"" + currentColumn.name + "\" can not be null");
					} else {
						rawDataRow[currentColumn.name] = configuration.defaultvalue;
					}
				}
			}
		}
		
		return rawDataRow;
	};
	
	this.validateDefaultValueString = function (value) {
		return String(value);
	};
	this.validateDefaultValueNumber = function (value) {
		console.log(value);
		var numberValue = parseInt(value);
		if (isNaN(numberValue)) {
			numberValue = 0;
		}
		console.log(numberValue);
		return numberValue;
	};
	this.validateDefaultValueBoolean = function (value) {
		if (typeof(value) === "boolean") {
			
		} else if (typeof(value) === "string") {
			if (value.toLowerCase() === "true") {
				value = true;
			} else if (value.toLowerCase() === "false") {
				value = false;
			} else {
				value = null;
			}
		} else if (typeof(value) === "number") {
			if (value === 1) {
				value = true;
			} else if (value === 0) {
				value = false;
			} else {
				value = null;
			}
		} else if (typeof(value) === "object") {
			value = null;
		}
		return value;
	};
	
	this.addRow = function(row) {
		
	};
	
	//INIT
	this.initiate = function (configuration) {
		if ((configuration !== undefined) && (configuration !== null)) {
			if ((configuration.id !== undefined) && (configuration.id !== null)) {
				id = configuration.id;
			}
		}
	};
	
	this.initiate(configuration);
};
