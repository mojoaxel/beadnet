const defaultOptions = {
			
	colorScheme: d3.scaleOrdinal(d3.schemeCategory10),

	container: {
		selector: '#beadnet',
		backgroundColor: '#FFF'
	},

	nodes: {
		radius: 30,
		color: null,
		strokeWidth: 3,
		strokeColor: null,

		/* ['id', 'balance'] */
		text: 'id'
	},

	channels: {
		color: 'gray',
		strokeWidth: 6,
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

export default extendDefaultOptions;
