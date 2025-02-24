const path = require("path");

module.exports = {
  entry: {
    background: "./background.js", // Entry point for background.js
    content: "./content.js", // Entry point for content.js
  },
  output: {
    filename: "[name].bundle.js", // Output bundled files as [name].bundle.js
    path: path.resolve(__dirname, "dist"), // Output directory
  },
  mode: "production", // Optimize for production
  module: {
    rules: [
      {
        test: /\.js$/, // Apply Babel to all .js files
        exclude: /node_modules/, // Exclude node_modules
        use: {
          loader: "babel-loader", // Use Babel loader
          options: {
            presets: ["@babel/preset-env"], // Use @babel/preset-env for compatibility
          },
        },
      },
    ],
  },
};
