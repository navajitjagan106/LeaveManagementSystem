const COOKIE_PATH = "; path=/; SameSite=Strict";

export const setCookie = (name: string, value: string, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}${COOKIE_PATH}`;
};

export const getCookie = (name: string): string | null => {
    const match = document.cookie.match(
        new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
};

export const removeCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${COOKIE_PATH}`;
};
