import { ApiError, http, setOnAuthFailure } from '@/services/http';

const VP_ACCESS_TOKEN = 'vp_access_token';
const VP_REFRESH_TOKEN = 'vp_refresh_token';
const OLD_ACCESS_TOKEN = 'old-access-token';
const REFRESH_TOKEN = 'refresh-token';
const NEW_ACCESS_TOKEN = 'new-access-token';

function createMockResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    clone: jest.fn().mockImplementation(() => createMockResponse(status, body)),
  } as unknown as Response;
}

function setFetchMock(mock: jest.Mock) {
  global.fetch = mock as unknown as typeof fetch;
  if (typeof window !== 'undefined') {
    window.fetch = mock as unknown as typeof fetch;
  }
}

describe('http auth lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setOnAuthFailure(() => undefined);
  });

  it('single-flight: concurrent 401 responses trigger only one refresh request', async () => {
    localStorage.setItem(VP_ACCESS_TOKEN, OLD_ACCESS_TOKEN);
    localStorage.setItem(VP_REFRESH_TOKEN, REFRESH_TOKEN);

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(createMockResponse(200, { token: NEW_ACCESS_TOKEN, refresh_token: 'new-refresh-token' }))
      .mockResolvedValueOnce(createMockResponse(200, { data: { id: 1 } }))
      .mockResolvedValueOnce(createMockResponse(200, { data: { id: 2 } }));

    setFetchMock(fetchMock);

    const [first, second] = await Promise.all([http.get('/secure-a'), http.get('/secure-b')]);

    expect(first).toEqual({ id: 1 });
    expect(second).toEqual({ id: 2 });
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('retries original request once after successful refresh and returns data', async () => {
    localStorage.setItem(VP_ACCESS_TOKEN, OLD_ACCESS_TOKEN);
    localStorage.setItem(VP_REFRESH_TOKEN, REFRESH_TOKEN);

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(createMockResponse(200, { token: NEW_ACCESS_TOKEN }))
      .mockResolvedValueOnce(createMockResponse(200, { data: { ok: true } }));

    setFetchMock(fetchMock);

    const result = await http.get('/secure-resource');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryHeaders = fetchMock.mock.calls[2][1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer new-access-token');
  });

  it('failed refresh clears vp_access_token/vp_refresh_token and triggers auth-failure callback', async () => {
    localStorage.setItem(VP_ACCESS_TOKEN, 'old-access-token');
    localStorage.setItem(VP_REFRESH_TOKEN, 'refresh-token');

    const onAuthFailure = jest.fn();
    setOnAuthFailure(onAuthFailure);

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_EXPIRED' } }))
      .mockResolvedValueOnce(createMockResponse(401, { error: { code: 'AUTH_TOKEN_INVALID' } }));

    setFetchMock(fetchMock);

    await expect(http.get('/secure-resource')).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem(VP_ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(VP_REFRESH_TOKEN)).toBeNull();
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it('does not attempt refresh when login endpoint returns 401 credentials error', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createMockResponse(401, { message: 'Usuario o contraseña incorrectos' }));

    setFetchMock(fetchMock);

    await expect(http.post('/login', { username: 'bad', password: 'bad' })).rejects.toBeInstanceOf(ApiError);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/refresh'));
    expect(refreshCalls).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
