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
	var databaseChangeVersion = 0;
	var persistencyController = null;
	var views = [];
	
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
	
	this.getPersistencyController = function () {
		return persistencyController;
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
			throw new Error("Column name can not be null");
		}
		
		if (configuration.name.substring(0,4) === "LDS_") {
			throw new Error("Columnprefix \"LDS_\" is reserved for internal functions");
		}
		
		for (var i = 0; i < structure.length;i++) {
			var currentColumn = structure[i];
			
			if (currentColumn.name === configuration.name) {
				throw new Error("Column \"" + configuration.name + "\" already exists");
			}
		}
		
		if (configuration.type === undefined) {
			configuration.type = "string";
		}
		
		if ((configuration.type !== "string") && (configuration.type !== "number") && (configuration.type !== "boolean")) {
			throw new Error("Column \"" + configuration.name + "\" does not support datatype \"" + configuration.type + "\"");
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
		
		if (rows.length > 0) {
			if ((configuration.defaultvalue === null) && (!configuration.nullable)){
				//error
				throw new Error("Column \"" + configuration.name + "\" is not nullable, and defaultvalue is null.");
			}
		}
		
		structure.push({"name":configuration.name, "type": configuration.type, "defaultvalue":configuration.defaultvalue, "nullable":configuration.nullable});
		
		if (rows.length > 0) {
			for (i = 0; i < rows.length; i++) {
				if (!rows[i].LDS_DELETED) {
					rows[i][configuration.name] = configuration.defaultvalue;
				}
			}
		}
		
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
		
		var newIndex = rows.length;
		rows.push(rawDataRow);
		
		//add to views?
		for (var i = 0; i < views.length; i++) {
			if (validateSelector(rows[newIndex], views[i].selector)) {
				views[i].rowList.push(i);
			} 
		}

		try {
			event("afterDataChanged", this);
		} catch (ex) {
			if (debug) {
				console.error(ex.message);
			}
		}
		
		return true;
	};
	
	/** Select-Function
	 * @param {function} selector - Function for selecting specific datarow
	 * @param {array} sort - Sort-Parameter 
	 * @param {number} limit - limits the result-table
	 * 
	 * */
	this.select = function (selector, sort, limit, view) {
		return this.selectRow(selector, sort, limit, view);
	};
	
	this.selectRow = function (selector, sort, limit, view) {
		var resultSet = [];
		var tmpResultSet = [];
		
		limit = limit || 0;
		
		//
		if (view === undefined) {
			view = null;
		}
		
		//Selecting
		var rowList = getRowIndexListBySelector(selector, view);
		
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
		var currentDatabaseChangeVersion = 0;
		
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
				if (currentDatabaseChangeVersion === 0) {
					currentDatabaseChangeVersion = this.getCurrentRowVersion(true);
				}
				
				rows[rowList[i]].LDS_ROWVERSION = currentDatabaseChangeVersion;
				updatedRowCount++;
			}
		}
		
		if (updatedRowCount > 0) {
			try {
				event("afterDataChanged", this);
			} catch (ex) {
				if (debug) {
					console.error(ex.message);
				}
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
		var currentDatabaseChangeVersion = 0;
		
		for (var i = 0; i < rowList.length; i++) {
			var deletedRow = {};
			
			if (currentDatabaseChangeVersion === 0) {
				currentDatabaseChangeVersion = this.getCurrentRowVersion(true);
			}
			
			deletedRow.LDS_ROWGUID = rows[rowList[i]].LDS_ROWGUID;
			deletedRow.LDS_ROWVERSION = currentDatabaseChangeVersion;
			deletedRow.LDS_DELETED = true;
			
			rows[rowList[i]] = deletedRow;
			
			//views
			//iterate through views
			for (var j = 0; j < views.length; j++) {
				if (views[j] !== null) {
					//iterate through view-rows
					currentviewloop:
					for (var k = 0; k < views[j].rows.length; k++) {
						if ( views[j].rows[k] = rowList[i]) {
							//deleted rowIndex found - set to null
							views[j].rows[k] = null;
							break currentviewloop;
						}
					}
				}
			}
			
			deletedRowCount++;
		}
		
		if (deletedRowCount > 0) {
			try {
				event("afterDataChanged", this);
			} catch (ex) {
				if (debug) {
					console.error(ex.message);
				}
			}
			
		}
		
		return deletedRowCount;
	};
	
	function getRowIndexListBySelector(selector, view) {
		var rowList = [];
		
		var viewIndexList = [];
		
		if ((view !== undefined) || (view !== null)) {
			viewIndexList = getRowIndexListInView(view);
		}
		
		
		if (viewIndexList.length > 0) {
			for (var i = 0; i < viewIndexList.length; i++) {
				if (rows[viewIndexList[i]].LDS_DELETED === false) {
					if (validateSelector(viewIndexList[i], selector)) {
						rowList.push(viewIndexList[i]);
					}
				}
			}	
		} else {
			for (var i = 0; i < rows.length; i++) {
				if (rows[i].LDS_DELETED === false) {
					if (validateSelector(rows[i], selector)) {
						rowList.push(i);
					}
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
		if (increase) {
			return ++databaseChangeVersion;
		} else {
			return databaseChangeVersion;
		}
	};
	
	this.createRowGuid = function guid() {
		function _p8(s) {
			var p = (Math.random().toString(16)+"000000000").substr(2,8);
			return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
		}
		return _p8() + _p8(true) + _p8(true) + _p8();
	};
	
	this.createView = function (viewName, viewSelector) {
		for (var i = 0; i < views.length; i++) {
			if (views[i] !== null) {
				if (views[i].name === viewName) {
					throw new Error("A view \"" + viewName + "\" already exists");
				}
			}
		}
		
		views.push({
			name: viewName,
			selector: viewSelector,
			rows: []
		});
		
		return true;
	};
	
	this.deleteView = function (viewName) {
		for (var i = 0; i < views.length; i++) {
			if (views[i] !== null) {
				if (views[i].name === viewName) {
					views[i] = null;
					return true;
				}
			}
		}
	};
	
	this.rebuildView = function (viewName) {
		for (var i = 0; i < views.length; i++) {
			if (views[i] !== null) {
				if (views[i].name === viewName) {
					views[i].rows = getRowIndexListBySelector(views[i].selector);
					return true;
				}
			}
		}
		
		return false;
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
	
	function event (eventname, scope) {
		if ((scope === undefined) || (scope === null)) {
			scope = this;
		}
		
		var functionToCall = null;
		
		if (eventname === "afterDataChanged") {
			if ((afterDataChanged !== null) && (afterDataChanged !== undefined)) {
				functionToCall = afterDataChanged;
			}
		}
		
		functionToCall.call(scope);
	}
	
	function getRowIndexListInView (viewName) {
		for (var i = 0; i < views.length; i++) {
			if (views[i] !== null) {
				if (views[i].name === viewName) {
					return views[i].rows;
				}
			}
		}
		
		return [];
	}
	
	//EVENTS
	function afterDataChanged () {
		if (debug) {
			console.log("Event afterDataChanged started");
		}
		
		if (persistencyController) {
			persistencyController.afterDataChanged(this);
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
			if ((configuration.databasechangeversion !== undefined) && (configuration.databasechangeversion !== null)) {
				databaseChangeVersion = configuration.databasechangeversion;
			}
			if ((configuration.enablepersistency !== undefined) && (configuration.enablepersistency !== null)) {
				if (configuration.enablepersistency === true) {
					persistencyController = new LocalStoragePersistencyController({debug:configuration.debug});
				}
			}
		}
		if (debug) {
			console.info("LocalDataStorage.initiate()");
		}
		
		if (persistencyController) {
			try {
				var savedData = persistencyController.onInitiate(this);
				
				rows = savedData.rows;
				structure = savedData.structure;
				databaseChangeVersion = savedData.databasechangeversion;
				
				
			} catch (ex) {
				if (debug) {
					console.error(ex.message);
				}
			}
		}
	};
	
	this.initiate(configuration);
}

function LocalStoragePersistencyController (configuration) {
	var ls = null;
	var dataLoadedSucessfully = false;
	var debug = false;
	
	this.isDebug = function () {
		return debug;
	};
	
	this.setDebug = function (value) {
		debug = value;
	};
	
	this.isDataLoadedSucessfully = function () {
		return dataLoadedSucessfully;
	};
	
	this.onInitiate = function (database) {
		if (debug) {
			console.log("LocalStoragePersistencyController.onInitiate");
		}
		
		var dbStructure;
		var dbRows;
		var dbSettings;
		
		//check localStorage-availability
		if ((window.localStorage !== undefined) && (window.localStorage !== null)) {
			ls = window.localStorage;
		}
		
		var dbRawStructure = ls.getItem("LDS_" + database.getId() + "_STRUCTURE");
		var dbRawRows = ls.getItem("LDS_" + database.getId() + "_ROWS");
		var dbRawSettings = ls.getItem("LDS_" + database.getId() + "_SETTINGS");
		
		
		
		if ((dbRawStructure === null) || (dbRawRows === null) || (dbRawSettings === null)) {
			throw new Error("Stored DB-Data are not available");
		}
		
		try {
			dbStructure = JSON.parse(dbRawStructure);
			dbRows = JSON.parse(dbRawRows);
			dbSettings = JSON.parse(dbRawSettings);
		} catch (ex) {
			throw new Error("Invalid Data - could not reinitialize DB Data");
		}
		
		var databaseChangeVersion = dbSettings.databasechangeversion;
		
		
		if (ls === null) {
			return null;
		} else {
			dataLoadedSucessfully = true;
			return {
				structure: dbStructure,
				rows: dbRows,
				databasechangeversion: databaseChangeVersion
			};
		}
	};
	
	this.afterDataChanged = function (database) {
		if (debug) {
			console.log("LocalStoragePersistencyController.afterDataChanged");
		}
		
		if (ls !== null) {
			ls.setItem("LDS_" + database.getId() + "_STRUCTURE", JSON.stringify(database.getStructure()));
			ls.setItem("LDS_" + database.getId() + "_ROWS", JSON.stringify(database.getRawRows()));
			ls.setItem("LDS_" + database.getId() + "_SETTINGS", JSON.stringify({databasechangeversion: database.getCurrentRowVersion()}));
			return true;
		} else {
			return false;
		}
	};
	
	this.initiate = function (configuration) {
		if ((configuration !== undefined) && (configuration !== null)) {
			if ((configuration.debug !== undefined) && (configuration.debug !== null)) {
				debug = configuration.debug;
			}
		}
	};
	
	this.initiate(configuration);
}
