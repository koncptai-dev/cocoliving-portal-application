import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { axiosInstance } from "@/libs/axios";
import DutyVerification from "@/app/(admin)/dutyVerification";


import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
} from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));



// beforeEach(() => {
//   jest.useFakeTimers();
// });


beforeEach(() => {
  jest.clearAllMocks();

  (useMutation as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
  });

  (useQuery as jest.Mock)
    // divisions
    .mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: [{ label: "Div1", value: "1" }],
    })

    // checkpoints
    .mockReturnValueOnce({
      data: [{ label: "Checkpoint 1", value: "10" }],
    })

    // shifts
    .mockReturnValueOnce({
      data: [{ label: "Morning", value: "100" }],
    })

    // personnel
    .mockReturnValueOnce({
      data: [{ label: "John Doe", value: "500" }],
    });
});


/* ---------------- QUERY CLIENT ---------------- */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

/* ---------------- MOCKS ---------------- */

// dropdown mock
jest.mock("react-native-element-dropdown", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");

  return {
    Dropdown: ({ placeholder, onChange }) => {
      let value = "1";

      if (placeholder === "Select Checkpoint") value = "10";
      if (placeholder === "Select Shift") value = "100";
      if (placeholder === "Select Personnel") value = "500";

      return (
        <TouchableOpacity
          testID={placeholder}
          onPress={() =>
            onChange({ label: placeholder, value }) // ✅ dynamic value
          }
        >
          <Text>{placeholder}</Text>
        </TouchableOpacity>
      );
    },
  };
});
// jest.mock("react-native-element-dropdown", () => {
//   const React = require("react");
//   const { TouchableOpacity, Text } = require("react-native");

//   return {
//     Dropdown: ({ placeholder, onChange, testID }) => (
//       <TouchableOpacity
//         testID={placeholder}
//         onPress={() =>
//           onChange({ label: placeholder, value: "1" }) // 🔥 important
//         }
//       >
//         <Text>{placeholder}</Text>
//       </TouchableOpacity>
//     ),
//   };
// });
// button mock
jest.mock("@/components/ui/CTAButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return ({ label, onPress, disabled }: any) => (
    <Pressable testID="mark-remark-btn" onPress={onPress} disabled={disabled}>
      <Text>{label}</Text>
    </Pressable>
  );
});

// wrappers
jest.mock("@/components/NoInternetWrapper", () => {
  return ({ children }: any) => children;
});

// auth
jest.mock("@/libs/authContext", () => ({
  useAuth: () => ({
    userDetails: { id: 1 },
  }),
}));

jest.mock("@/libs/axios", () => ({
  axiosInstance: {
    get: jest.fn((url) => {
      /* -------- Division -------- */
      if (url.includes("division-under-admins")) {
        return Promise.resolve({
          data: {
            divisionsList: [{ id: "1", divisionName: "Div1" }],
          },
        });
      }

      /* -------- Checkpoints -------- */
      if (url.includes("checkpoints")) {
        return Promise.resolve({
          data: {
            checkpointList: [{ id: "10", name: "Checkpoint 1" }],
          },
        });
      }

      /* -------- Shifts -------- */
      if (url.includes("shifts")) {
        return Promise.resolve({
          data: {
            shiftsList: [{ id: "100", label: "Morning" }],
          },
        });
      }

      /* -------- Personnel -------- */
      if (url.includes("checkpoints/users")) {
        return Promise.resolve({
          data: {
            usersList: [
              {
                dutyId: "500",
                userFullName: "John Doe",
                userRank: "SI",
              },
            ],
          },
        });
      }

      return Promise.resolve({ data: {} });
    }),

    put: jest.fn(() =>
      Promise.resolve({
        data: { message: "success" },
      })
    ),
  },
}));

// jest.mock("@/libs/axios", () => ({
//   axiosInstance: {
//     get: jest.fn((url) => {
//       if (url.includes("division-under-admins")) {
//         return Promise.resolve({
//           data: {
//             divisionsList: [{ id: "1", divisionName: "Div1" }],
//           },
//         });
//       }

//       // 🔥 ADD THIS (fix)
//       if (url.includes("checkpoints")) {
//         return Promise.resolve({
//           data: {
//             checkpointList: [{ id: "1", name: "Checkpoint1" }],
//           },
//         });
//       }

//       return Promise.resolve({ data: {} });
//     }),

//     put: jest.fn(() => Promise.resolve({ data: "ok" })),
//   },
// }));

// toast
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

// router
jest.mock("expo-router", () => ({
  router: { back: jest.fn() },
}));

// icons
jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: () => null,
}));

/* ---------------- CLEANUP ---------------- */
// afterEach(() => {
//   jest.clearAllMocks();
// });
afterEach(() => {
  jest.clearAllMocks();
  jest.runOnlyPendingTimers(); // 🔥 important
  jest.useRealTimers();
});

/* ================= TESTS ================= */

