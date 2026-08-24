type DetokenizeLogger = {
  debug?: (msg: string) => void;
  error?: (msg: string, err: unknown) => void;
};

const defaultLog: DetokenizeLogger = {
  debug: msg => console.log(msg),
  error: (msg, e) => console.error(msg, e)
};

export const detokenize = (text: string, log: DetokenizeLogger = defaultLog): unknown => {
  log.debug?.('Detokenizing LLM response ' + text);
  const lines = text.split('\n').filter(line => line.includes('{') && line.includes('}'));
  const base = JSON.parse(lines[0] as string) as { result: { text: string } };
  lines.forEach((line, index) => {
    if (index === 0) {
      return;
    }
    try {
      const json = JSON.parse(line) as { result: { text: string } };
      base.result.text += json.result.text;
    } catch (e) {
      log.error?.('Failed to detokenize chunk', e);
    }
  });

  return base;
};
