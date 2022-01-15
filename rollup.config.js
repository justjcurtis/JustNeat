import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
export default {
    input: './neat.js',
    output: {
        name: 'Neat',
        file: 'browserNeat.min.js',
        format: 'iife',
        plugins: [terser()]
    },
    plugins: [
        commonjs({
            include: './**'
        })
    ]
};