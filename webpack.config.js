const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      'process.env.CUSTOM_VARIABLE': JSON.stringify('Ma valeur personnalisée')
    })
  ]
};
