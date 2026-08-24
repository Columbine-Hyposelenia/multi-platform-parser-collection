import { generateUserAgent } from '../../helpers/user-agent.js';

export const tcoResolver = async (links: string[]): Promise<Record<string, string>> => {
  const [userAgent, secChUa] = generateUserAgent();
  const resolvedLinks: Record<string, string> = {};
  const startTime = performance.now();

  await Promise.all(
    links.map(async link => {
      if (link.match(/https?:\/\/t\.co\/\w+/g)) {
        try {
          const response = await fetch(link, {
            headers: {
              'User-Agent': userAgent,
              'sec-ch-ua': secChUa
            }
          });
          const html = await response.text();
          const linkMatch = html.match(/(?<=content="0;url=)https?:\/\/.*?(?=">)/i);
          if (linkMatch) {
            resolvedLinks[link] = linkMatch[0];
          }
        } catch (error) {
          console.error('Error resolving t.co link:', error);
          resolvedLinks[link] = link;
        }
      } else {
        resolvedLinks[link] = link;
      }
    })
  );
  const endTime = performance.now();

  console.log(
    `Resolved ${Object.keys(resolvedLinks).length} t.co links in ${endTime - startTime}ms`
  );
  return resolvedLinks;
};
