export { COOKIE_NAME, ONE_YEAR_MS, PREVIEW_MODE } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Pass an optional `returnTo` path to redirect users after login (e.g. "/athlete-portal").
export const getLoginUrl = (returnTo?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // Encode both the redirectUri and the desired post-login destination into state
  const statePayload = JSON.stringify({ redirectUri, returnTo: returnTo || "/" });
  const state = btoa(statePayload);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
