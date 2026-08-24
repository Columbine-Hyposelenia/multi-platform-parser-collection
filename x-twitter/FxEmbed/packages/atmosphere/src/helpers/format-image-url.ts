export const formatImageUrl = (url: string, name = 'orig') => {
  try {
    const urlObj = new URL(url);
    urlObj.pathname = urlObj.pathname.replace(/:\w+$/, '');

    if (name) {
      urlObj.searchParams.set('name', name);
    } else {
      urlObj.searchParams.delete('name');
    }
    return urlObj.toString();
  } catch (_e) {
    return url;
  }
};

export const isParamTruthy = (param: string | undefined) => {
  if (typeof param !== 'string') {
    return false;
  }
  if (param === '') {
    return true;
  }
  const value = param.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
};
