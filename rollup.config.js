import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import pkg from './package.json';

export default [
	
	/* browser-friendly UMD build */
	{
		input: 'src/beadnet.js',
		output: {
			name: pkg.name,
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve(),
			commonjs(),
			//uglify()
		]
	},

	/* ES module (for bundlers) build. */
	{
		input: 'src/beadnet.js',
		external: Object.keys(pkg.dependencies),
		output: [{ 
			file: pkg.module, 
			format: 'es' 
		}]
	}

];