import extend from "extend";

const defaultOptions = {

	colorScheme: d3.scaleOrdinal(d3.schemeCategory20),

	debug: false,

	container: {
		selector: "#beadnet",
		backgroundColor: "#FFF"
	},

	nodes: {
		radius: 30,
		color: null,
		strokeWidth: 3,
		strokeColor: null,

		/* ["id", "balance"] */
		text: "id"
	},

	channels: {
		color: "gray",
		colorHighlighted: null,

		/* Number or "auto" */
		strokeWidth: "auto",
		strokeColor: null,

		/* show channel balance as text path */
		showBalance: false
	},

	beads: {
		radius: 10,
		spacing: -0.5,
		strokeWidth: 2,
		strokeColor: null,

		showIndex: true
	},

	presentation: false,
};

/**
 * Merge default option with user given options
 * To make a parameter required set it to "undefined" in the defaults.
 */
function extendDefaultOptions(options) {
	let opt = {};
	extend(true, opt, defaultOptions, options);

	opt.nodes.color = opt.nodes.color || opt.colorScheme(0);
	opt.nodes.strokeColor = opt.nodes.strokeColor || opt.container.backgroundColor;

	opt.channels.color = opt.channels.color || opt.colorScheme(15);
	opt.channels.colorHighlighted = opt.channels.colorHighlighted || opt.colorScheme(19);

	opt.beads.color = opt.beads.color || opt.colorScheme(10);
	opt.beads.strokeColor = opt.beads.strokeColor || opt.container.backgroundColor;
	opt.beads.animation = opt.beads.animation || d3.easeExp;

	opt.beads.distance = opt.beads.radius * 2 +
		opt.beads.spacing +
		opt.beads.strokeWidth;
	opt.beads.firstPosition =
		opt.nodes.radius + opt.nodes.strokeWidth / 2 +
		opt.beads.radius + opt.beads.strokeWidth / 2 +
		opt.beads.spacing;
	opt.beads.showIndex = opt.beads.showIndex === null ? opt.debug : opt.beads.showIndex;

	return opt;
}

export default extendDefaultOptions;