/** Promise helper with timeout and simple retry on AbortError (default fetch use). */
export async function withTimeout<T>(
  asyncTask: (signal: AbortSignal) => Promise<T>,
  timeout: number = 3500,
  retries: number = 3
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const result = await asyncTask(controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      if (retries > 0) {
        return withTimeout(asyncTask, timeout, retries - 1);
      }
      throw new Error('Request has timed out too many times', { cause: error });
    } else {
      throw error as Error;
    }
  }
}
