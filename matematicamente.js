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
	dataset = dataset.filter(function(d) { return d.rank < 12000; });
	var nested = d3.nest()
		.key(function(d) { return d.user; }).map(dataset, d3.map);

	var top200nested = d3.nest()
		.key(function(d) { return d.datetime; });

	['min', 'max', 'mean'].forEach(function(f) {
		var computed = top200nested.rollup(function(leaves) {
			return d3[f](leaves, function(d) { return d.score; });
		}).entries(dataset);
		scores = [];
		computed.forEach(function(d) {
			scores.push({
				datetime: d.key,
				user: f,
				score: d.values,
			});
		});
		nested.set(f, scores);
	});

	// Chart elements
	var xScale = d3.time.scale()
		.range([0, width])
		.domain(d3.extent(dataset, function(x) {
			return x.datetime;
		}));
	var yScaleScore = d3.scale.linear()
		.range([height, 0])
//		.domain(d3.extent(dataset, function(x) { return x.score; }));
		.domain([-30000, 30000]);
	var yScaleRank = d3.scale.linear()
		.range([height, 0])
		.domain([200, 0]);

	var line = d3.svg.line()
		.interpolate('linear')
		.x(function(d) { return xScale(d.datetime); })
		.y(function(d, i) {
			//return yScalescore(d.score - nested.get('mean')[i].score);
			return yScaleRank(d.rank);
		});

	var area = d3.svg.area()
		.x(function(d) { return xScale(d.x); })
		.y0(function(d) { return yScaleRank(d.y0); })
		.y1(function(d) { return yScaleRank(d.y1); });

	// --- Axis definition ---
	var xAxis = d3.svg.axis()
		.scale(xScale)
		.tickSize(10)
		.orient('bottom');
	var yAxis = d3.svg.axis()
		.scale(yScaleScore)
		.orient('left');
	var yAxisPosition = d3.svg.axis()
		.scale(yScaleRank)
		.orient('left');

	var xAxisGroup = canvas.append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0,' + height + ')')
		.call(xAxis);
	var yAxisGroup = canvas.append('g')
		.attr('class', 'y axis')
		.call(yAxisPosition);

	var plotArea = canvas.append('g')
		.attr('class', 'data');

	var toPlot = d3.map();
	onAddUser('Learts');
			//nested.get('mean'),
		//nested.get('min'),
		//nested.get('max'),

	plotArea.append('path').attr('id', 'range');

	d3.select('#controls button#adduser')
		.on('click', function() {
			var username = d3.select('#controls input#nick').node().value;
			onAddUser(username);
		});
	d3.select('#controls button#check')
		.on('click', function() {
			var score = +(d3.select('#controls input#range').node().value);
			showRange('Learts', score);
		});

	function updateScale() {
		yScaleRank.domain([
			d3.max(toPlot.values(), function(d) {
				return d3.max(d, function(dd) { return dd.rank; });
			}) + 10,
			0
		]);
	}

	function updateAxis() {
		canvas.select('.y.axis')
			.transition()
			.duration(transitionDuration)
			.call(yAxisPosition);
	}

	function updateSeries() {
		var selection = plotArea.selectAll('.series')
			.data(toPlot.values(), function(d) { return d[0].user; });
		selection.select('path').transition()
			.duration(transitionDuration)
			.attr('d', function(d) { return line(d); });
		selection.select('text').transition()
			.duration(transitionDuration)
			.attr('y', function(d) { return yScaleRank(d[d.length-1].rank); });
	}

	function updateRange() {
		d3.select('path#range.active').transition()
			.duration(transitionDuration)
			.attr('d', function(d) { return area(d); });
	}

	function updateChart() {
		updateScale();
		updateAxis();
		updateSeries();
		updateRange();
	}

	function addSeries(selection) {
		/* Takes a selection with bound data and adds series to it
		 * (path, label, ...)
		 * returns the series group selection */
		var group = selection.append('g').attr('class', 'series');
		group.append('path').attr({
			'class': 'dataline',
			'd': function(d) { return line(d); }
		});
		group.append('text')
			.attr({
				'class': 'name',
				'x': width + 5,
				'y': function(d) { return yScaleRank(d[d.length-1].rank); },
			})
			.text(function(d) { return d[0].user; })
			.on('click', function(d) { onDelUser(d[0].user); });
		return group;
	}

	function onDelUser(username) {
		console.log(username);
		toPlot.remove(username);
		var exitSelection = plotArea.selectAll('g.series')
			.data(toPlot.values(), function(d) { return d[0].user; }).exit();
		updateChart();
		console.log(exitSelection);
		exitSelection.remove();
	}

	// CLick callbacks
	function onAddUser(username) {
		// Adds new user series
		// updates scale, axis
		// smoothly moves already present series to adapt to new scale and axis
		var userdata = nested.get(username);
		if (userdata !== undefined) {
			toPlot.set(username, userdata);
			updateChart();
			var enterSelection = plotArea.selectAll('.series')
				.data(toPlot.values(), function(d) { return d[0].user; }).enter();
			console.log(enterSelection);
			var newSeries = addSeries(enterSelection);
			newSeries.style('opacity', 0)
				.transition()
				.duration(transitionDuration)
				.style('opacity', 1);
		}
	}

	function showRange(username, points) {
		function maxInRange(scores, p) {
			var index = 0;
			while (scores[index].score > p + points) {
				index++;
			}
			return scores[index];			
		}

		function minInRange(scores, p, start) {
			var index = start;
			while (scores[index].score > p - points) {
				index++;
			}
			return scores[index];
		}

		over = [];
		under = [];
		areaData = []
		var byDate = d3.nest().key(function(d) { return d.datetime; })
			.map(dataset, d3.map);
		nested.get(username).forEach(function(d) {
			var myScore = d.score;
			var datetime = d.datetime;
			var todayScores = byDate.get(datetime);
			areaData.push({
				x: datetime,
				y1: maxInRange(todayScores, myScore).rank,
				y0: minInRange(todayScores, myScore, d.rank).rank
			});
		});
		plotArea.select('path#range')
			.datum(areaData)
			.attr({'class': 'active', 'd': area(areaData)});
	}
}
