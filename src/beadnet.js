import log from './logger.js';
import extendDefaultOptions from './options.js';

import { InsufficientBalanceError } from './errors.js';

import getRandomNumber from './helpers.js';

import Nodes from './Nodes.js';

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
		
		this.updateSVGSize();

		/* create svg root element called with class "chart" and initial  */
		this.chart = this.svg.append("g")
			.attr("class", "chart")
			.attr("transform", "translate(0,0) scale(1)");

		/* create a SVG-container-element for all nodes and all channels */
		this.channelContainer = this.chart.append("g").attr("class", "channels");
		
		let nodeContainer = this.chart.append("g").attr("class", "nodes");
	

		this._channels = [];
		this.beadElements = [];

		this.simulation = this._createSimulation();

		this.nodes = new Nodes({
			opt: this._opt,
			nodeContainer,
			simulation : this.simulation
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



	/**
	 * Return the channel with the given id.
	 * @param {String} id - the id of the node to find.
	 * @returns {Channel|undefined}
	 */
	_getChannelById(id) {
		return this._channels.find((ch) => ch.id == id);
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
			.force("link", d3.forceLink(this._channels).strength(0.005).distance(this.forceDistance))
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
	 * @returns {d3.selection} this._channelElements
	 */
	_updateChannels() {
		const opt = this._opt;

		/* update beads of each channel */
		this._channels =  this._channels.map((ch) => {
			const balance = ch.sourceBalance + ch.targetBalance;
			let index = -1;
			ch.beads = [];
			ch.beads.push(...Array.from(new Array(ch.sourceBalance), (x) => {
				index++
				return {
					state: 0,
					index: index,
					//id: `bead_${ch.id}_source_${index}x${ch.sourceBalance}`
					id: `bead_${ch.id}_source_${index}x${balance}`
				}
			}));
			ch.beads.push(...Array.from(new Array(ch.targetBalance), (x) => {
				index++
				return {
					state: 1,
					index: index,
					//id: `bead_${ch.id}_target_${index}x${ch.targetBalance}`
					id: `bead_${ch.id}_target_${index}x${balance}`
				}
			}));
			return ch;
		});

		console.log("_updateChannels: ", this._channels);

		this._channelElements = this.channelContainer.selectAll(".channel").data(this._channels, (d) => d.id);

		/* remove channels that no longer exist */
		this._channelElements.exit()
			.transition()
			.duration(500)
			.style("opacity", 0)
			.remove();

		/* create new svg elements for new channels */
		var channelRoots = this._channelElements.enter().append("g")
			.attr("class", "channel")

		this._channelElements.merge(channelRoots)
			.attr("id", (d) => d.id )
			.attr("source-balance", (d) => d.sourceBalance)
			.attr("target-balance", (d) => d.targetBalance)
			.attr("source-id", (d) => d.source.id)
			.attr("target-id", (d) => d.target.id)
			.attr("highlighted", (d) => d.hightlighted)

		channelRoots
			.append("path")
				.attr("class", "path")
				.attr("id", (d) =>  `${d.id}_path`)
				.style("stroke-width", (d) => opt.channels.strokeWidth == 'auto' ? (d.sourceBalance+d.targetBalance)*2 : opt.channels.strokeWidth)
				.style("stroke", opt.channels.color)
				.style("fill", "none");

		if (this._opt.channels.showBalance) {
			channelRoots
				.append("text")
					.attr("class", "channel-text")
					.attr("font-family", "Verdana")
					.attr("font-size", "12")
					.attr("dx", 150) //TODO: place this dynamic between the beads on the path
					.attr("dy", -7)
					.style("pointer-events", "none")
					.append("textPath")
						.attr("xlink:href", (d) => `#${d.id}_path`)
						.attr("class", "channel-text-path")
						.style("stroke-width", 1)
						.style("stroke", opt.channels.color)
						.style("fill", "none")
						.text((d) => `${d.sourceBalance}:${d.targetBalance}`)
		}

		var beadsContainer = channelRoots.append("g")
			.attr("class", "beads")
			.attr("id", (d) => 'beads_container');

		this.beadElements = beadsContainer.selectAll(".bead")
			.data((d) => d.beads, (d) => d.id);

		this.beadElements.exit()
			.transition()
			.duration(800)
			.style("opacity", 0)
			.remove();

		let beadElement = this.beadElements.enter().append("g")
			.attr("class", "bead")

		this.beadElements.merge(beadElement)
			.attr("channel-state", (d) => d.state) //TODO: 0 or 1?
			.attr("id", (d) => d.id )	
			.attr("index", (d) => d.index)

		beadElement.append("circle")
			.attr("r",  opt.beads.radius)
			.style("stroke-width", opt.beads.strokeWidth)
			.style("fill", opt.beads.color)
			.style("stroke", opt.beads.strokeColor);

		if (opt.beads.showIndex) {
			/* show bead index */
			beadElement.append("text")
				.attr("class", "bead-text")	
				.attr("stroke", opt.container.backgroundColor)
				.attr("fill", opt.container.backgroundColor)
				.attr("font-family", "sans-serif")
				.attr("font-size", "8px")
				.attr("y", "2px")
				.attr("text-anchor", "middle")
				.attr("pointer-events", "none")
				.style("stroke-width", 0.2)
				.text((d) => d.index);
		}

		/* update channel */
		// this._channelElements
		// 	.attr("source-balance", (d) => d.sourceBalance)
		// 	.attr("target-balance", (d) => d.targetBalance)
		// 	.attr("source-id", (d) => d.source.id)
		// 	.attr("target-id", (d) => d.target.id)
		// 	.attr("highlighted", (d) => d.hightlighted);

		// this._channelElements.selectAll('.path')
		// 	.attr("id", (d) =>  `${d.id}_path`)
		// 	.style("stroke-width", opt.channels.strokeWidth)
		// 	.style("stroke", opt.channels.color)
		// 	.style("fill", "none");

		if (this._opt.channels.showBalance) {
			this._channelElements.selectAll('.channel-text-path')
				.text((d) => `${d.sourceBalance}:${d.targetBalance}`);
		}

		/***************************************************/
		/* update channel styles */
		this._channelElements.selectAll('[highlighted=true] .path')
			.style("stroke", opt.channels.colorHighlighted)

		this._channelElements.selectAll('[highlighted=false] .path')
			.style("stroke", opt.channels.color)
		/************************************************* */

		/* update this._paths; needed in this._ticked */
		this._paths = this.channelContainer.selectAll(".channel .path");
		this.beadElements = this.channelContainer.selectAll(".channel .beads .bead");

		this.simulation
			.force("link")
			.links(this._channels)

		this.simulation
			.alphaTarget(0)
			.restart()

		return this._channelElements;
	}

	/**
	 * TODO:
	 * @param {*} channelInfos 
	 */
	_getUniqueChannelId(channelInfos) {
		const channelBalance = (+channelInfos.sourceBalance || 0) + (+channelInfos.targetBalance || 0);
		let nonce = 0;
		let id = `channel${channelInfos.source}${channelBalance}${channelInfos.target}${nonce > 0 ? nonce : ''}`;
		while (this._channels.filter((channel) => channel.id == id).length > 0) {
			nonce++;
			id = `channel${channelInfos.source}${channelBalance}${channelInfos.target}${nonce > 0 ? nonce : ''}`;
		}
		return id;
	}

	/**
	 * TODO: addChannel
	 * @param {Channel} channel 
	 */
	addChannel(channel) {;
		channel.sourceBalance = channel.sourceBalance || 0;
		channel.targetBalance = channel.targetBalance || 0;
		
		if (!channel.sourceBalance && !channel.targetBalance) {
			throw new Error("Its not possible to create a channel without any funds. Please add a sourceBalance and/or targetBalance.");
		}

		let source = this.nodes.getNodeById(channel.source);
		let target = this.nodes.getNodeById(channel.target);

		if (source.balance < channel.sourceBalance) {
			throw new Error("Insufficient Funds. The source node has not enough funds to open this channel");
		}
		if (target.balance < channel.targetBalance) {
			throw new Error("Insufficient Funds. The target node has not enough funds to open this channel");
		}

		/* update balance of the source and target nodes */
		source.balance -= channel.sourceBalance;
		target.balance -= channel.targetBalance;
		this.nodes.update();

		/* update the internal channel list */
		const id = this._getUniqueChannelId(channel);
		this._channels.push({
			id: id,
			hightlighted: false,
			source: source, 
			target: target,
			sourceBalance: channel.sourceBalance,
			targetBalance: channel.targetBalance
		});
		this._updateChannels();

		return this;
	}

	/**
	 * TODO: 
	 * @param {*} channels 
	 * @returns TODO:
	 */
	addChannels(channels) {
		channels.forEach((channel) => this.addChannel(channel));
	}

		/**
	 * Create new nodes with random names.
	 * @param {Integer} [count=1] - how many nodes.
	 * @returns {Node}
	 */
	createRandomChannels(count, unique = true) {
		// if ((typeof count !== "undefined" && typeof count !== "number") || count < 0) {
		// 	throw new TypeError('parameter count must be a positive number');
		// }
		let channels = Array.from(new Array(count), (x) =>  {
			let source = this.getRandomNode();
			let target = this.getRandomNode();

			if (unique) {
				let killCounter = 0;
				while((
					source.id == target.id || 
					(	this.getChannels(source.id, target.id).length > 0) && 
						killCounter < this._channels.length)
					) {
					source = this.getRandomNode();
					target = this.getRandomNode();
					killCounter++;
				}
			};

			let sourceBalance = getRandomNumber(4);
			let targetBalance = getRandomNumber(4);
			sourceBalance = (!sourceBalance && !targetBalance) ?  getRandomNumber(4)+1 : sourceBalance;

			let channel = {
				source: source.id, 
				target: target.id,
				sourceBalance: sourceBalance,
				targetBalance: targetBalance
			}
			channel.id = this._getUniqueChannelId(channel);
			return channel;
		});
		return channels;
	}

	/**
	* TODO:
	*/
	getRandomChannel() {
		return this._channels[getRandomNumber(this._channels.length)];
	}

	/**
	 * TODO:
	 */
	getChannelCount() {
		return this._channels.length;
	}

	/**
	 * Remove channel with the given source and target ids.
	 * @returns {Beatnet} beatnet
	 */
	removeChannel(sourceId, targetId) {
		this._channels = this._channels.filter((channel) => {
			if ((channel.source.id != sourceId) || (channel.target.id != targetId)) {
				return true;
			} else {
				let sourceNode = this.nodes.getNodeById(sourceId);
				sourceNode.balance += channel.sourceBalance;
				let targetNode = this.nodes.getNodeById(targetId);
				targetNode.balance += channel.targetBalance;
				return false;
			}
		});
		

		console.log("removeChannel: ",this._channels);
		this.nodes.update();
		this._updateChannels();	
		
		return this;
	}

	/**
	 * TODO:
	 * @param {String} sourceId 
	 * @param {String} targetId 
	 */
	getChannels(sourceId, targetId) {
		return this._channels.filter((channel) => 
			(channel.source.id == sourceId && channel.target.id == targetId) ||
			(channel.target.id == sourceId && channel.source.id == targetId)
		);
	}

	/**
	 * Transfer a amount from the source node banlance to or from the channel.
	 * @param {String} sourceId - source node id
	 * @param {String} targetId - target node id
	 * @param {Integer} amount - positive if moved from not to channel; negative if moved from channel to node.
	 */
	changeChannelSourceBalance(sourceId, targetId, amount) {
		const channels = this.getChannels(sourceId, targetId);
		if (!channels || channels.length <= 0) {
			//TODO: throw an error
			console.error(`no channel found between "${sourceId}" and "${targetId}"`);
			return this;
		}
		//TODO: handle error if more than one channel is found.
		let channel = channels[0];
		let node = this._getNodeById(channel.source.id);
		//TODO: throw error if node not found;

		if (amount > 0) {
			amount = Math.abs(amount)
			if (node.balance < amount) {
				//TODO: throw an error
				console.error(`node ${sourceId} has not enough balance (${node.balance}) to refund the channel by ${amount}`);
				return this;
			}
			node.balance -= amount;
			channel.sourceBalance += amount;
		} else {
			amount = Math.abs(amount)
			if (channel.sourceBalance < amount) {
				//TODO: throw an error
				console.error(`sourceBalance (${sourceId}) is not enough (${channel.sourceBalance}) to remove an amount of ${amount}`);
				return this;
			}
			node.balance += amount;
			channel.sourceBalance -= amount;
		}

		this.nodes.update();
		this._updateChannels();

		return this;
	}

	/**
	 * Transfer a amount from the target node banlance to or from the channel.
	 * @param {String} sourceId - source node id
	 * @param {String} targetId - target node id
	 * @param {Integer} amount - positive if moved from node to channel; negative if moved from channel to node.
	 */
	changeChannelTargetBalance(sourceId, targetId, amount) {
		const channels = this.getChannels(sourceId, targetId);
		if (!channels || channels.length <= 0) {
			//TODO: throw an error
			console.error(`no channel found between "${sourceId}" and "${targetId}"`);
			return this;
		}
		//TODO: handle error if more than one channel is found.
		let channel = channels[0];
		let node = this._getNodeById(channel.target.id);
		//TODO: throw error if node not found;

		if (amount > 0) {
			amount = Math.abs(amount)
			if (node.balance < amount) {
				//TODO: throw an error
				console.error(`node ${targetId} has not enough balance (${node.balance}) to refund the channel by ${amount}`);
				return this;
			}
			node.balance -= amount;
			channel.targetBalance += amount;
		} else {
			amount = Math.abs(amount)
			if (channel.targetBalance < amount) {
				//TODO: throw an error
				console.error(`targetBalance (${targetId}) is not enough (${channel.targetBalance}) to remove an amount of ${amount}`);
				return this;
			}
			node.balance += amount;
			channel.targetBalance -= amount;
		}

		this.nodes.update();
		this._updateChannels();

		return this;
	}

	/**
	 * Mark a channel as "hightlighted"
	 * @param {String} sourceId 
	 * @param {String} targetId 
	 * @param {Boolean} state - should the channel be highlighted [true]/false
	 */
	highlightChannel(sourceId, targetId, state) {
		var channels = this.getChannels(sourceId, targetId);
		channels.forEach((channel) => channel.hightlighted = state ? state : !channel.hightlighted );
		
		this._updateChannels();

		/* make this funktion chainable */
		return this;
	}

	/**
	 * TODO:
	 * @param {*} b 
	 */
	_positionBeat(b, d) {
		const bead = d3.select(b);
		const index = d.index;
		const state = +bead.attr("channel-state"); // state 0=source, 1=target
		const channel = d3.select(bead.node().parentNode.parentNode);
		const path = channel.select('.path').node();

		const channelData = channel.data()[0];
		const sourceBalance = channelData.sourceBalance;
		const targetBalance = channelData.targetBalance;
		const balance = sourceBalance + targetBalance;
		const distanceBetweenBeads = this._opt.beads.distance + this._opt.beads.spacing;
		const channelPadding = this._opt.beads.firstPosition +  this._opt.beads.spacing;
	
		var startPosition = channelPadding + (index * distanceBetweenBeads);	
		var endPosition = channelPadding + ((balance-1-index) * distanceBetweenBeads);
		var totalDistance = path.getTotalLength() - startPosition - endPosition;

		const beadPosition = path.getPointAtLength(startPosition + state * totalDistance);
		return `translate(${beadPosition.x},${beadPosition.y})`;
	}

	/**
	 * TODO: 
	 * @private
	 */
	_ticked() {
		this.nodes.render();

		if (this._paths) {
			this._paths.attr("d", (d) => {
				// var count = this._channels.filter((c) => ((d.source.id === d.source.id) && (d.target.id === d.target.id))).length;
				// if (count <= 1) {
					return `M${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`;
				// } else {
				// 	var dx = d.target.x - d.source.x;
				// 	var dy = d.target.y - d.source.y;
				// 	var dr = Math.sqrt((dx*dx+count) + (dy*dy+count));
				// 	return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
				// }
			});
		}
		this.tickedBeads();
	}

	/**
	 * TODO:
	 */
	tickedBeads() {
		var that = this;
		if (!this.beadElements || this.beadElements.length === 0|| this.beadElements.empty()) {
			return;
		}
		this.beadElements.attr("transform", function(d) {
			return that._positionBeat(this, d);
		});
	}
	
	/**
	 * TODO
	 * @param {*} bead 
	 * @param {*} direction 
	 * @param {*} delay 
	 */
	animateBead(bead, direction, delay) {
		var that = this;
		direction = !!direction;
		const select = d3.select(bead)
		return select.transition()
			.delay(delay)	
			//.ease(d3.easeLinear)
			.ease(d3.easeQuadInOut)
			.duration(1000)
			.attrTween("channel-state", function(a) { return function(t) { 
				that.tickedBeads();
				if (direction) {
					return 1-t;
				} else {
					return t
				}
			}});
	}

	/**
	 * TODO:
	 * @param {*} sourceId 
	 * @param {*} targetId 
	 * @param {*} beadCount 
	 * @param {*} callback 
	 */
	moveBeads(sourceId, targetId, beadCount, callback) {
		const channels = this.getChannels(sourceId, targetId);

		let channel = channels[0];
		if (!channel) {
			//TODO: throw error!?
			console.error("no channel found!")
			return;
		}

		// TODO: get channel with source and target
		const channelElement = d3.select(`#${channel.id}`);

		if (channel.source.id == sourceId) {

			let sourceBalance = channel.sourceBalance;
			let targetBalance = channel.targetBalance;
			var startIndex = sourceBalance - beadCount;
			var endIndex = startIndex + beadCount-1;

			var that = this;
			var transitionCounter = 0;
			channelElement.selectAll('.bead').each(function(d, index) {
				if (index >= startIndex && index <= endIndex) {
					const delay = (endIndex-index)*100;
					transitionCounter++
					that.animateBead(this, d.state, delay).on("end", (ch, a, b) => {
						sourceBalance--;
						targetBalance++;
						d.state = 1;
	
						channel.sourceBalance = sourceBalance;
						channel.targetBalance = targetBalance;
						that._updateChannels();

						channelElement
							.attr("source-balance", sourceBalance)
							.attr("target-balance", targetBalance);
	
						if (that._opt.channels.showBalance) {
							channelElement.select('.channel-text-path')
								.text(`${sourceBalance}:${targetBalance}`);
						}
	
						transitionCounter--;
						if (transitionCounter <= 0) {
							return callback && callback();
						}
					});
				}
			});

		} else {

			let sourceBalance = channel.sourceBalance;
			let targetBalance = channel.targetBalance;
			var startIndex = (sourceBalance + targetBalance) - targetBalance;
			var endIndex = startIndex + beadCount-1;

			var that = this;
			var transitionCounter = 0;
			channelElement.selectAll('.bead').each(function(d, index) {
				if (index >= startIndex && index <= endIndex) {
					const delay = (index)*100;
					transitionCounter++
					that.animateBead(this, d.state, delay).on("end", (ch, a, b) => {
						sourceBalance++;
						targetBalance--;
						d.state = 0;

						channel.sourceBalance = sourceBalance;
						channel.targetBalance = targetBalance;
						that._updateChannels();
	
						channelElement
							.attr("source-balance", sourceBalance)
							.attr("target-balance", targetBalance);
	
						if (that._opt.channels.showBalance) {
							channelElement.select('.channel-text-path')
								.text(`${sourceBalance}:${targetBalance}`);
						}
	
						transitionCounter--;
						if (transitionCounter <= 0) {
							return callback && callback();
						}
					});
				}
			});
			
		}
		
		return this;
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