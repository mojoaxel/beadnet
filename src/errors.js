class InsufficientBalanceError extends Error {
	constructor(sourceBalance, beadCount) {
		super(`The channel has an insufficient source balance of ${sourceBalance} to transmitt ${beadCount}`);
	}
}

export {
	InsufficientBalanceError
}
