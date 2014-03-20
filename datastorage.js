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
	
	this.getRawRows = function () {
		return rows;
	};

	//SET
	this.setDebug = function (value) {
		debug = value;
	};
	//Functions
	this.addColumn = function (configuration) {
		if (debug) {
			console.info("LocalDataStorage.addColumn()");
		}
		
		if ((configuration.name === undefined) || (configuration.name === null)) {
			console.error("Column name can not be null");
			return null;
		}
		
		if (configuration.name.substring(0,4) === "LDS_") {
			console.error("Columnprefix \"LDS_\" is reserved for internal functions");
			return null;
		}
		
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
				configuration.defaultvalue = this.validateValueString(configuration.defaultvalue);
			} else if (configuration.type === "number") {
				configuration.defaultvalue = this.validateValueNumber(configuration.defaultvalue);
			} else if (configuration.type === "boolean") {
				configuration.defaultvalue = this.validateValueBoolean(configuration.defaultvalue);
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
		if (debug) {
			console.info("Column \"" + configuration.name + "\" with type \"" + configuration.type + "\" added successfully");
		}
		return true;
	};
	
	this.addRow = function (row) {
		if (debug) {
			console.info("LocalDataStorage.addRow()");
		}
		
		var rawDataRow = {};
		
		//creating default values
		rawDataRow.LDS_ROWGUID = this.createRowGuid();
		rawDataRow.LDS_ROWVERSION = this.getCurrentRowVersion();
		
		if ((row !== undefined) && (row !== null)) {
			for (var i = 0;i < structure.length; i++) {
				var currentColumn = structure[i];
				
				if (row[currentColumn.name] !== undefined) {
					if (currentColumn.type === "string") {
						rawDataRow[currentColumn.name] = this.validateValueString(row[currentColumn.name]);
					} else if (currentColumn.type === "number") {
						rawDataRow[currentColumn.name] = this.validateValueNumber(row[currentColumn.name]);
					} else if (currentColumn.type === "boolean") {
						rawDataRow[currentColumn.name] = this.validateValueBoolean(row[currentColumn.name]);
					}
				} else {
					if ((currentColumn.nullable === false) && (configuration.defaultvalue === null)) {
						console.error("Column \"" + currentColumn.name + "\" can not be null");
					} else {
						rawDataRow[currentColumn.name] = configuration.defaultvalue;
					}
				}
			}
		}
		
		if (debug) {
			console.info(rawDataRow);
		}
		
		rows.push(rawDataRow);
		
		return rawDataRow;
	};
	
	this.select = function () {
		return this.selectRow();
	};
	
	this.selectRow = function () {
		
	};
	
	this.update = function () {
		return this.updateRow();
	};
	
	this.updateRow = function () {
		
	};
	
	this.deleteRow = function () {
		
	};
	
	this.validateValueString = function (value) {
		return String(value);
	};
	
	this.validateValueNumber = function (value) {
		var numberValue = parseInt(value);
		if (isNaN(numberValue)) {
			numberValue = 0;
		}
		return numberValue;
	};
	
	this.validateValueBoolean = function (value) {
		if (typeof(value) === "string") {
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
	
	this.getCurrentRowVersion = function () {
		//NOT YET IMPLEMENTED
		return 0;
	};
	
	this.createRowGuid = function ()
	{
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
	        return v.toString(16);
	    });
	};
	
	//INIT
	this.initiate = function (configuration) {

		if ((configuration !== undefined) && (configuration !== null)) {
			if ((configuration.id !== undefined) && (configuration.id !== null)) {
				id = configuration.id;
			}
			if ((configuration.debug !== undefined) && (configuration.debug !== null)) {
				debug = configuration.debug;
			}
		}
		if (debug) {
			console.info("LocalDataStorage.initiate()");
		}
	};
	
	this.initiate(configuration);
};
