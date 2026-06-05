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
