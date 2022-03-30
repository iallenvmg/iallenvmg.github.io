'use strict';
// Wrap everything in an anonymous function to avoid poluting the global namespace
(function () {
  // Event handlers for filter change
  let unregisterHandlerFunctions = [];

  let savedInfo;
  const defaultIntervalInMin = '5';
  // Use the jQuery document ready signal to know when everything has been initialized
	
  $(document).ready(function () {
  // Initialize tableau extension
	tableau.extensions.initializeAsync({'configure': configure}).then(function () {
	  let currentSettings = tableau.extensions.settings.getAll();
	  fetchFilter();
	  fetchCurrentSettings();
	  if (typeof currentSettings.sheet !== "undefined") {
	    $('#inactive').hide();
		plotChart(currentSettings)
	  }
	});
  });
  
  let unregisterHandlerFunction;
  
    // ========================== D3 CHART ===================== //

  function plotChart(settings) {
	  var worksheetsName = settings.sheet;
	  const worksheet = getSelectedSheet(worksheetsName);
	  var indexColors = settings.selectedColors[1];
	  var indexColumns = settings.selectedColumns[1];
	  var indexRadius = settings.selectedRadius[1];
	  var indexValues = settings.selectedValues[1];
	  var colorDict = settings.selectedColorDict;
	  console.log(colorDict)
	  let dataArr = [];
	  console.log(indexColumns);
	  worksheet.getSummaryDataAsync().then(data => {
		  let dataJson;
		  data.data.map(d => {
			  console.log(d);
			  dataJson = {};
			  dataJson['Colors'] = d[indexColors].value;
			  dataJson['Radius'] = d[indexRadius].value;
			  dataJson['Values'] = d[indexValues].value;
			  dataJson['Columns'] = d[indexColumns].value;

			  dataArr.push(dataJson);

			   
		  });
		  
		  dataArr = dataArr.filter(function(n){return n.Values != "%null%"});
		  graph(dataArr);
	  });
	  
	  
	  
	  var div = d3.select("body").append("div")
		  .attr("class", "tooltip")
		  .style("opacity", 0);

	  var width = 1200,
		  height = 600;
	  
	  function graph(data) {
		d3.select("svg").remove();
		var svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g");
			//.attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");		  

		let Colors = Array.from(new Set(data.map((d) => d.Colors)));
		//let yCoords = Colors.map((d, i) => (i+1) * (height/(Colors.length+2)));
		let yCoords = Colors.map((d,i) => height/2);
		let yScale = d3.scaleOrdinal().domain(Colors).range(yCoords);

		let xScale = d3
		  .scaleLinear()
		  .domain([1,0])
		  //.domain(d3.extent(data.map((d) => +d["Values"])))
		  .range([width - 50, 50]);

		let color = d3.scaleOrdinal().domain(Colors).range(colorDict);

		let percentAxis = d3.axisBottom(xScale).tickFormat(d3.format(",.0%"));
		
		let radiusDomain = d3.extent(data.map((d) => d.Radius));
		radiusDomain = radiusDomain.map((d) => Math.sqrt(d));
		let size = d3.scaleLinear().domain(radiusDomain).range([5, 25]);

		svg
		  .selectAll(".circ")
		  .data(data)
		  .enter()
		  .append("circle")
		  .attr("class", "circ")
		  .attr("stroke", "black")
		  .attr("fill", (d) => color(d.Colors))
		  .attr("r", (d) => size(Math.sqrt(d.Radius)))
		  .attr("cy", (d) => yScale(d.Colors))
		  .attr("cx", (d) => xScale(d.Values));

		  
		svg
		  .append('g')
		  .call(percentAxis);
		  
		let simulation = d3
		  .forceSimulation(data)
		  .force(
			"y",
			d3
			  .forceY((d) => {
				return yScale(d.Colors);
			  })
			  .strength(0.2)
		  )
		  .force(
			"x",
			d3
			  .forceX(function (d) {
				return xScale(d.Values);
			  })
			  .strength(1)
		  )
		  .force(
			"collide",
			d3.forceCollide((d) => {
			  return size(Math.sqrt(d.Radius));
			})
		  )
		  .alphaDecay(0)
		  .alpha(0.3)
		  .on("tick", tick);

		function tick() {
		  d3.selectAll(".circ")
			.attr("cy", (d) => {
			  return d.y;
			})
			.attr("cx", (d) => d.x);
		}

		let init_decay = setTimeout(function () {
		  console.log("start alpha decay");
		  simulation.alphaDecay(0.1);
		}, 3000);
	  };
}
	

  function getSelectedSheet (worksheetName) {
    // go through all the worksheets in the dashboard and find the one we want
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
      return sheet.name === worksheetName;
    });
  }



  function createButton (buttonTitle) {
    const button =
    $(`<button type='button' class='btn btn-default btn-block'>
      ${buttonTitle}
    </button>`);
    return button;
  }

  // This variable will save off the function we can call to unregister listening to marks-selected events


 

  function initializeButtons () {
    $('#show_choose_sheet_button').click(showChooseSheetDialog);
  }

  function convertArray (tiers1,tiers2) {
    var array = [];
      for (var i = 0; i < tiers1.length; i++) {
        array.push({"tiers1" :tiers1[i].value, "tiers2" : tiers2[i].value})
      }
    return array;
  }

  function getSelectedSheet (worksheetName) {
    // go through all the worksheets in the dashboard and find the one we want
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
      return sheet.name === worksheetName;
    });
  }

  function convert(array){
    var map = {};
    for(var i = 0; i < array.length; i++){
        var obj = array[i];
        obj.items= [];

        map[obj.Id] = obj;

        var parent = obj.Parent || '-';
        if(!map[parent]){
            map[parent] = {
                items: []
            };
        }
        map[parent].items.push(obj);
    }

    return map['-'].items;

}	
	
	
function fetchFilter() {
        // While performing async task, show loading message to user.
        //$('#loading').addClass('show');

        // Whenever we restore the filters table, remove all save handling functions,
        // since we add them back later in this function.
        unregisterHandlerFunctions.forEach(function(unregisterHandlerFunction) {
            unregisterHandlerFunction();
        });

        // Since filter info is attached to the worksheet, we will perform
        // one async call per worksheet to get every filter used in this
        // dashboard.  This demonstrates the use of Promise.all to combine
        // promises together and wait for each of them to resolve.
        let filterFetchPromises = [];

        // List of all filters in a dashboard.
        let dashboardfilters = [];

        // To get filter info, first get the dashboard.
        const dashboard = tableau.extensions.dashboardContent.dashboard;

        // Then loop through each worksheet and get its filters, save promise for later.
        dashboard.worksheets.forEach(function(worksheet) {
            //filterFetchPromises.push(worksheet.getFiltersAsync());

            // Add filter event to each worksheet.  AddEventListener returns a function that will
            // remove the event listener when called.
            let unregisterHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, filterChangedHandler);
            //unregisterHandlerFunctions.push(unregisterHandlerFunction);
        });
    }

  function filterChangedHandler(filterEvent) {
        // Just reconstruct the filters table whenever a filter changes.
        // This could be optimized to add/remove only the different filters.
        //fetchFilters();
        //reload gauge
        d3.select("svg").remove();
        const settingsSaved = tableau.extensions.settings.getAll();
        plotChart(settingsSaved);
    }

   function fetchCurrentSettings() {
        // While performing async task, show loading message to user.
        //$('#loading').addClass('show');

        // Whenever we restore the filters table, remove all save handling functions,
        // since we add them back later in this function.
        unregisterHandlerFunctions.forEach(function(unregisterHandlerFunction) {
            unregisterHandlerFunction();
        });

        // Since filter info is attached to the worksheet, we will perform
        // one async call per worksheet to get every filter used in this
        // dashboard.  This demonstrates the use of Promise.all to combine
        // promises together and wait for each of them to resolve.
        let filterFetchPromises = [];

        // List of all filters in a dashboard.
        let dashboardfilters = [];

        // To get filter info, first get the dashboard.
        const dashboard = tableau.extensions.dashboardContent.dashboard;

        tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
            //console.log(settingsEvent);
            //updateExtensionBasedOnSettings(settingsEvent.newSettings);
            plotChart(settingsEvent.newSettings);
        });
    }


  function configure() { 
      const popupUrl = `${window.location.origin}/D3 Beeswarm Tableau/extensionBox.html`;
    
      tableau.extensions.ui.displayDialogAsync(popupUrl, defaultIntervalInMin, { height: 500, width: 500 }).then((closePayload) => {
        $('#inactive').hide();
        $('#active').show();

        // The close payload is returned from the popup extension via the closeDialog method.
        

    }).catch((error) => {
      //  ... 
      // ... code for error handling
      
    });
  }

})();
