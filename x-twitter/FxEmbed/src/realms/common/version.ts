import { Context } from 'hono';
import { Constants } from '../../constants';
import { sanitizeText } from '../../helpers/utils';
import { Strings } from '../../strings';
import { getBranding } from '../../helpers/branding';
import { formatRuntime } from '../../helpers/runtime';

export const versionRoute = async (c: Context) => {
  c.header('cache-control', 'max-age=0, no-cache, no-store, must-revalidate');
  const req = c.req;
  const cf = req.raw.cf;
  const brandingName = getBranding(c).name;
  const runtime = formatRuntime();

  if (!cf) {
    return c.html(
      Strings.VERSION_HTML.format({
        brandingName,
        ogDescription: `Build${Constants.RELEASE_NAME} (${runtime})`,
        statsBody: '',
        runtime
      })
    );
  }

  const nerdFields = {
    runtime,
    rtt: cf.clientTcpRtt ? `🏓 ${cf.clientTcpRtt} ms RTT` : '',
    colo: (cf.colo as string) ?? '??',
    httpversion: (cf.httpProtocol as string) ?? 'Unknown HTTP Version',
    tlsversion: (cf.tlsVersion as string) ?? 'Unknown TLS Version',
    ip: req.header('x-real-ip') ?? req.header('cf-connecting-ip') ?? 'Unknown IP',
    city: (cf.city as string) ?? 'Unknown City',
    region: (cf.region as string) ?? cf.country ?? 'Unknown Region',
    country: (cf.country as string) ?? 'Unknown Country',
    asn: `AS${cf.asn ?? '??'} (${cf.asOrganization ?? 'Unknown ASN'})`,
    ua: sanitizeText(req.header('user-agent') ?? 'Unknown User Agent')
  };

  return c.html(
    Strings.VERSION_HTML.format({
      brandingName,
      ogDescription: Strings.VERSION_OG_DESCRIPTION_NERDS.format(nerdFields),
      statsBody: Strings.VERSION_STATS_BODY.format(nerdFields),
      runtime
    })
  );
};
