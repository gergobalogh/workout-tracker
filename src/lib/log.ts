export function ltc(message: any, ...optionalParams: unknown[]): void {
	const isServer = typeof window === 'undefined';
	const origin = isServer ? '[SERVER]' : '[CLIENT]';
	const err = new Error();
	const stackLines = err.stack?.split('\n') || [];
	const callerLine = stackLines[2]?.trim(); // [0] is 'Error', [1] is this function, [2] is the caller

	console.log(origin, message, ...optionalParams, callerLine ??'↳ at' + callerLine);
}
