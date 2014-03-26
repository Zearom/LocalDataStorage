/**
 * Defines an instance of the LocalDataStorage Class.  
 * @constructor
 * @param {string} configuration - Storage-Configuration
 */
function LocalDataStorage (configuration) {
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
	
	//Public Functions
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
		rawDataRow.LDS_ROWVERSION = this.getCurrentRowVersion(true);
		rawDataRow.LDS_DELETED = false;
		
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
					if ((currentColumn.nullable === false) && (currentColumn.defaultvalue === null)) {
						console.error("Column \"" + currentColumn.name + "\" can not be null");
					} else {
						rawDataRow[currentColumn.name] = currentColumn.defaultvalue;
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
	
	/** Select-Function
	 * @param {function} selector - Function for selecting specific datarow
	 * @param {array} sort - Sort-Parameter 
	 * @param {number} limit - limits the result-table
	 * 
	 * */
	this.select = function (selector, sort, limit) {
		return this.selectRow(selector, sort, limit);
	};
	
	this.selectRow = function (selector, sort, limit) {
		var resultSet = [];
		var tmpResultSet = [];
		
		limit = limit || 0;
		
		//Selecting
		var rowList = getRowIndexListBySelector(selector);
		
		for (var i = 0; i < rowList.length; i++) {
			tmpResultSet.push(rows[rowList[i]]);
		}
		
		if ((sort !== undefined) && (sort !== null)) {
			if (!isArray(sort)) {
				var newSort = [];
				newSort.push(sort);
				sort = newSort;
			}
			if (debug) {
				console.log(sort);
			}
			
			tmpResultSet.sort(function (a, b){
				return sortRow(a, b, sort, 0);
			});
		}
		
		//Creating the result
		for (var j = 0; j < tmpResultSet.length; j++) {
			if ((limit === 0) || (j < limit)) {
				resultSet.push(cloneRow(tmpResultSet[j], structure));
			}
		}
		
		return resultSet;
	};
		
	this.update = function (selector, data) {
		return this.updateRow(selector, data);
	};
	
	this.updateRow = function (selector, data) {
		if (debug) {
			console.info("LocalDataStorage.updateRow()");
		}
		
		if (!data) {
			throw new Error("data can not be null");
		}
		
		var rowList = getRowIndexListBySelector(selector);
		var updatedRowCount = 0;
		
		for (var i = 0; i < rowList.length; i++) {
			var rowUpdated = false;
			for (var j = 0;j < structure.length; j++) {
				var dataValue = data[structure[j].name];
				var currentColumn = structure[j];
				
				if (dataValue !== undefined) {
					if (dataValue === null) {
						if (structure[j].nullable) {
							rows[rowList[i]][structure[j].name] = null;
							rowUpdated = true;
						} else {
							console.error("Column \"" + currentColumn.name + "\" can not be null");
						}
					} else if (currentColumn.type === "string") {
						rows[rowList[i]][structure[j].name] = this.validateValueString(dataValue);
						rowUpdated = true;
					} else if (currentColumn.type === "number") {
						rows[rowList[i]][structure[j].name] = this.validateValueNumber(dataValue);
						rowUpdated = true;
					} else if (currentColumn.type === "boolean") {
						rows[rowList[i]][structure[j].name] = this.validateValueBoolean(dataValue);
						rowUpdated = true;
					}
				}
			}
			
			if (rowUpdated) {
				rows[rowList[i]].LDS_ROWVERSION = this.getCurrentRowVersion(true);
				updatedRowCount++;
			}
		}
		return updatedRowCount;
	};
	
	this.deleteRow = function (selector) {
		if (debug) {
			console.info("LocalDataStorage.deleteRow()");
		}
		
		var rowList = getRowIndexListBySelector(selector);
		var deletedRowCount = 0;
		
		for (var i = 0; i < rowList.length; i++) {
			var deletedRow = {};
			
			deletedRow.LDS_ROWGUID = rows[rowList[i]].LDS_ROWGUID;
			deletedRow.LDS_ROWVERSION = this.getCurrentRowVersion(true);
			deletedRow.LDS_DELETED = true;
			
			rows[rowList[i]] = deletedRow;
			
			deletedRowCount++;
		}
		
		return deletedRowCount;
	};
	
	function getRowIndexListBySelector(selector) {
		var rowList = [];
		
		for (var i = 0; i < rows.length; i++) {
			if (rows[i].LDS_DELETED === false) {
				if (validateSelector(rows[i], selector)) {
					rowList.push(i);
				}
			}
		}
		
		return rowList;
	}
	
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
	
	this.getCurrentRowVersion = function (increase) {
		//NOT YET IMPLEMENTED
		if (increase) {
			
		}
		return 0;
	};
	
	this.createRowGuid = function guid() {
		function _p8(s) {
			var p = (Math.random().toString(16)+"000000000").substr(2,8);
			return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
		}
		return _p8() + _p8(true) + _p8(true) + _p8();
	};
	
	// Private functions
	function validateSelector(row, selector) {
		if ((selector === undefined) || (selector === null) || (typeof(selector) !== "function")) {
			return true;
		} else {
			var result = selector.call(row);
			return result;
		}
	}
	
	function cloneRow(rawDataRow, structure) {
		var result = {};
		
		for (var i = 0; i < structure.length; i++) {
			var column = structure[i];
			
			if (column.type !== "function") {
				result[column.name] = rawDataRow[column.name];
			}
			
		}
		
		return result;
	}
	
	function sortRow(a, b, sort, sortIndex) {
		var currentSort = sort[sortIndex];
	
		if (((currentSort.direction.toUpperCase() === "ASC") && (a[currentSort.name] < b[currentSort.name])) || ((currentSort.direction.toUpperCase() === "DESC") && (a[currentSort.name] > b[currentSort.name]))){
			return -1;
		} else if (((currentSort.direction.toUpperCase() === "ASC") && (a[currentSort.name] > b[currentSort.name])) || ((currentSort.direction.toUpperCase() === "DESC") && (a[currentSort.name] < b[currentSort.name]))) {
			return 1;
		} else {
			if ((sortIndex+1) < sort.length) {
				return sortRow(a, b, sort, (sortIndex+1));
			} else {
				return 0;
			}
		}
	}
	
	function isArray(value) {
		if (Object.prototype.toString.call(value) === '[object Array]' ) {
			return true;
		} else {
			return false;
		}
	}
	
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
}
