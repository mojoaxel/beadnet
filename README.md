# beadnet
A visualisation library for peer-to-peer payment channel networks.


let bn = new BeatNet(options);

let nodeA = bn.addNode( id, alias, balance? );
let nodeB = bn.addNode( id, alias, balance? );

let channelAB = bn.addChannel({
	source: { 
		node: 'Alice', 
		amount: 2
	},
	destination: { 
		node: 'Hub1',
		amount: 0
	}
);