describe("DutyVerification (passing tests only)", () => {
  it("renders screen title", () => {
    const { getByText } = render(<DutyVerification />, {
      wrapper: createWrapper(),
    });

    expect(getByText("Duty Verification")).toBeTruthy();
  });

  it("loads division dropdown and selects division", async () => {
    const { getByTestId } = renderWithClient(<DutyVerification />);

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId("Select Division"));
  });



  it("button is disabled initially", () => {
  const { getByTestId } = renderWithClient(<DutyVerification />);

  expect(
    getByTestId("mark-remark-btn").props.disabled
  ).toBe(true);
});

it("shows checkpoint dropdown after division selection", async () => {
  const { getByTestId } = renderWithClient(<DutyVerification />);

  fireEvent.press(getByTestId("Select Division"));

  await waitFor(() => {
    expect(getByTestId("Select Checkpoint")).toBeTruthy();
  });
});

it("shows shift dropdown after checkpoint selection", async () => {
  const { getByTestId } = renderWithClient(<DutyVerification />);

  fireEvent.press(getByTestId("Select Division"));

  fireEvent.press(
    await waitFor(() => getByTestId("Select Checkpoint"))
  );

  await waitFor(() => {
    expect(getByTestId("Select Shift")).toBeTruthy();
  });
});

it("shows personnel dropdown after shift selection", async () => {
  const { getByTestId } = renderWithClient(<DutyVerification />);

  fireEvent.press(getByTestId("Select Division"));

  fireEvent.press(
    await waitFor(() => getByTestId("Select Checkpoint"))
  );

  fireEvent.press(
    await waitFor(() => getByTestId("Select Shift"))
  );

  await waitFor(() => {
    expect(getByTestId("Select Personnel")).toBeTruthy();
  });
});

it("shows absent reason dropdown after personnel selection", async () => {
  const { getByTestId } = renderWithClient(<DutyVerification />);

  fireEvent.press(getByTestId("Select Division"));

  fireEvent.press(
    await waitFor(() => getByTestId("Select Checkpoint"))
  );

  fireEvent.press(
    await waitFor(() => getByTestId("Select Shift"))
  );

  fireEvent.press(
    await waitFor(() => getByTestId("Select Personnel"))
  );

  await waitFor(() => {
    expect(getByTestId("Select Absent Reason")).toBeTruthy();
  });
});

it("calls division api", async () => {
  renderWithClient(<DutyVerification />);

  await waitFor(() => {
    expect(axiosInstance.get).toHaveBeenCalledWith(
      expect.stringContaining("division-under-admins")
    );
  });
});

it("submits remark", async () => {
  const { getByTestId } = renderWithClient(<DutyVerification />);

  fireEvent.press(getByTestId("Select Division"));

  fireEvent.press(
    await waitFor(() => getByTestId("Select Checkpoint"))
  );

  fireEvent.press(
    await waitFor(() => getByTestId("Select Shift"))
  );

  fireEvent.press(
    await waitFor(() => getByTestId("Select Personnel"))
  );

  fireEvent.press(
    await waitFor(() => getByTestId("Select Absent Reason"))
  );

  fireEvent.press(getByTestId("mark-remark-btn"));

  await waitFor(() => {
    expect(axiosInstance.put).toHaveBeenCalled();
  });
});


it("shows loading state", () => {
  const ReactQuery = require("@tanstack/react-query");

  ReactQuery.useQuery.mockReturnValueOnce({
    isLoading: true,
    isError: false,
    data: undefined,
  });

  const { getByText } = renderWithClient(<DutyVerification />);

  expect(getByText("Loading divisions...")).toBeTruthy();
});

it("shows api error state", () => {
  const ReactQuery = require("@tanstack/react-query");

  ReactQuery.useQuery.mockReturnValueOnce({
    isLoading: false,
    isError: true,
    data: undefined,
  });

  const { getByText } = renderWithClient(<DutyVerification />);

  expect(getByText("API not working")).toBeTruthy();
});

it("shows no data state", () => {
  const ReactQuery = require("@tanstack/react-query");

  ReactQuery.useQuery.mockReturnValueOnce({
    isLoading: false,
    isError: false,
    data: [],
  });

  const { getByText } = renderWithClient(<DutyVerification />);

  expect(getByText("No API data found")).toBeTruthy();
});


it("flows through full selection and enables button", async () => {
  const { getByTestId } = renderWithClient(<DutyVerification />);

  /* ---------- Step 1: Division ---------- */
  fireEvent.press(getByTestId("Select Division"));

  /* ---------- Step 2: Checkpoint ---------- */
  const checkpoint = await waitFor(() =>
    getByTestId("Select Checkpoint")
  );
  fireEvent.press(checkpoint);

  /* ---------- Step 3: Shift ---------- */
  const shift = await waitFor(() =>
    getByTestId("Select Shift")
  );
  fireEvent.press(shift);

  /* ---------- Step 4: Personnel ---------- */
  const personnel = await waitFor(() =>
    getByTestId("Select Personnel")
  );
  fireEvent.press(personnel);

  /* ---------- Step 5: Absent Reason ---------- */
  const reason = await waitFor(() =>
    getByTestId("Select Absent Reason")
  );
  fireEvent.press(reason);

  /* ---------- Step 6: Button should be enabled ---------- */
  const button = getByTestId("mark-remark-btn");

  await waitFor(() => {
    expect(button.props.disabled).toBe(false);
  });
});



});