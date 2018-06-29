import getRandomNumber from './helpers.js';

class Channels {

    constructor(options) {
        this._channels = [];

        this._opt = options.opt;
        this.nodes = options.nodes;
        this.simulation = options.simulation;
        this.channelContainer = options.channelContainer;
    }

    /**
	 * Return the channel with the given id.
	 * @param {String} id - the id of the node to find.
	 * @returns {Channel|undefined}
	 */
	getChannelById(id) {
		return this._channels.find((ch) => ch.id == id);
    }
    
    	/**
	 * TODO:
	 * @private
	 * @returns {d3.selection} this._channelElements
	 */
	update() {
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

		console.log("update: ", this._channels);

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
		this.update();

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
        //TODO: move this fun beatnet

		// if ((typeof count !== "undefined" && typeof count !== "number") || count < 0) {
		// 	throw new TypeError('parameter count must be a positive number');
		// }
		let channels = Array.from(new Array(count), (x) =>  {
			let source = this.nodes.getRandomNode();
			let target = this.nodes.getRandomNode();

			if (unique) {
				let killCounter = 0;
				while((
					source.id == target.id || 
					(	this.getChannels(source.id, target.id).length > 0) && 
						killCounter < this._channels.length)
					) {
					source = this.nodes.getRandomNode();
					target = this.nodes.getRandomNode();
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
		this.update();	
		
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
		this.update();

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
		this.update();

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
		
		this.update();

		/* make this funktion chainable */
		return this;
    }
    
    render() {
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
		const channels = this.channels.getChannels(sourceId, targetId);

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
						that.channels.update();

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
						that.channels.update();
	
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
}
export default Channels