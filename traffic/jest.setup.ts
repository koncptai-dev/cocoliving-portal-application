// ✅ Required for React 18 testing
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/* ---------------- MOCK: expo vector icons ---------------- */
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    Ionicons: (props: any) => React.createElement("Icon", props),
    MaterialCommunityIcons: (props: any) =>
      React.createElement("Icon", props),
    FontAwesome: (props: any) => React.createElement("Icon", props),
  };
});

/* ---------------- MOCK: expo-font ---------------- */
jest.mock("expo-font", () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
}));

/* ---------------- OPTIONAL: silence warnings ---------------- */
jest.spyOn(console, "warn").mockImplementation(() => {});