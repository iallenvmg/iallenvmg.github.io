//store data information
(function () {
    const colorsSettingsKey = 'selectedColors';
    const columnsSettingsKey = 'selectedColumns';
    const radiusSettingsKey = 'selectedRadius';
    const valuesSettingsKey = 'selectedValues';
	let selectedColors = [];
	let selectedColumns = [];
	let selectedRadius = [];
	let selectedValues = [];
	let selectedSheet = [];
	
	
	$(document).ready(function() {
		
		tableau.extensions.initializeDialogAsync().then(function (openPayLoad) {
			$('#interval').val(openPayLoad);
			$('#closeButton').click(closeDialog);
			// load dashboard and prep datasource
			let dashboard = tableau.extensions.dashboardContent.dashboard;
			let visibleDatasources = [];
			
			dashboard.worksheets.forEach(function (worksheet) {
				const button = createButton(worksheet.name);
				button.click(function () {
					$('#colors').empty();
					$('#columns').empty();
					$('#radius').empty();
					$('#values').empty();
					
					let worksheetName = worksheet.name;
					tableau.extensions.settings.set('sheet',worksheetName);
					
					showSelectionOption(worksheetName);
					
				});
				
					$('#buttons').append(button);
				
				
			});
		});	
	});
	
	function showSelectionOption(worksheetName){
		const worksheet = getSelectedSheet(worksheetName);
		
		const textFormat = $('<h5>Select the color grouping column:</h5>');
		const textFormat2 = $('<h5>Select the index grouping column:</h5>');
		const textFormat3 = $('<h5>Select the radius value column:</h5>');
		const textFormat4 = $('<h5>Select the linear value column:</h5>');
		
		$('#colors').append(textFormat);
		$('#columns').append(textFormat2);
		$('#radius').append(textFormat3);
		$('#values').append(textFormat4);
		
		worksheet.getSummaryDataAsync().then(function(data){
			const columnsTable = data.columns;
			columnsTable.forEach(function (name) {
				const option = createOption(name);
				const option2 = createOptionColumns(name);
				const option3 = createOptionRadius(name);
				const option4 = createOptionValues(name);
			});
		});
		
	}
	
	function updateColors(id) {
		let idIndex = selectedColors.indexOf(id);
		
		if (idIndex < 0) {
			selectedColors.push(id);
		} else {
			selectedColors.splice(idIndex,1);
		}
	}


	function updateColumns(id) {
		let idIndex = selectedColumns.indexOf(id);
		
		if (idIndex < 0) {
			selectedColumns.push(id);
		} else {
			selectedColumns.splice(idIndex,1);
		}
	}

	function updateRadius(id) {
		let idIndex = selectedRadius.indexOf(id);
		
		if (idIndex < 0) {
			selectedRadius.push(id);
		} else {
			selectedRadius.splice(idIndex,1);
		}
	}	
	
	function updateValues(id) {
		let idIndex = selectedValues.indexOf(id);
		
		if (idIndex < 0) {
			selectedValues.push(id);
		} else {
			selectedValues.splice(idIndex,1);
		}
	}
	
	function updateData(id) {
		let idIndex = selectedSheet.indexOf(id);
		if (idIndex < 0) {
			selectedSheet.push(id);
		} else {
			selectedSheet.splice(idIndex, 1);
		}
    }


	function closeDialog() {
		let currentSettings = tableau.extensions.settings.getAll();
		tableau.extensions.settings.set(colorsSettingsKey, JSON.stringify(selectedColors));
		tableau.extensions.settings.set(columnsSettingsKey, JSON.stringify(selectedColumns));
		tableau.extensions.settings.set(radiusSettingsKey, JSON.stringify(selectedRadius));
		tableau.extensions.settings.set(valuesSettingsKey, JSON.stringify(selectedValues));

		tableau.extensions.settings.saveAsync().then((newSavedSettings) => {
			tableau.extensions.ui.closeDialog("test");
		});
	}

	function createButton (buttonTitle) {
		const button =
		$(`<button type='button' class='btn btn-default btn-block'>
			${buttonTitle}
		</button>`);
		return button;
	}
	
    function createOption (buttonTitle) {
		let containerDiv = $('<div />');

		$('<input />', {
			type: 'radio',
			id: buttonTitle.index,
			value: buttonTitle.fieldName,
			click: function() { updateColors(buttonTitle.index) }
		}).appendTo(containerDiv);

		$('<label />', {
			'for': buttonTitle.index,
			text: buttonTitle.fieldName,
		}).appendTo(containerDiv);

		$('#colors').append(containerDiv);
	}
	
	function createOptionColumns (buttonTitle) {
		let containerDiv = $('<div />');

		$('<input />', {
			type: 'radio',
			id: buttonTitle.index,
			value: buttonTitle.fieldName,
			click: function() { updateColumns(buttonTitle.index) }
		}).appendTo(containerDiv);

		$('<label />', {
			'for': buttonTitle.index,
			text: buttonTitle.fieldName,
		}).appendTo(containerDiv);

		$('#columns').append(containerDiv);
	}

    function createOptionRadius (buttonTitle) {
		let containerDiv = $('<div />');

		$('<input />', {
			type: 'radio',
			id: buttonTitle.index,
			value: buttonTitle.fieldName,
			click: function() { updateRadius(buttonTitle.index) }
		}).appendTo(containerDiv);

		$('<label />', {
			'for': buttonTitle.index,
			text: buttonTitle.fieldName,
		}).appendTo(containerDiv);

		$('#radius').append(containerDiv);
	}	
	
    function createOptionValues (buttonTitle) {
		let containerDiv = $('<div />');

		$('<input />', {
			type: 'radio',
			id: buttonTitle.index,
			value: buttonTitle.fieldName,
			click: function() { updateValues(buttonTitle.index) }
		}).appendTo(containerDiv);

		$('<label />', {
			'for': buttonTitle.index,
			text: buttonTitle.fieldName,
		}).appendTo(containerDiv);

		$('#values').append(containerDiv);
	}

	function getSelectedSheet (worksheetName) {
    // go through all the worksheets in the dashboard and find the one we want
		return tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
			return sheet.name === worksheetName;
		});
	}
	
})();

