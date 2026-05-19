import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import Toast from "react-native-toast-message";
import axios from "axios";
import RegisterProfileScreen from "../src/pages/Register";

// ---------------- MOCKS ----------------

// axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Toast
jest.mock("react-native-toast-message", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Toast = () => <View testID="toast" />;
  Toast.show = jest.fn();

  return Toast;
});

// image picker (IMPORTANT)
jest.mock("react-native-image-picker", () => ({
  launchCamera: jest.fn(),
}));

// Date picker
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

// vector icons
jest.mock("react-native-vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return () => <Text>Icon</Text>;
});

// config
jest.mock("react-native-config", () => ({
  API_BASE_URL: "https://mock-api.com",
}));

// navigation mock
const mockReplace = jest.fn();
const mockNavigation = {
  replace: mockReplace,
};

const mockRoute = {
  params: {},
};

// ---------------- TESTS ----------------

describe("RegisterProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ RUN ONLY THIS FIRST
  

it("shows error when required fields are empty on Send OTP", async () => {
  const { getByText } = render(
    <RegisterProfileScreen navigation={mockNavigation} route={mockRoute} />
  );

  fireEvent.press(getByText("Send OTP"));

  await waitFor(() => {
    expect(Toast.show).toHaveBeenCalledWith({
      type: "error",
      text1: "Enter full name",
    });
  });
});


it("sends OTP successfully and shows OTP screen", async () => {
  mockedAxios.post.mockResolvedValueOnce({}); // send OTP API

  const { getByText, getByPlaceholderText, findByText } = render(
    <RegisterProfileScreen navigation={mockNavigation} route={mockRoute} />
  );

  // fill required fields (USE PLACEHOLDERS)
  fireEvent.changeText(getByPlaceholderText("First Name"), "John");
  fireEvent.changeText(getByPlaceholderText("Last Name"), "Doe");
  fireEvent.changeText(getByPlaceholderText("Mobile Number"), "9876543210");
  fireEvent.changeText(getByPlaceholderText("Email ID"), "test@mail.com");

  // press send OTP
  fireEvent.press(getByText("Send OTP"));

  // OTP UI should appear
  const otpField = await findByText(/Enter OTP/i);

  expect(otpField).toBeTruthy();

  // API called
  expect(mockedAxios.post).toHaveBeenCalled();
});





it("shows error when OTP is empty on submit", async () => {
  mockedAxios.post.mockResolvedValueOnce({}); // send OTP

  const { getByText, getByPlaceholderText } = render(
    <RegisterProfileScreen navigation={mockNavigation} route={mockRoute} />
  );

  // fill required fields
  fireEvent.changeText(getByPlaceholderText("First Name"), "John");
  fireEvent.changeText(getByPlaceholderText("Last Name"), "Doe");
  fireEvent.changeText(getByPlaceholderText("Mobile Number"), "9876543210");
  fireEvent.changeText(getByPlaceholderText("Email ID"), "test@mail.com");

  // send OTP
  fireEvent.press(getByText("Send OTP"));

  // now OTP screen is visible
  await waitFor(() => {
    expect(getByText(/Complete Registration/i)).toBeTruthy();
  });

  // press without OTP
  fireEvent.press(getByText("Complete Registration"));

  await waitFor(() => {
    expect(Toast.show).toHaveBeenCalledWith({
      type: "error",
      text1: "Enter OTP",
    });
  });
});






});