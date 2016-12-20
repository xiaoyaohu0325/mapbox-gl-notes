module.exports = {
  entry: {
    single_tile_app: './demo/vt/single-tile-app',
    fill_tile_app: './demo/vt/fill-tile-app',
    tile_grid_app: './demo/geo/tile-grid-app',
    layer_index: './demo/style/layer-index'
  },
  output: {
    path: "./demo/dist",
    filename: "[name].bundle.js"
  },
  externals: {
    // import {} from "gl-matrix" is external and available
    //  on the global var window
    "gl-matrix": "window"
  },
  devtool: 'source-map',
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'awesome-typescript-loader' }
    ]
  }
};
