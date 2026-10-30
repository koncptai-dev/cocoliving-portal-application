import { axiosInstance } from "@/libs/axios"; // adjust path

export const deleteAccount = async () => {
  const response = await axiosInstance.delete("userApp/delete-account");
  return response.data;
};