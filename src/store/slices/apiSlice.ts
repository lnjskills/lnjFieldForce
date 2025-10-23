import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { parse } from "cookie";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://app-e2hhu.ondigitalocean.app",
    prepareHeaders: (headers, { getState }) => {
      if (typeof window === "undefined") {
        // Server-side: Parse cookies from headers
        const cookieHeader = headers.get("cookie");
        if (cookieHeader) {
          const cookies = parse(cookieHeader);
          const token = cookies.token;
          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
        }
      } else {
        // Client-side: Use localStorage
        const token = localStorage.getItem("token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ["User", "Center", "Candidates", "Mobilizers", "Centers"],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/role/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    // Candidates
    getCandidatesList: builder.query({
      query: () => ({
        url: "/candidates/candidate/list",
        method: "GET",
      }),
      providesTags: ["Candidates"],
    }),
    getCandidateDetails: builder.query({
      query: (id) => `/candidates/detail/${id}`,
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

    // Mobilizers
    // getMobilizerList: builder.query({
    //   query: () => "/counsellor/manager/list",
    //   providesTags: ["Mobilizers"],
    // }),
    searchMobilizers: builder.mutation({
      query: (searchTerm: string) => ({
        url: "/counsellor/manager/list",
        method: "POST",
        body: { search: searchTerm },
      }),
      invalidatesTags: ["Mobilizers"], // Invalidate cache to refresh mobilizer list
    }),
    getMobiliserCandidateList: builder.query({
      query: (id) => `/counsellor/candidate/list/${id}`,
      providesTags: ["Candidates"],
    }),

    // Centers (for Assigned Center dropdown)
    getCentersList: builder.query({
      query: () => ({
        url: "/admin/centre/list",
        method: "GET",
      }),
      providesTags: ["Centers"],
    }),

    // Users: list, detail, add, delete
    getUsersList: builder.query({
      query: () => ({
        url: "/admin/user/list",
        method: "GET",
      }),
      providesTags: (result: Array<{ id: number }> | undefined) =>
        Array.isArray(result) && result.length
          ? [
              ...result.map((user) => ({
                type: "User" as const,
                id: user.id,
              })),
              { type: "User" as const, id: "LIST" },
            ]
          : [{ type: "User" as const, id: "LIST" }],
    }),

    getUserDetail: builder.query({
      query: (id) => ({
        url: `/admin/user/detail/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "User" as const, id }],
    }),

    addUser: builder.mutation({
      query: (user) => ({
        url: "/admin/user/add",
        method: "POST",
        body: user,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/user/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    // add get detai and delete for center

    getCenterDetail: builder.query({
      query: (id) => ({
        url: `/admin/user/detail/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "User" as const, id }],
    }),

    addCenter: builder.mutation({
      query: (center) => ({
        url: "/admin/centre/add",
        method: "POST",
        body: center,
      }),
      invalidatesTags: [{ type: "Center", id: "LIST" }],
    }),

    deleteCenter: builder.mutation({
      query: (id) => ({
        url: `/admin/user/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCandidatesListQuery,
  useSearchMobilizersMutation,
  // useGetMobilizerListQuery,
  useGetMobiliserCandidateListQuery,
  useGetCandidateDetailsQuery,
  useUpdateCandidateStatusMutation,
  useGetCentersListQuery,
  useGetUsersListQuery,
  useGetUserDetailQuery,
  useAddUserMutation,
  useDeleteUserMutation,
  useAddCenterMutation,
} = apiSlice;
