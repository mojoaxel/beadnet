import log from 'loglevel';
import dopts from 'default-options';

log.enableAll();
log.setLevel("TRACE");

class BeatNet {

	constructor(options) {
		/* Merge default option with user given options 
		* To make a parameter required set it to "undefined" in the defaults.
		*/
		this.options = dopts(options, {
			
			container: {
				parent: 'body',
				width: null,
				height: null
			},

			nodes: {
				strokeWidth: 3,
				color: '#999'
			}
		});
		log.debug("initializing beadnet with options: ", this.options);
	}

	/**
	 * Create the main SVG root inside the container defined by the "options.container.parent" selector.
	 * @param {*} width
	 * @param {*} height
	 */
	createSVG() {
		let parentD3 = d3.select(this.options.container.parent);
		let parentRect = parentD3.node().getBoundingClientRect();
		const width = this.options.container.width || parentRect.width;
		const height = this.options.container.height || parentRect.height;
		log.trace(`createSVG: width: ${parentRect.width}, height: ${parentRect.height}`);

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
}

export default BeatNet;
