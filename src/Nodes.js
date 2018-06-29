import getName from './namegenerator.js';
import getRandomNumber from './helpers.js';


class Nodes {

    constructor(options) {
        this._nodes = [];

        this._opt = options.opt;
        this.simulation = options.simulation;
        this.nodeContainer = options.nodeContainer;
    }

	getNodes() {
		return this._nodes;
	}

	/**
	 * Return the node with the given id.
	 * @param {String} id - the id of the node to find.
	 * @returns {Node|undefined}
	 */
	getNodeById(id) {
		return this._nodes.find((node) => node.id == id);
    }
    
    /**
	 * Update DOM elements after this._nodes has been updated.
	 * This creates the SVG repensentation of a node.
	 * 
	 * @private
	 */
	update() {
		const opt = this._opt;

		console.log("update: ", this._nodes);

		this._nodeElements = this.nodeContainer
			.selectAll(".node")
			.data(this._nodes, (data) => data.id);

		/* remove deleted nodes */
		this._nodeElements.exit().transition().duration(1000).style("opacity", 0).remove();

		/* create new nodes */
		var nodeParent = this._nodeElements.enter().append("g")
			.attr("class", "node")
			.attr("id", (data) => data.id)
			.attr("balance", (data) => data.balance)
			.style("stroke", opt.nodes.strokeColor)
			.style("stroke-width", opt.nodes.strokeWidth)
				
		nodeParent.append("circle")
			.attr("class", "node-circle")
			.attr("fill", (data) => data.color)
			.attr("r", opt.nodes.radius)
			.style("cursor", "pointer");
				
		nodeParent.append("text")
			.style("stroke-width", 0.5)
			.attr("class", "node-text-id")
			.attr("stroke", opt.container.backgroundColor)
			.attr("fill", opt.container.backgroundColor)
			.attr("font-family", "sans-serif")
			.attr("font-size", "15px")
			.attr("y", "0px")
			.attr("text-anchor", "middle")
			.attr("pointer-events", "none")
			.text((d) => d.id);

		nodeParent.append("text")
			.style("stroke-width", 0.5)
			.attr("class", "node-text-balance")
			.attr("stroke", opt.container.backgroundColor)
			.attr("fill", opt.container.backgroundColor)
			.attr("font-family", "sans-serif")
			.attr("font-size", "12px")
			.attr("y", "15px")
			.attr("text-anchor", "middle")
			.attr("pointer-events", "none")
			.text((d) => d.balance);

		nodeParent.call(d3.drag()
            .on("start", (d) => {
                d.fx = d.x;
		        d.fy = d.y;
            })
            .on("drag", (d) => {
                d.fx = d3.event.x; 
		        d.fy = d3.event.y;
            })
            .on("end", (d) => {
                d.fx = null;
		        d.fy = null;
            })
        );

		/* update existing nodes */
		this._nodeElements
			.attr("balance", (d) => d.balance)
			.selectAll('.node-text-balance')
				.text((d) => d.balance);

        // TODO:
		this.simulation
			.nodes(this._nodes)
			.alphaTarget(1)
			.restart();

		this._nodeElements = this.nodeContainer.selectAll(".node")

		return this._nodeElements;
	}

	/**
	 * Adds a new node to the network.
	 * 
	 * @param {Node} node 
	 * @returns {BeatNet}
	 */
	addNode(node) {
		node = node || {};

		/* initialize with default values */
		node.id = node.id || getName();
        node.balance = node.balance || getRandomNumber(100);
        node.color = this._opt.colorScheme(this._nodes.length % 20 + 1);

		/* save to nodes array */
		this._nodes.push(node);
		this.update();

		/* make this funktion chainable */
		return this;
	}

	/**
	 * Adds multible new nodes to the network.
	 * 
	 * @param {Array<Node>} nodes
	 * @returns {BeatNet}
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
	 * @returns {BeatNet}
	 */
	removeNode(nodeId) {
		this._nodes = this._nodes.filter((node) => node.id != nodeId);
	
		this.update();	
		
		/* make this funktion chainable */
		return this;
	};

	/**
	 * Create new nodes with random names.
	 * @param {Integer} [count=1] - how many nodes.
	 * @returns {Node}
	 */
	createRandomNodes(count) {
		if ((typeof count !== "undefined" && typeof count !== "number") || count < 0) {
			throw new TypeError('parameter count must be a positive number');
		}
		return Array.from(new Array(count), (x) => {
			return {
				id: getName(),
				balance: getRandomNumber(100)
			};
		});
	}

	/**
	 * TODO: getRandomNode
	 * @returns {Node}
	 */
	getRandomNode() {
		return this._nodes[getRandomNumber(this._nodes.length)];
    }
    
    render() {
        if (this._nodeElements) {
			this._nodeElements.attr("transform", (data) => `translate(${data.x},${data.y})`);
		}
    }

}

export default Nodes