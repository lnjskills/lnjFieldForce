import { createSlice } from "@reduxjs/toolkit";
const isClient = typeof window !== "undefined";

const initialState = {
  user: isClient ? localStorage.getItem("user") || null : null,
  role: isClient ? localStorage.getItem("userRole") || null : null,
  token: isClient ? localStorage.getItem("accessToken") || null : null,
  permissions: isClient
    ? JSON.parse(localStorage.getItem("permissions") || "{}")
    : {},
  isAuthenticated: isClient ? !!localStorage.getItem("accessToken") : false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.permissions = action.payload.permissions || {};
      state.isAuthenticated = true;

      if (isClient) {
        localStorage.setItem("accessToken", action.payload.token);
        localStorage.setItem("userRole", action.payload.role);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem(
          "permissions",
          JSON.stringify(action.payload.permissions || {})
        );
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.permissions = {};
      state.isAuthenticated = false;

      if (isClient) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
        localStorage.removeItem("permissions");
      }
    },
    rehydrate: (state) => {
      if (isClient) {
        const token = localStorage.getItem("accessToken");
        const role = localStorage.getItem("userRole");
        const permissions = JSON.parse(
          localStorage.getItem("permissions") || "{}"
        );
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (token) {
          state.token = token;
          state.role = role;
          state.permissions = permissions;
          state.user = user;
          state.isAuthenticated = true;
        }
      }
    },
  },
});

export const { setUser, logout, rehydrate } = authSlice.actions;
export default authSlice.reducer;
