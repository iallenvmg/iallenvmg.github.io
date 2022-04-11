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
	  fetchParameter();
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
	  console.log(settings);
	  var colorDict = settings.selectedColorDict.replace('"','').replace('[','').replace(']','').split(',');
	  console.log(colorDict)
	  let dataArr = [];
	  worksheet.getSummaryDataAsync().then(data => {
		  let dataJson;
		  data.data.map(d => {
			  dataJson = {};
			  dataJson['Colors'] = d[indexColors].value;
			  dataJson['Radius'] = d[indexRadius].value;
			  dataJson['Values'] = d[indexValues].value;
			  dataJson['Columns'] = d[indexColumns].value;

			  dataArr.push(dataJson);

			   
		  });
		  
		  dataArr = dataArr.filter(function(n){return n.Values != "%null%"});
		  console.log(dataArr)
		  graph(dataArr);
	  });
	  

	  
	  var div = d3.select("body").append("div")
		  .attr("class", "tooltip")
		  .style("opacity", 0);

	  var width = $(window).width()-25,
		  height = $(window).height()-25;
	  
	  function graph(data) {
		d3.select("svg").remove();
		var svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g");
			//.attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");		  

		let Colors = Array.from(new Set(data.map((d) => d.Colors)));
		//let xCoords = Colors.map((d, i) => (i+1) * (width/(Colors.length+2)));
		let xCoords = Colors.map((d,i) => width/2);
		let xScale = d3.scaleOrdinal().domain(Colors).range(xCoords);

		let yScale = d3
		  .scaleLinear()
		  .domain([0,1])
		  //.domain(d3.extent(data.map((d) => +d["Values"])))
		  .range([height - 50, 50]);

		let color = d3.scaleOrdinal().domain(Colors).range(colorDict);

		let percentAxis = d3.axisRight(yScale).tickFormat(d3.format(",.0%"));
		
		let radiusDomain = d3.extent(data.map((d) => d.Radius));
		radiusDomain = radiusDomain.map((d) => Math.sqrt(d));
		let size = d3.scaleLinear().domain(radiusDomain).range([5, 25]);

		svg
		  .selectAll(".circ")
		  .data(data)
		  .enter()
		  .append("circle")
		  .attr("class", "circ")
		  .attr("id",(d) => d.Columns)
		  .attr("stroke", (d) => color(d.Colors))
		  .attr("fill", (d) => color(d.Colors))
		  .attr("opacity", 0.5)
		  .attr("r", (d) => size(Math.sqrt(d.Radius)))
		  .attr("cy", (d) => yScale(d.Values))
		  .attr("cx", (d) => xScale(d.Colors))
		  .on("mouseover",function(d) {tooltipDisplay(d.Columns);})
		  .on("mouseout",function(d) {d3.select(this).attr("fill",color(d.Colors)).attr("opacity", 0.5)});

		  
		svg
		  .append('g')
		  .attr("transform","translate("+width/2+",0)")
		  .call(percentAxis);
		  
		var toolTipBar = svg.append("g")
			.attr("class","focus-label");
			
		toolTipBar.append("text")
			.attr("class","bee-columns")
			.attr("x",9)
			.attr("dy","1.35em")
			.style("font-size",15);
		toolTipBar.append("text")
			.attr("class","bee-values")
			.attr("x",9)
			.attr("dy","2.7em")
			.style("font-size",15);
		toolTipBar.append("text")
			.attr("class","bee-radius")
			.attr("x",9)
			.attr("dy","4.05em")
			.style("font-size",15);


			
		let simulation = d3
		  .forceSimulation(data)
		  .force(
			"y",
			d3
			  .forceY((d) => {
				return yScale(d.Values);
			  })
			  .strength(1)
		  )
		  .force(
			"x",
			d3
			  .forceX(function (d) {
				return xScale(d.Colors);
			  })
			  .strength(0.2)
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
			.attr("cx", (d) => {
			  return d.x;
			})
			.attr("cy", (d) => d.y);
		}
		
		function tooltipDisplay(changeColumns) {
			d3.select("#"+changeColumns)
				.attr("fill","red").attr("opacity", 1)
			
			var tooltipData = dataArr.filter(function(n){return n.Columns == changeColumns});
			
			var displayColumns = "Provider: " + tooltipData[0].Columns;
			var displayValue = "Value: " + d3.format(",.0%")(tooltipData[0].Values);
			var displayRadius = "Denominator: " + tooltipData[0].Radius;

			
			
			toolTipBar.select(".bee-columns").text(displayColumns);
			toolTipBar.select(".bee-values").text(displayValue);
			toolTipBar.select(".bee-radius").text(displayRadius);
			
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
            let unregisterHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.FilterChanged, filterChangedHandler);
            //unregisterHandlerFunctions.push(unregisterHandlerFunction);
        });
    }

  function fetchParameter() {
        unregisterHandlerFunctions.forEach(function(unregisterHandlerFunction) {
            unregisterHandlerFunction();
        });		
        let parameterFetchPromises = [];
        let dashboardparameters = [];
        const dashboard = tableau.extensions.dashboardContent.dashboard;
        dashboard.getParametersAsync().then(function(parameters) { parameters.forEach(function(p) {
		console.log(p);
		let unregisterHandlerFunction = p.addEventListener(tableau.TableauEventType.ParameterChanged, function(parameterEvent) { 
			parameterChangedHandler(parameterEvent,p.name);});
            //unregisterHandlerFunctions.push(unregisterHandlerFunction);
		    });
	    });
	}
	
  function filterChangedHandler(filterEvent) {
        // Just reconstruct the filters table whenever a filter changes.
        // This could be optimized to add/remove only the different filters.
        //fetchFilters();
        //reload gauge
        //d3.select("svg").remove();
        const settingsSaved = tableau.extensions.settings.getAll();
        //plotChart(settingsSaved);
    }
  function parameterChangedHandler(parameterEvent,parameter) {
	if (parameter.name != "Provider Parameter") {
		d3.select("svg").remove();
		const settingsSaved = tableau.extensions.settings.getAll();
		plotChart(settingsSaved);	    
	    }  else {
	    	svg.selectAll(".circ")
		    .attr("fill",color(d.Colors))
		    .attr("opacity", 0.5);
		    
		tooltipDisplay(parameter.currentValue.value)    
	    }

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
