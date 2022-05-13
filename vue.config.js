module.exports = {
    devServer: {
        disableHostCheck: true,
        host: '0.0.0.0',
        port: process.env.PORT,
        public: '0.0.0.0:' + process.env.PORT
    },
    publicPath: "/"
}