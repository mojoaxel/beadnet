import dopts from 'default-options';
import randomID from 'random-id';
import log from './logger';

class BeatNet {

	constructor(options) {
		/* Merge default option with user given options 
		* To make a parameter required set it to "undefined" in the defaults.
		*/
		this.opt = dopts(options, {
			
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
		});

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

	createNode({ id = randomID(), x = null, y = null0 }) {
		log.debug(`createNode: id:${id}, x:${x}, y:${y}`);
		this._svg
			.selectAll(".point")
			.data(arguments)
			.enter()
				.append("circle")
					.style("stroke-width", this.opt.nodes.strokeWidth)
					.style("fill", this.opt.nodes.color )
					.attr("r", this.opt.nodes.radius)
					.attr("transform", function(d) { return "translate(" + [x, y] + ")"; });
	}

	createNodes(nodes) {
		log.debug(`createNodes: ${nodes}`);
		nodes.forEach(node => this.createNode(node));
	}
}

export default BeatNet;