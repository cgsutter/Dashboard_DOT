const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const fs = require('fs');

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
    port: 3039, // you can change the port
    allowedHosts: 'all',
    // hot: false,
    // https: true,
    // key: fs.readFileSync(path.resolve(__dirname, 'ssl', 'key.pem')),
    // cert: fs.readFileSync(path.resolve(__dirname, 'ssl', 'cert.pem')),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  },
  // devServer: {
  //   host: '0.0.0.0', // or 'xcitemain.asrc.albany.edu'
  //   port: 3039,
  //   https: true, // Enable HTTPS
  //   key: fs.readFileSync(path.resolve(__dirname, 'ssl', 'key.pem')),
  //   cert: fs.readFileSync(path.resolve(__dirname, 'ssl', 'cert.pem')),
  //   client: {
  //     webSocketURL: 'wss://xcitemain.asrc.albany.edu:3039/ws',
  //   },
  //   devMiddleware: {
  //     publicPath: 'https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3039/',
  //   },
  // },
  // devServer: {
  //   host: '0.0.0.0', // or 'xcitemain.asrc.albany.edu'
  //   port: 3039,
  //   server: 'https', // Specify HTTPS server
  //   server.key: 'path/to/ssl/key', // SSL key path
  //   server.cert: 'path/to/ssl/cert', // SSL certificate path
  //   client: {
  //     webSocketURL: 'wss://xcitemain.asrc.albany.edu:3039/ws',
  //   },
  //   devMiddleware: {
  //     publicPath: 'https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3039/',
  //   },
  // },
  // devServer: {
  //   host: '0.0.0.0', // or 'xcitemain.asrc.albany.edu'
  //   port: 3039,
  //   https: {
  //     key: 'path/to/ssl/key', // SSL key path
  //     cert: 'path/to/ssl/cert', // SSL certificate path
  //   },
  //   devMiddleware: {
  //     server: 'https://xcitemain.asrc.albany.edu/rnode/dgx-a100/3039/',
  //   },
  //   client: {
  //     webSocketURL: 'wss://xcitemain.asrc.albany.edu:3039/ws',
  //   },
  // },
  // devServer: {
  //   host: '0.0.0.0', // or 'xcitemain.asrc.albany.edu'
  //   port: 3039,
  //   https: true, // Enable HTTPS
  //   // Use the following for non-HTTPS setup
  //   // http: true,
  //   // Use the following for custom domain and path
  //   public: 'xcitemain.asrc.albany.edu/rnode/dgx-a100/3039',
  //   // Disable host check for custom domains
  //   disableHostCheck: true,
  //   // hot: true, // Hot reloading enabled by default
  // },

  // devServer: {
  //   host: 'xcitemain.asrc.albany.edu',
  //   port: 3039,
  //   https: true, // or false depending on your setup
  //   hot: true, // Enable hot reloading
  //   client: {
  //     webSocketURL: 'wss://xcitemain.asrc.albany.edu:3039/ws',
  //   },
  // },
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