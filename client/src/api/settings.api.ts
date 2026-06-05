import apiClient from './client';

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.put('/settings/password', { currentPassword, newPassword });
}
