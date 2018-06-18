const defaultOptions = {
			
	colorScheme: d3.scaleOrdinal(d3.schemeCategory10),

	debug: false,

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
	},

	beads: {
		radius: 10,
		spacing: 0,
		strokeWidth: 2,
		strokeColor: null,

		showIndex: null
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

	opt.beads.color = opt.beads.color || opt.colorScheme(10);
	opt.beads.strokeColor = opt.beads.strokeColor || opt.container.backgroundColor;
	opt.beads.animation = opt.beads.animation || d3.easeExp;
	
	opt.beads.distance = 2 * opt.beads.radius + opt.beads.spacing;
	opt.beads.firstPosition = 	opt.nodes.radius + opt.beads.radius + opt.beads.spacing;
	opt.beads.showIndex = opt.beads.showIndex === null ? opt.debug : opt.beads.showIndex;
	
	return opt;
}

export default extendDefaultOptions;
