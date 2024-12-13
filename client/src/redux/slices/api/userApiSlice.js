import { apiSlice } from "../apiSlice";
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Initial state
const initialState = {
    email: '',
    notifications: [],
};

// Async thunk to fetch notifications (example)
export const fetchNotifications = createAsyncThunk(
    'user/fetchNotifications',
    async () => {
        const response = await fetch('/api/notifications'); // Modify with your API
        return response.json();
    }
);

// Redux slice for the user
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setEmail: (state, action) => {
            state.email = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchNotifications.fulfilled, (state, action) => {
            state.notifications = action.payload;
        });
    },
});

const USER_URL = "/user"

export const userApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        updateUser: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/profile`,
                method: "PUT",
                body: data,
                credentials: 'include',
            }),
        }),

        getUserById: builder.query({
            query: (id) => ({
              url: `${USER_URL}/${id}`,
              method: "GET",
              credentials: "include",
            }),
          }),

        getTeamList: builder.query({
            query: () => ({
                url: `${USER_URL}/get-team`,
                method: "GET",
                credentials: 'include',
            }),
        }),

        deleteUser: builder.mutation({
            query: (id) => ({
                url: `${USER_URL}/${id}`,
                method: "DELETE",
                credentials: 'include',
            }),
        }),

        UserAction: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/${data.id}`,
                method: "PUT",
                body: data,
                credentials: 'include',
            }),
        }),

        changePassword: builder.mutation({
            query: (data) => ({
                url: `${USER_URL}/change-password`,
                method: "PUT",
                body: data,
                credentials: 'include',
            }),
        }),

    })
});


export const { useUpdateUserMutation,
    useGetTeamListQuery,
    useDeleteUserMutation,
    useUserActionMutation,
    useChangePasswordMutation,
    useGetUserByIdQuery
} = userApiSlice;

export const { setEmail } = userSlice.actions;

export default userSlice.reducer;