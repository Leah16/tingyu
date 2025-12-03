import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

export const setAccessToken = (token: string) => {
    spotifyApi.setAccessToken(token);
};

export const getMyPlaylists = async () => {
    return spotifyApi.getUserPlaylists();
};

export const getPlaylistTracks = async (playlistId: string) => {
    return spotifyApi.getPlaylistTracks(playlistId);
};

export const play = async (options?: any) => {
    return spotifyApi.play(options);
};

export const pause = async () => {
    return spotifyApi.pause();
};

export const next = async () => {
    return spotifyApi.skipToNext();
};

export const previous = async () => {
    return spotifyApi.skipToPrevious();
};

export const getMe = async () => {
    return spotifyApi.getMe();
};

export default spotifyApi;
