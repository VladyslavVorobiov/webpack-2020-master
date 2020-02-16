const path = require('path'); // work with path on OS
const HTMLWebpackPlugin = require('html-webpack-plugin'); //work with html
const {CleanWebpackPlugin} = require('clean-webpack-plugin'); // clean directory
const CopyWebpackPlugin = require('copy-webpack-plugin'); // for copy files from folder to folder
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // extract styles in one file *.css and link it into <head>
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin'); // optim and minify css
const TerserWebpackPlugin = require('terser-webpack-plugin'); // optim and minify js
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer'); //tool for analyze working libraries

const isDev = process.env.NODE_ENV === 'development'; // var NODE_ENV is setted on package.json by cross-env
const isProd = !isDev;

const optimization = () => {
    const config = { 
        splitChunks: { // if different JS modules use same module
            chunks: 'all'
        }
    }

    if(isProd){
        config.minimizer = [
            new OptimizeCssAssetWebpackPlugin(),
            new TerserWebpackPlugin()
        ]
    }

    return config;
}

const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}` ; // [name] is pattern for name file

const cssLoaders = extra => {
    const loaders = [ // atfirst - 'css-loader', atsecond - MiniCssExtractPlugin.loader
        {
            loader: MiniCssExtractPlugin.loader,
                options:{
                    hmr: isDev, // hot module replacement only for developmnet
                    reloadAll: true
                }
        },
        'css-loader'
    ];

    if(extra){
        loaders.push(extra);
    }

    return loaders;
}

const babelOptions = preset => {

    const options = {
        presets:[
            '@babel/preset-env', // adaptive for diff browsers
        ],
        plugins:[
            '@babel/plugin-proposal-class-properties'  // for support JS class syntax
        ]
    }

    if(preset){
        options.presets.push(preset);
    }

    return options;
}

const jsLoaders = () => {
    const loaders = [{
        loader: 'babel-loader',
        options: babelOptions()
    }];

    if(isDev){
        loaders.push('eslint-loader');
    }
    return loaders;
}

const plugins = () => {
    const base = [
        new HTMLWebpackPlugin({
            template: './index.html',
            minify:{
                collapseWhitespace: isProd
            }
        }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, 'src/favicon.ico'),
                to: path.resolve(__dirname,'dist')
            }
        ]),
        new MiniCssExtractPlugin({
            filename: filename('css')
        })
    ];

    if(isProd){
        base.push( new BundleAnalyzerPlugin() );
    }
    return base;
}

module.exports = {
    context: path.resolve(__dirname,'src') , // folder with development code
    mode:'development',
    entry: {
        main:[ '@babel/polyfill' , './index.jsx'], //chunk main, when we use main, we use polyfill too
        analytics:'./analytics.ts'  //chunk analytics
    },
    output:{
        filename: filename('js'), 
        path: path.resolve(__dirname, 'dist')  //return all path to folder dist
    },
    resolve:{
        extensions: ['.js', '.json', '.png'],  //extensions default
        alias:{
            '@models': path.resolve(__dirname, 'src/models'),
            '@': path.resolve(__dirname, 'src'),
        }
    },
    optimization: optimization(),
    devServer:{
        port: 4200,
        hot: isDev
    },
    devtool: isDev ? 'source-map' : '', //in develop mode we can see source code without
    plugins: plugins(),
    module: { // allows wp to work with different types of file: js,ts,css,png...
        rules:[
            {
                test: /\.css$/,  // if webpack meets *.css he must use ...
                //use: ['style-loader','css-loader'] // atfirst - 'css-loader', atsecond - 'style-loader'
                use: cssLoaders()
            },
            {
                test: /\.less$/,  // if webpack meets *.less he must use ...
                use: cssLoaders('less-loader')
            },
            {
                test: /\.s[ac]ss$/,  // if webpack meets *.sass/scss he must use ...
                use: cssLoaders('sass-loader')
            },
            {
                test: /\.(png|jpg|svg|gif)$/, // if wb meets *.png,jpg... he must use ...
                use:['file-loader']
            },
            {
                test: /\.(ttf|woff|woff2|eot)$/,
                use:['file-loader']
            },
            {
                test: /\.xml$/,
                use: ['xml-loader']
            },
            {
                test: /\.csv$/,
                use: ['csv-loader']
            },
            { 
                test: /\.js$/, 
                exclude: /node_modules/, 
                use: jsLoaders()
            },
            { 
                test: /\.ts$/,
                exclude: /node_modules/, 
                loader: {
                    loader: 'babel-loader',
                    options: babelOptions('@babel/preset-typescript')
                } 
            },
            { 
                test: /\.jsx$/,
                exclude: /node_modules/, 
                loader: {
                    loader: 'babel-loader',
                    options: babelOptions('@babel/preset-react')
                } 
            }
        ]
    }
}