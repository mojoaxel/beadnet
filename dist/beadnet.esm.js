import log from 'loglevel';

log.enableAll();
log.setLevel("TRACE");

const defaultOptions = {
			
	colorScheme: d3.scaleOrdinal(d3.schemeCategory10),

	container: {
		selector: '#beadnet',
		backgroundColor: '#FFF'
	},

	nodes: {
		radius: 20,
		color: null,
		strokeWidth: 3,
		strokeColor: null,
	},

	channels: {
		color: 'lightgray',
		strokeWidth: 3,
		strokeColor: null,
	}
};

/** 
 * Merge default option with user given options 
 * To make a parameter required set it to "undefined" in the defaults. 
 */
function extendDefaultOptions(options) {
	let opt = {};
	Object.assign(opt, defaultOptions, options);
	
	opt.nodes.color = opt.nodes.color || opt.colorScheme(0);
	opt.nodes.strokeColor = opt.nodes.strokeColor || opt.container.backgroundColor;
	
	return opt;
}

//import randomID from 'random-id';

class BeatNet {

	/**
	 * TODO
	 * @param {*} options 
	 */
	constructor(options) {
		this._opt = extendDefaultOptions(options);
		log.debug("initializing beadnet with options: ", this._opt);
	}

	/**
	 * TODO
	 */
	createSVG() {
		/* find the parent container DOM element and insert an SVG */
		this.container = document.querySelector(this._opt.container.selector);
		this.svg = d3.select(this.container)
			.append("svg")
			.attr("class", "beadnet");
		
		this.updateSVGSize();

		/* create svg root element called with class "chart" and initial  */
		this.chart = this.svg.append("g")
			.attr("class", "chart")
			.attr("transform", "translate(0,0) scale(1)");

		/* create a SVG-container-element for all nodes and all channels */
		this.channelContainer = this.chart.append("g").attr("class", "channels");
		this.nodeContainer = this.chart.append("g").attr("class", "nodes");
		
		this.nodes = [];
		this.channels = [];

		this.simulation = this.createSimulation();
		
		this.updateSimulationCenter();

		this.behaviors = this.createBehaviors();
		this.svg.call(this.behaviors.zoom);

		this.createNodes();
		
		window.addEventListener("resize", this.onResize.bind(this));
	}

	createSimulation() {
		return d3.forceSimulation()
			.alphaDecay(0.8)
			.force("charge", d3.forceManyBody().distanceMin(0.5*this.forceDistance).distanceMax(2*this.forceDistance))
			.force("link", d3.forceLink(this.channels).distance(this.forceDistance))
			.alphaTarget(1)
			.on("tick", this.ticked.bind(this));
	}

	/**
	 * TODO
	 */
	updateSVGSize() {
		this.width = +this.container.clientWidth;
		this.height = +this.container.clientHeight;
		
		this.forceDistance = (this.width + this.height)*.1;

		this.svg
			.attr("width", this.width)
			.attr("height", this.height);
	}

	/**
	 * TODO
	 */
	onResize() {
		this.updateSVGSize();
		this.updateSimulationCenter();
		this.createBehaviors();
	}
	
	/**
	 * 
	 */
	createBehaviors() {
		return {

			zoom: d3.zoom()
				.scaleExtent([0.1, 5, 4])
				.on('zoom', () => this.chart.attr('transform', d3.event.transform)),

			drag: d3.drag()
				.on("start", this.onDragStart.bind(this))
				.on("drag", this.onDragged.bind(this))
				.on("end", this.onDragendEnd.bind(this))
		}
	}

	updateSimulationCenter() {
		const centerX = this.svg.attr('width') / 2;
		const centerY = this.svg.attr('height') / 2;
		this.simulation
			.force("center", d3.forceCenter(centerX, centerY))
			.restart();
	}

	/**
	 * TODO
	 * @param {*} id 
	 * @param {*} x 
	 * @param {*} x 
	 */
	createNodes() {
		this.nodeElements = this.nodeContainer.selectAll(".node")
			.data(this.nodes)
			.enter()
			.append("g")
				.attr("id", (d) => {	console.log(d); return d.id; })
				.attr("class", "node")
				.attr("balance", (d) => d.balance)
				.style("stroke", this._opt.nodes.strokeColor)
				.style("stroke-width", this._opt.nodes.strokeWidth);
	
		var circle = this.nodeElements.append("circle")
			.attr("class", "node")
			.attr("r",  this._opt.nodes.radius)
			//.attr("cx", this.width/2)
			//.attr("cy", this.height/2)
			.attr("fill", function(d) { return d.color; })
			.style("cursor", "pointer"); 
		
		var labels = this.nodeElements.append("text")
			.style("stroke-width", 1)
			.attr("stroke", this._opt.nodes.strokeColor)
			.attr("fill", this._opt.nodes.strokeColor)
			.attr("font-family", "sans-serif")
			.attr("font-size", "12px")
			.attr("text-anchor", "middle")
			.attr("pointer-events", "none")
			.text((d) => d.balance);

		this.nodeElements.append("title")
			.text(function(d) { return d.id; });
		
		this.nodeElements.call(this.behaviors.drag);

		return this.nodeElements;
	}

	addNode(node) {
		this.nodes.push(node);
		this.createNodes();	
		this.simulation
			.nodes(this.nodes)
			.restart();
	}

	addNodes(nodes) {
		this.nodes.push(...nodes);
		this.createNodes();	
		
		// this.simulation
		// 	.nodes(this.nodes)
		// 	.restart();

		this.simulation
			.nodes(this.nodes)
			.force("collide", d3.forceCollide(this.forceDistance/2))
			.restart();
	}

	updateChannels() {
		console.log("this.channels: ", this.channels);

		this.channelElements = this.channelContainer.selectAll(".channel").data(this.channels);
		
		this.channelElements.enter()
			.append("g")
				.attr("class", "channel")
				.attr("source-balance", (d) => d.sourceBalance)
				.attr("target-balance", (d) => d.targetBalance)
				.attr("source-id", (d) => d.source.id)
				.attr("target-id", (d) => d.target.id)
			.append("path")
				.style("stroke-width", this._opt.channels.strokeWidth)
				.style("stroke", this._opt.channels.color);
		
		this.paths = this.channelContainer.selectAll(".channel path");

		this.channelElements.exit().remove();
	}

	addChannel(channel) {
		var nodeById = d3.map(this.nodes, function(d) { return d.id; });
		this.channels.push({
			source: nodeById.get(channel.source), 
			target: nodeById.get(channel.target),
			sourceBalance: channel.sourceBalance,
			targetBalance: channel.targetBalance
		});
		
		this.updateChannels();

		this.simulation.force("link").links(this.channels);
		
		this.simulation.alpha(1).restart();

	//	this.simulation.restart();
	}

	addChannels(channels) {
		channels.forEach((channel) => this.addChannel(channel));
	}

	ticked() {
		if (this.nodeElements) {
			this.nodeElements.attr("transform", (d) => `translate(${d.x},${d.y})`);
		}
		if (this.paths) {
			this.paths.attr("d", (d) => `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`);
		}
		//tickedBeads();
	}

	onDragStart(d) {
		if (!d3.event.active) {
			this.simulation
				.alphaTarget(0.6)
				.restart();
		}
		d.fx = d.x;
		d.fy = d.y;
	}
	
	onDragged(d) {
		d.fx = d3.event.x; 
		d.fy = d3.event.y;
	}
	
	onDragendEnd(d) {
		if (!d3.event.active) { 
			this.simulation
				.alphaTarget(0);
		}
		d.fx = null;
		d.fy = null;
	}
}

export default BeatNet;
