const getURL = () => import.meta.env.VITE_API_URL;

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok)
        throw { status: response.status, ...data };
    return data;
};

const refreshAccessToken = async (): Promise<void> => {
    const response = await fetch(`${getURL()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    if (!response.ok) throw new Error('Refresh failed');
};

export const fetchWithRefresh = async (url: string, options: RequestInit = {}): Promise<any> => {
    const defaultOptions: RequestInit = {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    };

    let response = await fetch(url, defaultOptions);

    if (response.status === 401) {
        try {
            await refreshAccessToken();
            response = await fetch(url, defaultOptions);
        } catch {
            window.location.href = '/login';
            throw new Error('Session expired');
        }
    }

    return handleResponse(response);
};

export const authService = {
    refresh: async () => {
        const response = await fetch(`${getURL()}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return handleResponse(response);
    },

    me: async () => {
        const response = await fetch(`${getURL()}/auth/me`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return handleResponse(response);
    },

    logout: async () => {
        const response = await fetch(`${getURL()}/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return response.json().catch(() => ({}));
    },
};