import axiosClient from "../../api";

export const getStaff = async () => {
  try {
    const response = await axiosClient("/api/admin/staff/getStaff");
    return response.data;
  } catch {

    return [];
  }
};

export const deleteStaff = async (id) => {
  try {
    const response = await axiosClient.get("/api/staff/deleteStaff", id);
    return response.data;
  } catch {

    return [];
  }
};

export const updateStaff = async (id, updatedData) => {
  try {
    const response = await axiosClient.get(
      "/api/staff/updateStaff",
      id,
      updatedData,
    );
    return response.data;
  } catch {

    return [];
  }
};

export const createStaff = async (data) => {
  try {
    const response = await axiosClient.post("/api/staff/createStaff", data);
    return response.data;
  } catch {

    return null;
  }
};
