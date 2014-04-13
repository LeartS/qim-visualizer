function pollon(dataset) {
	
	// Boxes definitions
    var container = d3.select('#chart');

	var margin = {top: 20, right: 100, bottom: 30, left: 40},
	    width = parseInt(container.style('width'), 10) - margin.left - margin.right,
	    height = parseInt(container.style('height'), 10) - margin.top - margin.bottom;

	var transitionDuration = 400;

	var canvas = d3.select('#chart')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	// Data manipulation
	dataset = dataset.filter(function(d) { return d['Posizione'] < 12000; });
	var nested = d3.nest()
		.key(function(d) { return d['Nome utente']; }).map(dataset, d3.map);

	var top200nested = d3.nest()
		.key(function(d) { return d['Datetime']; });

	['min', 'max', 'mean'].forEach(function(f) {
		var computed = top200nested.rollup(function(leaves) {
			return d3[f](leaves, function(d) { return d['Punteggio']; });
		}).entries(dataset);
		scores = [];
		computed.forEach(function(d) {
			scores.push({
				'Datetime': d.key,
				'Nome utente': f,
				'Punteggio': d.values,
			});
		});
		nested.set(f, scores);
	});

	// Chart elements
	var xScale = d3.time.scale()
		.range([0, width])
		.domain(d3.extent(dataset, function(x) {
			return Date.parse(x['Datetime']);
		}));
	var yScaleScore = d3.scale.linear()
		.range([height, 0])
//		.domain(d3.extent(dataset, function(x) { return +x['Punteggio']; }));
		.domain([-30000, 30000]);
	var yScalePosition = d3.scale.linear()
		.range([height, 0])
		.domain([200, 0]);

    var line = d3.svg.line()
		.interpolate('linear')
		.x(function(d) { return xScale(Date.parse(d['Datetime'])); })
		.y(function(d, i) {
			//return yScalescore(d['Punteggio'] - nested.get('mean')[i]['Punteggio']);
			return yScalePosition(d['Posizione']);
		});

    // --- Axis definition ---
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .tickSize(10)
        .orient('bottom');
    var yAxis = d3.svg.axis()
        .scale(yScaleScore)
        .orient('left');
	var yAxisPosition = d3.svg.axis()
		.scale(yScalePosition)
		.orient('left');

    var xAxisGroup = canvas.append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0,' + height + ')')
		.call(xAxis);
    var yAxisGroup = canvas.append('g')
		.attr('class', 'y axis')
		.call(yAxisPosition);

	var toPlot = [
		nested.get('Learts'),
		//nested.get('mean'),
		//nested.get('min'),
		//nested.get('max'),
	];

	var plotArea = canvas.append('g')
		.attr('class', 'data');
	console.log(toPlot);
    var test = plotArea.selectAll('.series')
		.data(toPlot)
		.enter()
		.append('g')
		.attr('class', 'series');
	test.append('path')
		.attr('d', function(d) { return line(d); })
		.attr('class', 'dataline')
	test.append('text')
		.attr({
			'class': 'name',
			'x': width + 5,
			'y': function(d) { return yScalePosition(d[d.length-1]['Posizione']); },
		})
		.text(function(d) { return d[0]['Nome utente']; });

	d3.select('#adduser button')
		.on('click', function() {
			var username = d3.select('#adduser input').node().value;
			onAddUser(username);
		});

	function updateScale(toPlot) {
		yScalePosition.domain([
			d3.max(toPlot, function(d) {
				return d3.max(d, function(dd) { return +dd['Posizione']; });
			}) + 10,
			0
		]);
		console.log(yScalePosition.domain());
	}

	function updateAxis() {
		canvas.select('.y.axis')
			.transition()
			.duration(transitionDuration)
			.call(yAxisPosition);
	}

	// CLick callbacks
	function onAddUser(username) {
		var userdata = nested.get(username);
		if (userdata !== undefined) {
			toPlot.push(nested.get(username));
			console.log(toPlot);
			updateScale(toPlot);
			updateAxis();

			var selection = plotArea.selectAll('.series')
				.data(toPlot);
			selection.select('path').transition()
				.duration(transitionDuration)
				.attr('d', function(d) { return line(d); });
			selection.select('text').transition()
				.duration(transitionDuration)
				.attr('y', function(d) { return yScalePosition(d[d.length-1]['Posizione']); });
			selection.enter()
				.append('path')
				    .attr('d', function(d) { return line(d); })
				    .attr('class', 'dataline')
				    .style('opacity', 0)
				.transition()
				    .duration(transitionDuration)
				    .style('opacity', 1);
		}
	}
}
