import getName from './namegenerator.js';
import log from './logger.js';
import extendDefaultOptions from './options.js';

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
		
		this._nodes = [];
		this._channels = [];

		this.simulation = this.createSimulation();
		
		this.updateSimulationCenter();

		this.behaviors = this.createBehaviors();
		this.svg.call(this.behaviors.zoom);

		this._updateNodes();
		
		window.addEventListener("resize", this.onResize.bind(this));
	}

	createSimulation() {
		// return d3.forceSimulation()
			//.nodes(this._nodes)
			// .alphaDecay(0.1)
			// .force("x", d3.forceX().strength(0))
			// .force("y", d3.forceY().strength(1))
			// .force("charge", d3.forceManyBody().strength(-1000).distanceMin(this.forceDistance).distanceMax(3*this.forceDistance))
			// .force("collide", d3.forceCollide(this.forceDistance/6))
			// .force("link", d3.forceLink(this._channels).distance(this.forceDistance))
			// .force("center", d3.forceCenter(this.width / 2, this.height / 2))
			// .alphaTarget(0)
			// .on("tick", this.ticked.bind(this));

		return d3.forceSimulation(this._nodes)
			.force("charge", d3.forceManyBody().strength(-5000))
			.force("link", d3.forceLink(this._channels).distance(this.forceDistance))
			.force("x", d3.forceX())
			.force("y", d3.forceY())
			.alphaTarget(0.1)
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
	 * Update DOM elements after this._nodes has been updated.
	 * This creates the SVG repensentation of a node.
	 * 
	 * @private
	 */
	_updateNodes() {
		this.nodeElements = this.nodeContainer
			.selectAll(".node")
			.data(this._nodes, (data) => data.id);

		this.nodeElements.exit()
			.remove();

		var nodeParent = this.nodeElements.enter()
			.append("g")
				.attr("class", "node")
				.attr("id", (data) => data.id)
				.attr("balance", (data) => data.balance)
				.style("stroke", this._opt.nodes.strokeColor)
				.style("stroke-width", this._opt.nodes.strokeWidth);

		nodeParent.append("circle")
				.attr("r",  this._opt.nodes.radius)
				.attr("fill", function(data) { return data.color; })
				.style("cursor", "pointer");

		nodeParent.append("text")
			.style("stroke-width", 0.5)
			.attr("stroke", this._opt.nodes.strokeColor)
			.attr("fill", this._opt.nodes.strokeColor)
			.attr("font-family", "sans-serif")
			.attr("font-size", "15px")
			.attr("y", "5px")
			.attr("text-anchor", "middle")
			.attr("pointer-events", "none")
			.text((d) => d.balance || d.id);

		nodeParent.append("title")
			.text(function(d) { return d.id; });
		
		nodeParent
			.call(this.behaviors.drag);

		this.simulation
			.nodes(this._nodes)
			.alpha(1)
			.restart();

		this.nodeElements = this.nodeContainer
			.selectAll(".node")

		return this.nodeElements;
	}

	/**
	 * Adds a new node to the network.
	 * 
	 * @param {Node} node 
	 */
	addNode(node) {
		node = node || {};

		/* initialize with default values */
		node.id = node.id || getName();
		node.channelCount = 0;
		node.color = node.color || this._opt.colorScheme(this._nodes.length % 10);

		/* save to nodes array */
		this._nodes.push(node);
		this._updateNodes();

		/* make this funktion chainable */
		return this;
	}

	/**
	 * Adds multible new nodes to the network.
	 * 
	 * @param {Array<Node>} nodes 
	 */
	addNodes(nodes) {
		nodes.forEach((node) => this.addNode(node));

		/* make this funktion chainable */
		return this;
	}

	/**
	 * Removes a the node with the given id from the network.
	 * 
	 * @param {String} nodeId 
	 */
	removeNode(nodeId) {
		this._nodes = this._nodes.filter(node => node.id != nodeId);
		this._updateNodes();	
		
		return this;
	};

	createRandomNode() {
		return {
			id: getName()
		}
	}

	getRandomNode() {
		return this._nodes[Math.floor(Math.random() * this._nodes.length)];
	}

	_updateChannels() {
		this._channelElements = this.channelContainer.selectAll(".channel").data(this._channels);
		
		this._channelElements.enter()
			.append("g")
				.attr("class", "channel")
				.attr("source-balance", (d) => d.sourceBalance)
				.attr("target-balance", (d) => d.targetBalance)
				.attr("source-id", (d) => d.source.id)
				.attr("target-id", (d) => d.target.id)
			.append("path")
				.style("stroke-width", this._opt.channels.strokeWidth)
				.style("stroke", this._opt.channels.color)
				.style("fill", "none");
		
		this.paths = this.channelContainer.selectAll(".channel path")

		this._channelElements.exit().remove()
	}

	addChannel(channel) {
		var nodeById = d3.map(this._nodes, function(d) { return d.id; });
		var source = nodeById.get(channel.source);
		var target = nodeById.get(channel.target);
		this._channels.push({
			source: source, 
			target: target,
			sourceBalance: channel.sourceBalance,
			targetBalance: channel.targetBalance
		});

		source.channelCount = source.channelCount + 1;
		target.channelCount = target.channelCount + 1;

		this._updateChannels();

		this.simulation.force("link").links(this._channels)
		
		this.simulation.alpha(1).restart();
	}

	addChannels(channels) {
		channels.forEach((channel) => this.addChannel(channel));
	}

	createRandomChannel() {
		var source = this.getRandomNode();
		var target = this.getRandomNode();
		//TODO: check is this nodes already have channels. If so try to choose others.
		
		return {
			source: source.id, 
			target: target.id,
			sourceBalance: Math.floor(Math.random()*10),
			targetBalance: Math.floor(Math.random()*10)
		};
	}

	ticked() {
		if (this.nodeElements) {
			this.nodeElements.attr("transform", (data) => `translate(${data.x},${data.y})`);
		}
		if (this.paths) {
			this.paths.attr("d", (d) => {
				var count = this._channels.filter((c) => ((d.source.id === d.source.id) && (d.target.id === d.target.id))).length;
				//console.log(count);

				if (count <= 1) {
					return `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`;
				} else {
					var dx = d.target.x - d.source.x;
					var dy = d.target.y - d.source.y;
					var dr = Math.sqrt((dx*dx+count) + (dy*dy+count));
					return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
				}
			});
		}
		//tickedBeads();
	}

	onDragStart(d) {
		if (!d3.event.active) {
			this.simulation
				.alphaTarget(0.1)
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