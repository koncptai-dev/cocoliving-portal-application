import axios from "axios";

console.log("ENV CHECK:", process.env);
console.log("BASE URL:", process.env.EXPO_PUBLIC_BACKEND_URL);
export const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL,
});

// axiosInstance.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     console.log(
//       "error",
//       Object.keys(error),
//       error.message,
//       error.name,
//       error.request
//     );
//     // if (typeof window !== "undefined") {
//     //   const currentPath = window.location.pathname;

//     //   // Skip sign-out if the user is on the login page
//     //   if (currentPath !== "/login" && error.response?.status === 401) {
//     //     signOut();
//     //   }
//     // }

//     return Promise.reject(error);
//   }
// );
