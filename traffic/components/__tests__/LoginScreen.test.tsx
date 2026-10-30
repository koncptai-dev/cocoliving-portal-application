import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import LoginScreen from "../Login/LoginScreen";
import { toggleLanguage } from "@/utils/translation";
import { axiosInstance } from "@/libs/axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* -------------------- QueryClient -------------------- */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

/* -------------------- ICONS -------------------- */
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    MaterialCommunityIcons: (props: any) =>
      React.createElement("Icon", props),
    Ionicons: (props: any) => React.createElement("Icon", props),
  };
});

/* -------------------- FONT -------------------- */
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

/* -------------------- I18N -------------------- */
jest.mock("@/utils/translation", () => ({
  toggleLanguage: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string) => k,
    i18n: { changeLanguage: jest.fn() },
  }),
}));

/* -------------------- AXIOS -------------------- */
jest.mock("@/libs/axios", () => ({
  axiosInstance: {
    post: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

/* -------------------- AUTH -------------------- */
const mockLogin = jest.fn();

jest.mock("@/libs/authContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

/* -------------------- DEVICE -------------------- */
jest.mock("react-native-device-info", () => ({
  getUniqueId: jest.fn(() => Promise.resolve("device123")),
  getDeviceName: jest.fn(() => Promise.resolve("My Device")),
}));

/* -------------------- SECURE STORE -------------------- */
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
}));

/* -------------------- ROUTER -------------------- */
jest.mock("expo-router", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

/* -------------------- WRAPPERS -------------------- */
jest.mock("@/components/NoInternetWrapper", () => {
  return ({ children }: any) => children;
});

jest.mock("@/constants/Colors", () => ({
  Colors: {
    primary: {
      background: "#000",
    },
  },
}));

/* -------------------- CLEANUP -------------------- */
afterEach(() => {
  jest.clearAllMocks();
});

/* ==================== TESTS ==================== */

describe("LoginScreen", () => {
  it("should allow typing username/password", () => {
    const { getByPlaceholderText } = renderWithClient(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "admin");
    fireEvent.changeText(getByPlaceholderText("Password"), "1234");

    expect(getByPlaceholderText("Username").props.value).toBe("admin");
    expect(getByPlaceholderText("Password").props.value).toBe("1234");
  });

  it("should login successfully", async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValue({
      data: { token: "123" },
    });

    const { getByText, getByPlaceholderText } =
      renderWithClient(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "admin");
    fireEvent.changeText(getByPlaceholderText("Password"), "1234");

    fireEvent.press(getByText("login"));

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it("should handle login failure (no crash)", async () => {
    (axiosInstance.post as jest.Mock).mockRejectedValue({
      response: {
        data: { message: "Invalid credentials" },
      },
    });

    const { getByText, getByPlaceholderText } =
      renderWithClient(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText("Username"), "admin");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrong");

    fireEvent.press(getByText("login"));

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalled();
    });
  });



it("should send correct payload to API", async () => {
  (axiosInstance.post as jest.Mock).mockResolvedValue({
    data: { token: "123" },
  });

  const { getByText, getByPlaceholderText } =
    renderWithClient(<LoginScreen />);

  fireEvent.changeText(getByPlaceholderText("Username"), "admin");
  fireEvent.changeText(getByPlaceholderText("Password"), "1234");

  fireEvent.press(getByText("login"));

  await waitFor(() => {
    expect(axiosInstance.post).toHaveBeenCalledWith(
      "auth/login/",
      expect.objectContaining({
        username: "admin",
        password: "1234",
        userApp: true,
      })
    );
  });
});






it("should store user data in secure storage", async () => {
  (axiosInstance.post as jest.Mock).mockResolvedValue({
    data: { token: "123" },
  });

  const { getByText, getByPlaceholderText } =
    renderWithClient(<LoginScreen />);

  fireEvent.changeText(getByPlaceholderText("Username"), "admin");
  fireEvent.changeText(getByPlaceholderText("Password"), "1234");

  fireEvent.press(getByText("login"));

  await waitFor(() => {
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "userDetails",
      JSON.stringify({ token: "123" })
    );
  });
});





it("should toggle language", () => {
  const { getByTestId } = renderWithClient(<LoginScreen />);

  fireEvent.press(getByTestId("toggle-language"));

  expect(toggleLanguage).toHaveBeenCalled();
});



it("should handle error without message safely", async () => {
  (axiosInstance.post as jest.Mock).mockRejectedValue({});

  const { getByText, getByPlaceholderText } =
    renderWithClient(<LoginScreen />);

  fireEvent.changeText(getByPlaceholderText("Username"), "admin");
  fireEvent.changeText(getByPlaceholderText("Password"), "wrong");

  fireEvent.press(getByText("login"));

  await waitFor(() => {
    expect(axiosInstance.post).toHaveBeenCalled();
  });
});


});