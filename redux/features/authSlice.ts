import { createSlice } from '@reduxjs/toolkit';

interface User {
	role?: string;
	username?: string;
	[key: string]: any;
}

interface AuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	user: User | null;
}

const initialState = {
	isAuthenticated: false,
	isLoading: true,
	user: null,
} as AuthState;

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setAuth: (state, action) => {
			state.isAuthenticated = true;
			state.user = action.payload;
		},
		logout: state => {
			state.isAuthenticated = false;
			state.user = null;
			localStorage.removeItem('token');
			localStorage.removeItem('user');
		},
		finishInitialLoad: state => {
			state.isLoading = false;
		},
	},
});

export const { setAuth, logout, finishInitialLoad } = authSlice.actions;
export default authSlice.reducer;
