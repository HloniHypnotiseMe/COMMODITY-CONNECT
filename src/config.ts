export const config = {
  c6SaasCoreUrl: import.meta.env.VITE_C6_SAAS_CORE_URL || '',
};

export const isConfigured = {
  c6SaasCore: Boolean(config.c6SaasCoreUrl),
  // Compatibility name used by FIRE/Command Centre; it now means the payment boundary is configured.
  remotePay: Boolean(config.c6SaasCoreUrl),
};
