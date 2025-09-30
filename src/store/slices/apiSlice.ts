import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { parse } from "cookie";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://app-e2hhu.ondigitalocean.app",
    prepareHeaders: (headers, { getState }) => {
      if (typeof window === "undefined") {
        const cookies = parse(headers.get("cookie") || "");
        const token = cookies.token;
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      } else {
        const token = localStorage.getItem("token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["User", "Candidates", "Mobilizers"],
  endpoints: (builder) => ({
    // Auth APIs
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/role/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    getCandidatesList: builder.query({
      query: () => ({
        url: "/candidates/candidate/list",
        method: "GET",
      }),
      providesTags: ["Candidates"],
    }),
    getMobilizerList: builder.query({
      query: () => "/counsellor/manager/list",
      providesTags: ["Mobilizers"],
    }),
    getMobiliserCandidateList: builder.query({
      query: (id) => `/counsellor/candidate/list/${id}`,
      providesTags: ["Candidates"],
    }),
    getCandidateDetails: builder.query({
      query: (id) => `/counsellor/candidate/${id}`,
      providesTags: ["Candidates"],
    }),
    updateCandidateStatus: builder.mutation({
      query: (data) => ({
        url: "/counsellor/candidate/status/change",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Candidates"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCandidatesListQuery,
  useGetMobilizerListQuery,
  useGetMobiliserCandidateListQuery,
  useGetCandidateDetailsQuery,
  useUpdateCandidateStatusMutation,
} = apiSlice;
