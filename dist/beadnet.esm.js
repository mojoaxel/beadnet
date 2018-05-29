import log from 'loglevel';
import randomID from 'random-id';

log.enableAll();
log.setLevel("TRACE");

class BeatNet {

	/**
	 * TODO
	 * @param {*} options 
	 */
	constructor(options) {
		/* Merge default option with user given options 
		 * To make a parameter required set it to "undefined" in the defaults. */
		this.opt = {};
		Object.assign(this.opt, {
			
			colorScheme: d3.scaleOrdinal(d3.schemeCategory10),

			container: {
				parent: 'body',
				width: null,
				height: null
			},

			nodes: {
				strokeWidth: 3,
				color: null,
				radius: 20
			}
		}, options);

		this.opt.nodes.color = this.opt.nodes.color || this.opt.colorScheme(0);

		log.debug("initializing beadnet with options: ", this.opt);
	}

	/**
	 * Create the main SVG root inside the container defined by the "opt.container.parent" selector.
	 * @param {*} width
	 * @param {*} height
	 */
	createSVG() {
		let parentD3 = d3.select(this.opt.container.parent);
		let parentRect = parentD3.node().getBoundingClientRect();
		const width = this.opt.container.width || parentRect.width;
		const height = this.opt.container.height || parentRect.height;
		log.debug(`createSVG: width: ${parentRect.width}, height: ${parentRect.height}`);

		/* make sure size is valid */
		if (!width || !height) {
			log.error(`createSVG: width: ${width}, height: ${height}`);
			throw "Invalid container size";
		}

		/* initialize the SVG root */
		this._svg = parentD3.append("svg")
			.attr("width", parentRect.width)
			.attr("height", parentRect.height);

		return this._svg;
	}

	/**
	 * TODO
	 * @param {*} id 
	 * @param {*} x 
	 * @param {*} x 
	 */
	createNode({ id = randomID(), x = null, y = null }) {
		log.debug(`createNode: id:${id}, x:${x}, y:${y}`);

		var node = this._svg.selectAll(".node")
			.data(arguments)
			.enter()
				.append("g")
					.attr("id", (d) => d.id)
					.attr("transform", (d) => `translate(${d.x}, ${d.y})`);

		var circles = node
			.append("circle")
				.style("stroke-width", this.opt.nodes.strokeWidth)
				.style("fill", this.opt.nodes.color )
				.attr("r", this.opt.nodes.radius);

		var labels = node
			.append("text")
				.attr("stroke", "#FFF")
				.attr("font-family", "sans-serif")
				.attr("font-size", "10px")
				.attr("text-anchor", "middle")
				.text((d) => d.id); 
	}

	/**
	 * TODO
	 * @param {*} nodes 
	 */
	createNodes(nodes) {
		log.debug("createNodes: ", nodes);
		nodes.forEach(node => this.createNode(node));
	}

	/**
	 * TODO
	 * @param {*} param0 
	 */
	createChannel({ source = null, target = null }) {
	
	}

	createChannels(channels) {
		channels.forEach(channel => this.createChannel(channel));
	}
}

export default BeatNet;
