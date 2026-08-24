import type { AtmosphereTransport } from './atmosphere-transport.js';
import type { AtmosphereSocialProvider } from '../types/social-provider.js';
import { AuthNotImplementedError } from './errors.js';

/** Call at the start of a provider operation if you do not support `authenticated` yet. */
export function rejectAuthenticatedTransport<P extends AtmosphereSocialProvider>(
  transport: AtmosphereTransport<P>
): void {
  if (transport.kind === 'authenticated') {
    throw new AuthNotImplementedError();
  }
}
