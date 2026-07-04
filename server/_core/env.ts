export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  // Unescape unicode angle brackets that the platform secret storage may inject
  // e.g. "Name\u003cemail@domain.com\u003e" → "Name <email@domain.com>"
  resendFromEmail: (process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev")
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">"),
  resendReplyTo: process.env.RESEND_REPLY_TO ?? "",
  appUrl: process.env.VITE_APP_URL ?? process.env.APP_URL ?? "https://coachsteve.manus.space",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  embedAllowedOrigins: process.env.EMBED_ALLOWED_ORIGINS ?? "",
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? "",
};
