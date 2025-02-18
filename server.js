var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config.dev.js');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true
}).listen(process.env.PORT, '0.0.0.0', function (err) {
  if (err) {
    console.log(err);
  }
  console.log('Listening at :0.0.0.0:' + process.env.PORT);
});