import api from './api';

export interface MyProfile {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
}

export async function getMyProfile(): Promise<MyProfile> {
  const { data } = await api.get<MyProfile>('/auth/users/me');
  return data;
}

export async function updateMyProfile(payload: { fullName?: string; email?: string }): Promise<MyProfile> {
  const { data } = await api.put<MyProfile>('/auth/users/me', payload);
  return data;
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.put('/auth/users/me/password', { currentPassword, newPassword });
}
