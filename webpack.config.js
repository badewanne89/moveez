const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/app/views/public/landingPage/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist/app/views/public')
  },
  module: {rules: [
    {
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env'], ["@babel/preset-react"]]
        }
      }
    }
  ]}
};
