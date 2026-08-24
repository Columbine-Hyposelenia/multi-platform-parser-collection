const fmt = (s: string, vars: Record<string, string>) => {
  let out = s;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
};

const fakeChromeVersion = 145;
const platformWindows = 'Windows NT 10.0; Win64; x64';
const platformMac = 'Macintosh; Intel Mac OS X 10_15_7';
const platformLinux = 'X11; Linux x86_64';
const platformAndroid = 'Linux; Android 10; K';
const chromeUA = `Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version}.0.0.0 Safari/537.36`;
const edgeUA = `Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version}.0.0.0 Safari/537.36 Edg/{version}.0.0.0`;
const chromeMobileUA = `Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version}.0.0.0 Mobile Safari/537.36`;
const edgeMobileUA = `Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{version}.0.0.0 Mobile Safari/537.36 Edg/{version}.0.0.0`;

enum Platforms {
  Windows,
  Mac,
  Linux,
  Android
}

const getRandomVersion = (): number => fakeChromeVersion - Math.floor(Math.random() * 3);

export const generateUserAgent = (): [string, string] => {
  const platform = Math.floor(Math.random() * 4);
  const isEdge = Math.random() > 0.5;
  const version = getRandomVersion();
  const v = String(version);

  let userAgent = isEdge ? edgeUA : chromeUA;
  userAgent = fmt(userAgent, { version: v });
  const secChUaChrome = `".Not/A)Brand";v="99", "Google Chrome";v="{version}", "Chromium";v="{version}"`;
  const secChUaEdge = `".Not/A)Brand";v="99", "Microsoft Edge";v="{version}", "Chromium";v="{version}"`;
  const secChUa = fmt(isEdge ? secChUaEdge : secChUaChrome, { version: v });

  switch (platform) {
    case Platforms.Mac:
      return [fmt(userAgent, { platform: platformMac }), secChUa];
    case Platforms.Linux:
      return [fmt(userAgent, { platform: platformLinux }), secChUa];
    case Platforms.Android: {
      userAgent = isEdge ? edgeMobileUA : chromeMobileUA;
      return [fmt(userAgent, { platform: platformAndroid, version: v }), secChUa];
    }
    default:
      return [fmt(userAgent, { platform: platformWindows }), secChUa];
  }
};
