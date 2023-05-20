import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Mod } from './types/shared/Mod';
import { ModSearchOptions } from './types/shared/ModSearchOptions';
import { WithPagination } from './types/shared/Page';
import { RootResponse } from './types/shared/RootResponse';
import { ModId } from './types/shared/Utility';

function serverRequest(): AxiosInstance {
    return axios.create({
        baseURL: window.config.serverUrl,
        headers: {
            'RateLimit-Bypass-Token': window.config.rateLimitBypassToken,
        },
    });
}

function evaluateResponse(response: AxiosResponse): void {
    if (response.headers['ratelimit-bypass-response'] === 'Invalid') {
        console.warn('Rate limit bypass token is invalid. Please check your config.');
    }
}

export async function postRoot(): Promise<RootResponse> {
    const response = await serverRequest().post<RootResponse>('/');
    evaluateResponse(response);
    return response.data;
}

export async function getMods(searchOptions: ModSearchOptions): Promise<WithPagination<Mod>> {
    const response = await serverRequest().get('/mods', {
        params: searchOptions,
    });
    evaluateResponse(response);
    return response.data;
}

export async function getMod(id: ModId): Promise<Mod> {
    const response = await serverRequest().get(`/mods/${id}`);
    evaluateResponse(response);
    return response.data;
}
