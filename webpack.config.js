

const path = require('path');

module.exports = {
    mode: "production",
    entry: './build/main.js',
    output: {
        filename: 'sksql.min.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'var',
        library: 'sksql'
    },
    optimization: {
        minimize: true
    },
    resolve: {
        fallback: {
            "ws": false
        }
    }

};