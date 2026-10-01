export const config = {
  c6SaasCoreUrl: import.meta.env.VITE_C6_SAAS_CORE_URL || '',
  // PocketBase remains available only for migration/dev compatibility.
  pocketBaseUrl: import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090',
};

export const isConfigured = {
  c6SaasCore: Boolean(config.c6SaasCoreUrl),
  pocketBase: Boolean(import.meta.env.VITE_POCKETBASE_URL),
  // Compatibility name used by FIRE/Command Centre; it now means the payment boundary is configured.
  remotePay: Boolean(config.c6SaasCoreUrl),
};
