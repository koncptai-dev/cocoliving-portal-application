module.exports = {
  preset: "react-native",

  setupFiles: ["./jest.setup.js"],

  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },

  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node",
  ],

  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-navigation)/)",
  ],

  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: "./reports",
        filename: "jest-report.html",
        expand: true,
      },
    ],
  ],
};

// module.exports = {
//   preset: "react-native",
//   setupFiles: ["./jest.setup.js"],
//   transform: {
//     "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
//   },
//   moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
//   transformIgnorePatterns: [
//     "node_modules/(?!(react-native|@react-native|@react-navigation)/)",
//   ],
// };