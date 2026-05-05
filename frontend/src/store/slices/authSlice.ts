import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMe } from "../../api/authApi";
import { User } from "../../types/user";

interface AuthState {
    user: User | null;
    loading: boolean;
    initialized: boolean;
}

const initialState: AuthState = {
    user: null,
    loading: true,
    initialized: false,
};

export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
    const response = await getMe();
    return response.data.data;
});

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.initialized = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.user = action.payload;
                state.loading = false;
                state.initialized = true;
            })
            .addCase(fetchMe.rejected, (state) => {
                state.user = null;
                state.loading = false;
                state.initialized = true;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
