module.exports = {
    entry : ['babel-polyfill', './js/index.js'],
    output: {
        path: __dirname + '/public/javascripts',
        filename: 'script.js',
        sourceMapFilename: 'script.js.map',
        publicPath: __dirname + '/public/javascripts'
    },
    module: {
        loaders: [
            {
            test: /\.js?$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
                cacheDirectory: true,
                presets: ['react', 'env']
            }
            }
        ]
    }
}
