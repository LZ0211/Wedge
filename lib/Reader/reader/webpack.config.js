module.exports = {
    entry:"./app",
    output:{
        path:"./build",
        filename:"bundle.js"
    },
    devServe: {
        historyApiFallback: true,
        hot: true,
        inline: true,
        progress: true
    }
}

