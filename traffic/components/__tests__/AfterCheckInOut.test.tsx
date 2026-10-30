import React from "react";
import { render } from "@testing-library/react-native";

// ================= MOCKS =================

jest.mock("expo-router", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: "Icon",
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

jest.mock("./SwipeToConfirmModal", () => "SwipeToConfirmModal");

jest.mock("@/constants/Colors", () => ({
  Colors: {
    primary: {
      color: "#000",
      textBlack: "#000",
    },
    secondary: {
      color: "#111",
    },
  },
}));

// ================= IMPORT COMPONENT =================

import AfterCheckInOut from "../src/components/AfterCheckInOut";

// ================= MOCK DATA =================

const mockCurrentShift = {
  shiftInTpam: {
    label: "Morning Shift",
  },
  startTime: "2025-05-07T09:00:00",
  endTime: "2025-05-07T18:00:00",
  checkpointInTpam: {
    name: "Main Gate",
  },
};

const mockUpcomingShift = {
  shiftInTpam: {
    label: "Night Shift",
  },
  startTime: "2025-05-07T20:00:00",
  endTime: "2025-05-08T05:00:00",
  checkpointInTpam: {
    name: "Checkpoint B",
  },
};

// ================= TESTS =================

describe("AfterCheckInOut", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Test 1
  it("renders Shift Ended text", () => {
    const { getByText } = render(
      <AfterCheckInOut
        currentShiftData={mockCurrentShift}
        upcomingShiftData={mockUpcomingShift}
      />
    );

    expect(getByText("Shift Ended ")).toBeTruthy();
  });

  // ✅ Test 2
  it("renders current shift label", () => {
    const { getByText } = render(
      <AfterCheckInOut
        currentShiftData={mockCurrentShift}
        upcomingShiftData={mockUpcomingShift}
      />
    );

    expect(getByText("Morning Shift")).toBeTruthy();
  });

  // ✅ Test 3
  it("renders next shift label", () => {
    const { getByText } = render(
      <AfterCheckInOut
        currentShiftData={mockCurrentShift}
        upcomingShiftData={mockUpcomingShift}
      />
    );

    expect(getByText("Night Shift")).toBeTruthy();
  });

  // ✅ Test 4
  it("renders checkpoint names", () => {
    const { getByText } = render(
      <AfterCheckInOut
        currentShiftData={mockCurrentShift}
        upcomingShiftData={mockUpcomingShift}
      />
    );

    expect(getByText("Main Gate")).toBeTruthy();
    expect(getByText("Checkpoint B")).toBeTruthy();
  });

  // ✅ Test 5
  it("shows fallback message when no upcoming shift", () => {
    const { getByText } = render(
      <AfterCheckInOut
        currentShiftData={mockCurrentShift}
        upcomingShiftData={null}
      />
    );

    expect(
      getByText("No Next Shift Available for Today")
    ).toBeTruthy();
  });

  // ✅ Test 6
  it("renders formatted current shift time", () => {
    const { getByText } = render(
      <AfterCheckInOut
        currentShiftData={mockCurrentShift}
        upcomingShiftData={mockUpcomingShift}
      />
    );

    expect(getByText("09:00 - 18:00")).toBeTruthy();
  });

  // ✅ Test 7
  it("renders formatted upcoming shift time", () => {
    const { getByText } = render(
      <AfterCheckInOut
        currentShiftData={mockCurrentShift}
        upcomingShiftData={mockUpcomingShift}
      />
    );

    expect(getByText("20:00 - 05:00")).toBeTruthy();
  });
});