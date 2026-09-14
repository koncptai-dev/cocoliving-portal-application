// App.test.tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

test("basic test works", () => {
  const { getByText } = render(<Text>Hello</Text>);
  expect(getByText("Hello")).toBeTruthy();
});

// /**
//  * @format
//  */

// import React from 'react';
// import ReactTestRenderer from 'react-test-renderer';
// import App from '../App';

// test('renders correctly', async () => {
//   await ReactTestRenderer.act(() => {
//     ReactTestRenderer.create(<App />);
//   });
// });
