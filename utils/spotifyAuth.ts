import Cookies from 'js-cookie';

const SPOTIFY_ACCESS_TOKEN = 'spotify_access_token';
const SPOTIFY_REFRESH_TOKEN = 'spotify_refresh_token';
const SPOTIFY_EXPIRES_IN = 'spotify_expires_in';
const SPOTIFY_TIMESTAMP = 'spotify_timestamp';

const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-playback-state',
    'user-modify-playback-state',
];

export const getLoginUrl = (clientId: string, redirectUri: string) => {
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: SCOPES.join(' '),
        show_dialog: 'true',
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getToken = async (code: string, clientId: string, clientSecret: string, redirectUri: string) => {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Failed to get token');
    }

    const data = await response.json();
    setSession(data);
    return data;
};

export const refreshAccessToken = async (refreshToken: string, clientId: string, clientSecret: string) => {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    setSession(data);
    return data;
};

const setSession = (data: any) => {
    const { access_token, refresh_token, expires_in } = data;
    const timestamp = Date.now();

    Cookies.set(SPOTIFY_ACCESS_TOKEN, access_token);
    if (refresh_token) {
        Cookies.set(SPOTIFY_REFRESH_TOKEN, refresh_token);
    }
    Cookies.set(SPOTIFY_EXPIRES_IN, expires_in);
    Cookies.set(SPOTIFY_TIMESTAMP, timestamp.toString());
};

export const getAccessToken = () => Cookies.get(SPOTIFY_ACCESS_TOKEN);
export const getRefreshToken = () => Cookies.get(SPOTIFY_REFRESH_TOKEN);

export const hasTokenExpired = () => {
    const accessToken = Cookies.get(SPOTIFY_ACCESS_TOKEN);
    const timestamp = Cookies.get(SPOTIFY_TIMESTAMP);
    const expiresIn = Cookies.get(SPOTIFY_EXPIRES_IN);

    if (!accessToken || !timestamp || !expiresIn) {
        return true;
    }

    const timePassed = Date.now() - Number(timestamp);
    return timePassed / 1000 > Number(expiresIn);
};

export const logout = () => {
    Cookies.remove(SPOTIFY_ACCESS_TOKEN);
    Cookies.remove(SPOTIFY_REFRESH_TOKEN);
    Cookies.remove(SPOTIFY_EXPIRES_IN);
    Cookies.remove(SPOTIFY_TIMESTAMP);
};
