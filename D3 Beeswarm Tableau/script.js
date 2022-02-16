'use strict';
// Wrap everything in an anonymous function to avoid poluting the global namespace
(function () {
  // Event handlers for filter change
  let unregisterHandlerFunctions = [];

  let worksheet1, worksheet2;
  // Use the jQuery document ready signal to know when everything has been initialized
	
  $(document).ready(function () {
  // Initialize tableau extension
  tableau.extensions.initializeAsync().then(function () {
	  // Get worksheets from tableau dashboard
	  worksheet1 = tableau.extensions.dashboardContent.dashboard.worksheets[0];
	  worksheet2 = tableau.extensions.dashboardContent.dashboard.worksheets[1];
	  console.log('got tableau worksheets');
      function getDataAndPlotChart() {
        // load data from worksheet
		console.log('getDataAndPlot');
        let dataArr = [];
        worksheet1.getSummaryDataAsync().then(data => {
          let dataJson;
          data.data.map(d => {
            dataJson = {};
            dataJson[data.columns[0].fieldName] = d[0].value; //1st column 
            dataJson[data.columns[1].fieldName] = d[1].value; //2nd column 
            dataJson[data.columns[2].fieldName] = d[2].value; //3rd column 
            dataJson[data.columns[3].fieldName] = d[3].value; //4th column 
            dataArr.push(dataJson);
          });
		  
		  dataArr = dataArr.filter(function(n){return n.Percent != "%null%"})


          // converting data to heirarchical json
		  /*
          let formattedJson = _(dataArr)
            .groupBy(x => x["Provider"])
            .map((value1, key) => ({
              name: key, count: sum(value1), children: _(value1)
                .value()
            }))
            .value();
*/
		  console.log(dataArr);
          plotChart(dataArr);
        });
      }

      getDataAndPlotChart();

      // event listener for filters
      let unregisterHandlerFunction = worksheet1.addEventListener(tableau.TableauEventType.FilterChanged, filterChangedHandler);
      unregisterHandlerFunctions.push(unregisterHandlerFunction);

      function filterChangedHandler(event) {
        // for filter change
        // Add fieldName with (||) for other filters
        if (event.fieldName === "Provider") {
          // reload summary data
          getDataAndPlotChart();
        }
      }
    });
  });

  function sum(arr) {
    let count = 0;
    arr.forEach(element => {
      count += parseInt(element["Percent"]);
    });
    return count;
  }
  
    // ========================== D3 CHART ===================== //

  function plotChart(data) {
      console.log('plotchart')

	  var div = d3.select("body").append("div")
		  .attr("class", "tooltip")
		  .style("opacity", 0);

	  var width = 1200,
		  height = 600;
	  
	  function graph() {
		d3.select("svg").remove();
		var svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g");
			//.attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");		  

		let centers = Array.from(new Set(data.map((d) => d.Center)));
		//let yCoords = centers.map((d, i) => (i+1) * (height/(centers.length+2)));
		let yCoords = centers.map((d,i) => height/2);
		let yScale = d3.scaleOrdinal().domain(centers).range(yCoords);

		let xScale = d3
		  .scaleLinear()
		  .domain([1,0])
		  //.domain(d3.extent(data.map((d) => +d["Percent"])))
		  .range([width - 50, 50]);

		let color = d3.scaleOrdinal().domain(centers).range(d3.schemePaired);

		let percentAxis = d3.axisBottom(xScale).tickFormat(d3.format(",.0%"));
		
		let panelDomain = d3.extent(data.map((d) => d["SUM(Denominator)"]));
		panelDomain = panelDomain.map((d) => Math.sqrt(d));
		let size = d3.scaleLinear().domain(panelDomain).range([5, 25]);

		svg
		  .selectAll(".circ")
		  .data(data)
		  .enter()
		  .append("circle")
		  .attr("class", "circ")
		  .attr("stroke", "black")
		  .attr("fill", (d) => color(d.Center))
		  .attr("r", (d) => size(Math.sqrt(d["SUM(Denominator)"])))
		  .attr("cy", (d) => yScale(d.Center))
		  .attr("cx", (d) => xScale(d.Percent));

		  
		svg
		  .append('g')
		  .call(percentAxis);
		  
		let simulation = d3
		  .forceSimulation(data)
		  .force(
			"y",
			d3
			  .forceY((d) => {
				return yScale(d.Center);
			  })
			  .strength(0.2)
		  )
		  .force(
			"x",
			d3
			  .forceX(function (d) {
				return xScale(d.Percent);
			  })
			  .strength(1)
		  )
		  .force(
			"collide",
			d3.forceCollide((d) => {
			  return size(Math.sqrt(d["SUM(Denominator)"]));
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
	graph();
}})();