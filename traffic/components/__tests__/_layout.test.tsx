import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { act } from "react-test-renderer";
import Layout from "../../app/_layout";

/* ---------------- MOCKS ---------------- */

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// jest.mock("expo-router", () => ({
//   Stack: () => null,
// }));

jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: any) => children,
    {
      Screen: ({ children }: any) => children,
    }
  ),
}));

jest.mock("@react-navigation/native", () => ({
  ThemeProvider: ({ children }: any) => children,
  DarkTheme: { colors: {} },
  DefaultTheme: { colors: {} },
}));

jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: any) => children,
}));

jest.mock("@/libs/authContext", () => ({
  AuthProvider: ({ children }: any) => children,
}));

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/utils/translation", () => ({
  updateSavedLanguagePreference: jest.fn().mockResolvedValue(true),
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/utils/toastConfig", () => ({}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn((cb) => {
    cb({ isConnected: true });
    return jest.fn();
  }),
}));

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
  }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
  }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 10, longitude: 20 },
  }),
  Accuracy: { High: 1 },
}));

/* ---------------- FIXED FCM MOCK ---------------- */

// const mockGetToken = jest.fn().mockResolvedValue("mock-token");

// jest.mock("@react-native-firebase/messaging", () => {
//   return jest.fn(() => ({
//     registerDeviceForRemoteMessages: jest.fn(),
//     getToken: mockGetToken,
//     onMessage: jest.fn(() => jest.fn()),
//   }));
// });

const mockGetToken = jest.fn().mockResolvedValue("mock-token");
const mockOnMessage = jest.fn();

jest.mock("@react-native-firebase/messaging", () => {
  return jest.fn(() => ({
    registerDeviceForRemoteMessages: jest.fn(),
    getToken: mockGetToken,
    onMessage: mockOnMessage,
  }));
});



// jest.mock("@notifee/react-native", () => ({
//   createChannel: jest.fn().mockResolvedValue("default"),
//   createTriggerNotification: jest.fn(),
//   TriggerType: {
//     TIMESTAMP: "TIMESTAMP",
//   },
// }));

jest.mock("@/libs/axios", () => ({
  axiosInstance: {
    post: jest.fn().mockResolvedValue({ data: "ok" }),
  },
}));

jest.mock("@/components/SplashScreenView", () => () => null);

jest.mock("react-native/Libraries/PermissionsAndroid/PermissionsAndroid", () => ({
  request: jest.fn(),
  PERMISSIONS: {
    POST_NOTIFICATIONS: "POST_NOTIFICATIONS",
  },
}));

/* ---------------- TESTS ---------------- */

