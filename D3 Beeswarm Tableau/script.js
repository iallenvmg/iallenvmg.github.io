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
	  let currentSettings = tableau.extension.settings.getAll();
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
      console.log(settings)

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
