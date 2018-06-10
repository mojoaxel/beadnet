import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { uglify } from 'rollup-plugin-uglify';
import pkg from './package.json';

export default [
	
	/* browser-friendly UMD build */
	{
		input: 'src/beadnet.js',
		external: Object.keys(pkg.peerDependencies),
		output: {
			name: pkg.name,
			file: pkg.browser,
			format: 'umd',
			sourcemap: true
		},
		watch: {
			chokidar: false
		},
		plugins: [
			resolve(),
			commonjs(),
			babel({
				runtimeHelpers: true,
				exclude: 'node_modules/**'
			}),
			uglify(),
			sourcemaps()
		]
	},

	/* ES module (for bundlers) build. */
	{
		input: 'src/beadnet.js',
		external: [
			...Object.keys(pkg.dependencies),
			...Object.keys(pkg.peerDependencies)
		],
		output: [{ 
			file: pkg.module, 
			format: 'es' 
		}]
	}

];