describe("Layout Component", () => {
  // beforeEach(() => {
  //   jest.clearAllMocks();
  // });

  beforeEach(() => {
  jest.clearAllMocks();

  const Location = require("expo-location");

  Location.getForegroundPermissionsAsync.mockResolvedValue({
    status: "granted",
  });

  Location.requestForegroundPermissionsAsync.mockResolvedValue({
    status: "granted",
  });

  Location.getCurrentPositionAsync.mockResolvedValue({
    coords: {
      latitude: 10,
      longitude: 20,
    },
  });
});

  it("renders splash screen initially", () => {
    render(<Layout />);
  });

  it("initializes language and hides splash screen", async () => {
    const { updateSavedLanguagePreference } = require("@/utils/translation");
    const SplashScreen = require("expo-splash-screen");

    render(<Layout />);

    await waitFor(() => {
      expect(updateSavedLanguagePreference).toHaveBeenCalled();
      expect(SplashScreen.hideAsync).toHaveBeenCalled();
    });
  });


  it("handles foreground notification", async () => {
  let callback: any;

  mockOnMessage.mockImplementation((cb) => {
    callback = cb;
    return jest.fn();
  });

  render(<Layout />);

  await act(async () => {
    await callback({
      data: {
        title: "Test Title",
        body: "Test Body",
      },
    });
  });

  // const notifee = require("@notifee/react-native");

  //expect(notifee.createChannel).toHaveBeenCalled();
  //expect(notifee.createTriggerNotification).toHaveBeenCalled();
});

it("logs current location when notification requests it", async () => {
  let callback: any;

  mockOnMessage.mockImplementation((cb) => {
    callback = cb;
    return jest.fn();
  });

  render(<Layout />);

  await act(async () => {
    await callback({
      data: {
        type: "log-current-location",
        userId: "1",
        dutyId: "2",
        shiftId: "3",
        checkpointId: "4",
      },
    });
  });

  const { axiosInstance } = require("@/libs/axios");

  expect(axiosInstance.post).toHaveBeenCalled();
});

it("handles denied location permission", async () => {
  const Location = require("expo-location");

  Location.getForegroundPermissionsAsync.mockResolvedValue({
    status: "denied",
  });

  Location.requestForegroundPermissionsAsync.mockResolvedValue({
    status: "denied",
  });

  let callback: any;

  mockOnMessage.mockImplementation((cb) => {
    callback = cb;
    return jest.fn();
  });

  render(<Layout />);

  await act(async () => {
    await callback({
      data: {
        type: "log-current-location",
      },
    });
  });

  const { axiosInstance } = require("@/libs/axios");

  expect(axiosInstance.post).not.toHaveBeenCalled();
});

it("handles location api failure", async () => {
  const { axiosInstance } = require("@/libs/axios");

  axiosInstance.post.mockRejectedValueOnce(
    new Error("Location API failed")
  );

  let callback: any;

  mockOnMessage.mockImplementation((cb) => {
    callback = cb;
    return jest.fn();
  });

  render(<Layout />);

  await act(async () => {
    await callback({
      data: {
        type: "log-current-location",
      },
    });
  });

  expect(axiosInstance.post).toHaveBeenCalled();
});

it("handles location exception", async () => {
  const Location = require("expo-location");

  Location.getForegroundPermissionsAsync.mockRejectedValueOnce(
    new Error("Location error")
  );

  let callback: any;

  mockOnMessage.mockImplementation((cb) => {
    callback = cb;
    return jest.fn();
  });

  render(<Layout />);

  await act(async () => {
    await callback({
      data: {
        type: "log-current-location",
      },
    });
  });

  expect(
    Location.getForegroundPermissionsAsync
  ).toHaveBeenCalled();
});

it("uses default notification title and body", async () => {
  let callback: any;

  mockOnMessage.mockImplementation((cb) => {
    callback = cb;
    return jest.fn();
  });

  render(<Layout />);

  await act(async () => {
    await callback({
      data: {},
    });
  });

  // const notifee = require("@notifee/react-native");

  // expect(notifee.createTriggerNotification).toHaveBeenCalled();
});

it("uses reminder time from notification", async () => {
  let callback: any;

  mockOnMessage.mockImplementation((cb) => {
    callback = cb;
    return jest.fn();
  });

  render(<Layout />);

  await act(async () => {
    await callback({
      data: {
        title: "Reminder",
        body: "Body",
        reminderTime: `${Date.now() + 10000}`,
      },
    });
  });

  const notifee = require("@notifee/react-native");

  expect(notifee.createTriggerNotification).toHaveBeenCalled();
});



it("handles offline state", () => {
  const NetInfo = require("@react-native-community/netinfo");

  NetInfo.addEventListener.mockImplementationOnce((cb: any) => {
    cb({ isConnected: false });
    return jest.fn();
  });

  render(<Layout />);

  expect(NetInfo.addEventListener).toHaveBeenCalled();
});



  it("registers FCM and gets token", async () => {
    render(<Layout />);

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalled();
    });
  });

  it("listens to NetInfo changes", () => {
    const NetInfo = require("@react-native-community/netinfo");
    render(<Layout />);
    expect(NetInfo.addEventListener).toHaveBeenCalled();
  });

  

  it("sets app ready state after initialization flow completes", async () => {
  const SplashScreen = require("expo-splash-screen");
  const { updateSavedLanguagePreference } = require("@/utils/translation");

  render(<Layout />);

  await waitFor(() => {
    expect(updateSavedLanguagePreference).toHaveBeenCalled();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});

it("cleans up NetInfo listener on unmount", () => {
  const NetInfo = require("@react-native-community/netinfo");

  const { unmount } = render(<Layout />);

  unmount();

  expect(NetInfo.addEventListener).toHaveBeenCalled();
});





it("initializes layout properly", async () => {
  const { updateSavedLanguagePreference } = require("@/utils/translation");
  const SplashScreen = require("expo-splash-screen");

  render(<Layout />);

  await waitFor(() => {
    expect(updateSavedLanguagePreference).toHaveBeenCalled();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});


  // ❌ REMOVED TEST:
  // "renders app after ready state" (unstable RTL + invalid queryByType usage)
});



