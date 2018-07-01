import names from "datasets-unisex-first-names-en";

function getName() {
	return names[Math.floor(Math.random() * names.length)];
}

export default getName
