module.exports = {
  preset: "react-native",
  setupFiles: ["./jest.setup.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-navigation)/)",
  ],
};