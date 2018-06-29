import log from './logger.js';
import extendDefaultOptions from './options.js';

import { InsufficientBalanceError } from './errors.js';

import getRandomNumber from './helpers.js';

import Nodes from './Nodes.js';
import Channels from './Channels.js';

/**
 * TODO:
 */
class Beadnet {

	/**
	 * Create a new BeadNet chart.
	 * @param {Object} options 
	 */
	constructor(options) {
		this._opt = extendDefaultOptions(options);
		log.debug("initializing beadnet with options: ", this._opt);

		/* find the parent container DOM element and insert an SVG */
		this.container = document.querySelector(this._opt.container.selector);
		this.svg = d3.select(this.container)
			.append("svg")
			.attr("class", "beadnet");
		
		/* update the size of new newly created SVG element */
		this.updateSVGSize();

		/* create svg root element called with class "chart" and initial  */
		this.chart = this.svg.append("g")
			.attr("class", "chart")
			.attr("transform", "translate(0,0) scale(1)");

		/* create a SVG-container-element for nodes and channels */
		let channelContainer = this.chart.append("g").attr("class", "channels");
		let nodeContainer = this.chart.append("g").attr("class", "nodes");
	
		this.beadElements = [];

		this.simulation = this._createSimulation();

		this.nodes = new Nodes({
			opt: this._opt,
			nodeContainer,
			simulation: this.simulation
		});

		this.channels = new Channels({
			opt: this._opt,
			nodes: this.nodes,
			channelContainer,
			simulation: this.simulation
		});
		
		this.updateSimulationCenter();

		this.behaviors = this.createBehaviors();
		this.svg.call(this.behaviors.zoom);

		this.nodes.update();
		
		window.addEventListener("resize", this.onResize.bind(this));
	}

	addNode(node) {
		return this.nodes.addNode(node)
	}

	addNodes(nodes) {
		return this.nodes.addNodes(nodes)
	}

	removeNode(id) {
		return this.nodes.removeNode(id);
		//TODO remove all channels of this node
	}

	createRandomNodes(amount = 1) {
		return this.nodes.createRandomNodes(amount);
	}

	getRandomNode() {
		return this.nodes.getRandomNode();
	}


	addChannels(channels) {
		return this.channels.addChannels(channels)
	}

	getChannelCount() {
		return this.channels.getChannelCount();
	}

	getRandomChannel() {
		return this.channels.getRandomChannel();
	}

	createRandomChannels(count, unique) {
		return this.channels.createRandomChannels(count, unique);
	}

	/**
	 * @returns {d3.forceSimulation} simulation
	 * @private
	 */
	_createSimulation() {
		// return d3.forceSimulation()
		// 	.nodes(this._nodes)
		// 	.alphaDecay(0.1)
		// 	//.force("x", d3.forceX().strength(0))
		// 	//.force("y", d3.forceY().strength(1))
		// 	.force("charge", d3.forceManyBody().strength(-1000).distanceMin(this.forceDistance).distanceMax(3*this.forceDistance))
		// 	//.force("collide", d3.forceCollide(this.forceDistance/6))
		// 	.force("link", d3.forceLink(this._channels).distance(this.forceDistance))
		// 	.force("center", d3.forceCenter(this.width / 2, this.height / 2))
		// 	.alphaTarget(0)
		// 	.on("tick", this._ticked.bind(this));

		return d3.forceSimulation(/*this.nodes.getNodes()*/)
			.force("charge", d3.forceManyBody().strength(-3000))
			.force("link", d3.forceLink(/*this._channels*/).strength(0.005).distance(this.forceDistance))
			.force("x", d3.forceX())
			.force("y", d3.forceY())
			.alphaTarget(0)
			.on("tick", this._ticked.bind(this));
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
	 * TODO:
	 */
	createBehaviors() {
		return {

			zoom: d3.zoom()
				.scaleExtent([0.1, 5, 4])
				.on('zoom', () => this.chart.attr('transform', d3.event.transform)),

			drag: d3.drag()
				.on("start", this._onDragStart.bind(this))
				.on("drag", this._onDragged.bind(this))
				.on("end", this._onDragendEnd.bind(this))
		}
	}

	/**
	 * TODO:
	 */
	updateSimulationCenter() {
		const centerX = this.svg.attr('width') / 2;
		const centerY = this.svg.attr('height') / 2;
		this.simulation
			.force("center", d3.forceCenter(centerX, centerY))
			.restart();
	}



	/**
	 * TODO: 
	 * @private
	 */
	_ticked() {
		this.nodes.render();
		this.channels.render()
		this.channels.tickedBeads();
	}



	/**
	 * TODO: 
	 * @private
	 */
	_onDragStart(d) {
		if (!d3.event.active) {
			this.simulation
				.alphaTarget(0.1)
				.restart();
		}
		d.fx = d.x;
		d.fy = d.y;
	}
	
	/**
	 * TODO: 
	 * @private
	 */
	_onDragged(d) {
		d.fx = d3.event.x; 
		d.fy = d3.event.y;
	}
	
	/**
	 * TODO: 
	 * @private
	 */
	_onDragendEnd(d) {
		if (!d3.event.active) { 
			this.simulation
				.alphaTarget(0);
		}
		d.fx = null;
		d.fy = null;
	}
}

export default Beadnet;