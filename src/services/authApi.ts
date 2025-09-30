import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://app-e2hhu.ondigitalocean.app",
    prepareHeaders: (headers, { getState }) => {
      // Get token from localStorage first, then fallback to Redux state
      const token = localStorage.getItem("token");

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      // Set content-type for JSON requests
      headers.set("Content-Type", "application/json");

      return headers;
    },
  }),
  tagTypes: ["CandidateList"],
  endpoints: (builder) => ({
    loginUser: builder.mutation({
      query: (credentials: {
        email: string;
        password: string;
        role: string;
      }) => ({
        url: "/auth/role/login",
        method: "POST",
        body: credentials,
      }),
    }),
    getCandidateList: builder.query({
      query: () => ({
        url: "/candidates/candidate/list",
        method: "GET",
      }),
      providesTags: ["CandidateList"],
    }),
  }),
});

export const { useLoginUserMutation, useGetCandidateListQuery } = authApi;
