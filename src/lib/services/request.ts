export async function httpRequest<T>(url: string, method: 'GET' | 'POST', headers?: any): Promise<T> {
    const res = await fetch(url, {
        method,
        headers
    });
    if (!res.ok) {
        if (res.status === 401) {
            throw new Error("Unauthorized")
        }
        if (res.status === 403) {
            throw new Error("Forbidden")
        }
        if (res.status === 404) {
            throw new Error("Not Found")
        }

        try {
            const err = await res.json();
            throw new Error(err);
        }
        catch(e) {
            throw new Error("Unknown Error");
        }
    }

    return await res.json();
}