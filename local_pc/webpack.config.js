const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/webapp/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/webapp'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/webapp/index.html',
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'dist/webapp'),
    compress: true,
    port: 8080,
    https: true,
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        secure: false // Allow self-signed certificates
      },
      '/socket.io': {
        target: 'https://localhost:3000',
        ws: true,
        secure: false // Allow self-signed certificates
      }
    },
  },
};
