import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/services/authService';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/services/authService', () => ({
  AuthService: {
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('useAuth logout', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('logout clears local auth state, removes vp_access_token/vp_refresh_token, and navigates to login', async () => {
    localStorage.setItem('vp_access_token', 'access-token');
    localStorage.setItem('vp_refresh_token', 'refresh-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'tester' }));

    mockAuthService.logout.mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockAuthService.logout).toHaveBeenCalledWith('access-token');
    expect(localStorage.getItem('vp_access_token')).toBeNull();
    expect(localStorage.getItem('vp_refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/pages/auth');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
