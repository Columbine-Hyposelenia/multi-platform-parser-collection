/**
 * Subdomain / query flags for FxTwitter status and profile routes (see worker embed routes).
 */
export type InputFlags = {
  standard?: boolean;
  direct?: boolean;
  api?: boolean;
  textOnly?: boolean;
  isXDomain?: boolean;
  forceInstantView?: boolean;
  instantViewUnrollThreads?: boolean;
  archive?: boolean;
  gallery?: boolean;
  forceMosaic?: boolean;
  name?: string;
  noActivity?: boolean;
  horizon?: boolean;
};
