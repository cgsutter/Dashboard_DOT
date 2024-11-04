const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  output: {
    path: path.join(__dirname, "/dist"), // the bundle output path
    filename: "bundle.js", // the name of the bundle
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html", // to import index.html file inside index.js
    }),
  ],
  devServer: {
    // proxy: {
    //   '/api': {
    //     target: ['https://xcitemain.asrc.albany.edu/rnode/appsvr/3001'], // Replace with your API server address
    //     changeOrigin: true
    //   }
    // },
    port: 3039, // you can change the port
    allowedHosts: 'all',
    // historyApiFallBack: {index: '/'},
    headers: {
      // "Access-Control-Allow-Origin": "http://localhost:3001,https://xcitemain.asrc.albany.edu/rnode/appsvr/3001",
      // "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS","Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
      // 'Access-Control-Allow-Credentials': 'true'
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // .js and .jsx files
        exclude: /node_modules/, // excluding the node_modules folder
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.(sa|sc|c)ss$/, // styles files
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/, // to import images and fonts
        loader: "url-loader",
        options: { limit: false },
      },
    ],
  },
};