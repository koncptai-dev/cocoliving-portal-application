import React from "react";
import { render } from "@testing-library/react-native";
import BeforeCheckInOut from "../checkin/BeforeCheckInOut";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


import { fireEvent, waitFor } from "@testing-library/react-native";

/* ---------------- AXIOS MOCK ---------------- */
const mockPut = jest.fn();

jest.mock("@/libs/axios", () => ({
  put: (...args: any[]) => mockPut(...args),
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 10,
        longitude: 20,
      },
    })
  ),
}));
/* ---------------- FIX: VECTOR ICONS ---------------- */
jest.mock("@expo/vector-icons", () => {
  return {
    Ionicons: "Ionicons",
    MaterialCommunityIcons: "MaterialCommunityIcons",
    FontAwesome: "FontAwesome",
  };
});

/* ---------------- ROUTER ---------------- */
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));



/* ---------------- TOAST ---------------- */
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

/* ---------------- TRANSLATION ---------------- */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string) => k,
  }),
}));

/* ---------------- COLORS ---------------- */
jest.mock("@/constants/Colors", () => ({
  Colors: {
    primary: {
      color: "#000",
      textBlack: "#000",
      background: "#000",
    },
  },
}));

/* ---------------- TEST DATA ---------------- */
// const shift = {
//   id: "1",
//   shiftInTpam: { label: "Morning Shift" },
//   checkpointInTpam: {
//     name: "Checkpoint A",
//     id: "cp1",
//     lattitude: 10,
//     longitude: 20,
//   },
//   startTime: "2026-01-01T10:00:00Z",
//   endTime: "2026-01-01T12:00:00Z",
// };
const shift = {
  id: "1",
  shiftInTpam: { label: "Morning Shift" },
  checkpointInTpam: {
    name: "Checkpoint A",
    id: "cp1",
    lattitude: 10,
    longitude: 20,
  },
  startTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // ✅ started 1 hr ago
  endTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),   // ✅ ends in 1 hr
};
/* ---------------- WRAPPER (IMPORTANT) ---------------- */
const createWrapper = () => {
  const queryClient = new QueryClient();

  return ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/* ---------------- TESTS ---------------- */

describe("BeforeCheckInOut", () => {
  it("renders empty state when shift is null", () => {
    const { getByText } = render(
      <BeforeCheckInOut
        upcomingShiftData={null}
        setIsShiftCompleted={jest.fn()}
      />,
      { wrapper: createWrapper() } // ✅ FIX HERE
    );

    expect(
      getByText("No upcoming shifts available for today")
    ).toBeTruthy();
  });

  it("renders shift details correctly", () => {
    const { getByText } = render(
      <BeforeCheckInOut
        upcomingShiftData={shift}
        setIsShiftCompleted={jest.fn()}
      />,
      { wrapper: createWrapper() } // ✅ FIX HERE
    );

    expect(getByText("Morning Shift")).toBeTruthy();
    expect(getByText("Checkpoint A")).toBeTruthy();
  });


it("calls punch-in API when button pressed", async () => {
  mockPut.mockResolvedValueOnce({ status: 200, data: {} });

  const { getByTestId } = render(
    <BeforeCheckInOut
      upcomingShiftData={shift}
      setIsShiftCompleted={jest.fn()}
    />,
    { wrapper: createWrapper() }
  );

  const button = getByTestId("punch-in-button");

  fireEvent.press(button); // ❌ don't await (not needed)

  await waitFor(() => {
    expect(mockPut).toHaveBeenCalledTimes(1); // ✅ stricter
  });
});

});