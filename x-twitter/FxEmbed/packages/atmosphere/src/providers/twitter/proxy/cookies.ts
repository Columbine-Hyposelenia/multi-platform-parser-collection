function parseCookies(cookieHeader: string): Record<string, string> {
  const cookieList = cookieHeader.split(';');
  return cookieList.reduce(
    (map, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name) {
        map[name] = value;
      }
      return map;
    },
    {} as Record<string, string>
  );
}

export function mergeCookies(existingCookies?: string, newCookie?: string): string {
  if (!existingCookies) {
    return newCookie ?? '';
  }

  if (!newCookie) {
    return existingCookies;
  }

  const existingCookieMap = parseCookies(existingCookies);
  const newCookieMap = parseCookies(newCookie);
  const mergedCookieMap = { ...existingCookieMap, ...newCookieMap };
  const mergedCookieList = Object.entries(mergedCookieMap).map(
    ([name, value]) => `${name}=${value}`
  );
  return mergedCookieList.join('; ');
}
