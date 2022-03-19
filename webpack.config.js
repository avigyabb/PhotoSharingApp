module.exports = {
  entry: {
    photoShare: './photoShare.jsx',
    //regenerator-runtime/runtime.js
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: [ "style-loader", "css-loader" ],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  output: {
    path: `${__dirname}/compiled`,
    publicPath: '/',
    filename: '[name].bundle.js',
  },
  mode: 'development',
};
