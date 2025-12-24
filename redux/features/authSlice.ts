import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistAuthState, clearAuthState } from '@/lib/auth';

export interface User {
	role?: string;
	username?: string;
	[key: string]: any;
}

interface AuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	user: User | null;
}

interface SetAuthPayload {
	user: User;
	token: string;
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
		setAuth: (state, action: PayloadAction<SetAuthPayload>) => {
			state.isAuthenticated = true;
			state.user = action.payload.user;
			persistAuthState(action.payload.user, action.payload.token);
		},
		logout: state => {
			state.isAuthenticated = false;
			state.user = null;
			clearAuthState();
		},
		finishInitialLoad: state => {
			state.isLoading = false;
		},
	},
});

export const { setAuth, logout, finishInitialLoad } = authSlice.actions;
export default authSlice.reducer;
