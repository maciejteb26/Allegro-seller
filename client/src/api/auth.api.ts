import apiClient from './client';
import { User } from '../types';

export async function register(data: { email: string; password: string; name: string }) {
  await apiClient.post('/auth/register', data);
}

export async function login(data: { email: string; password: string }) {
  await apiClient.post('/auth/login', data);
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, password });
}
