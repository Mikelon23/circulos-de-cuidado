const crypto = require('node:crypto');

const DEFAULT_STATE_TTL_MS = 10 * 60 * 1000;

const DEFAULT_PROVIDERS = {
  google: {
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    userEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
  },
  github: {
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    userEndpoint: 'https://api.github.com/user',
    emailEndpoint: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
  },
};

function normalizeProvider(provider) {
  return String(provider || '')
    .trim()
    .toLowerCase();
}

function getProviderConfig(provider, configuredProviders) {
  const defaultConfig = DEFAULT_PROVIDERS[provider];
  if (!defaultConfig) {
    throw new Error('El proveedor OAuth no es válido');
  }

  return {
    ...defaultConfig,
    ...(configuredProviders[provider] || {}),
  };
}

function createOAuthService({
  userService,
  authService,
  providers = {},
  fetchImpl = globalThis.fetch,
  stateTtlMs = DEFAULT_STATE_TTL_MS,
} = {}) {
  if (!userService || !authService || typeof fetchImpl !== 'function') {
    throw new Error('La configuración OAuth está incompleta');
  }

  const pendingStates = new Map();

  function getCredentials(config) {
    const clientId = config.clientId || process.env[config.clientIdEnv];
    const clientSecret = config.clientSecret || process.env[config.clientSecretEnv];

    if (!clientId || !clientSecret) {
      throw new Error('Las credenciales OAuth no están configuradas');
    }

    return { clientId, clientSecret };
  }

  function begin(providerName, redirectUri) {
    const provider = normalizeProvider(providerName);
    const config = getProviderConfig(provider, providers);
    const { clientId } = getCredentials(config);
    const state = crypto.randomBytes(32).toString('hex');

    pendingStates.set(state, {
      provider,
      redirectUri,
      expiresAt: Date.now() + stateTtlMs,
    });

    const authorizationUrl = new URL(config.authorizationEndpoint);
    authorizationUrl.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scope,
      state,
    }).toString();

    return authorizationUrl.toString();
  }

  async function fetchJson(url, options = {}) {
    const response = await fetchImpl(url, options);
    let body;
    try {
      body = await response.json();
    } catch (_error) {
      throw new Error('La respuesta del proveedor OAuth no es válida');
    }

    if (!response.ok) {
      throw new Error(
        body.error_description || body.message || 'El proveedor OAuth rechazó la solicitud'
      );
    }

    return body;
  }

  async function exchangeCode(provider, config, code, redirectUri) {
    const { clientId, clientSecret } = getCredentials(config);
    const tokenBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const token = await fetchJson(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    });

    if (!token.access_token) {
      throw new Error(`El proveedor ${provider} no devolvió un access token`);
    }

    return token.access_token;
  }

  async function getProfile(provider, config, accessToken) {
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };
    const profile = await fetchJson(config.userEndpoint, { headers });

    if (provider === 'github' && !profile.email && config.emailEndpoint) {
      const emails = await fetchJson(config.emailEndpoint, { headers });
      const primaryEmail = emails.find((email) => email.primary && email.verified) || emails[0];
      profile.email = primaryEmail?.email;
    }

    const providerId = String(profile.sub || profile.id || '');
    const email = String(profile.email || '')
      .trim()
      .toLowerCase();
    if (!providerId || !email) {
      throw new Error('El perfil OAuth no contiene un email válido');
    }

    return {
      providerId,
      email,
      nombreReal: profile.name || profile.login || null,
      nombreVisible: profile.name || profile.login || null,
      avatarUrl: profile.picture || profile.avatar_url || null,
    };
  }

  return {
    begin,

    async complete(providerName, { code, state, redirectUri } = {}) {
      const provider = normalizeProvider(providerName);
      const pendingState = pendingStates.get(state);
      pendingStates.delete(state);

      if (
        !pendingState ||
        pendingState.provider !== provider ||
        pendingState.expiresAt <= Date.now() ||
        pendingState.redirectUri !== redirectUri
      ) {
        throw new Error('El estado OAuth no es válido o ha expirado');
      }

      if (typeof code !== 'string' || !code) {
        throw new Error('El código OAuth es obligatorio');
      }

      const config = getProviderConfig(provider, providers);
      const accessToken = await exchangeCode(provider, config, code, redirectUri);
      const profile = await getProfile(provider, config, accessToken);
      let user = userService.getUserByOAuth(provider, profile.providerId);

      if (!user) {
        if (userService.getUserByEmail(profile.email)) {
          throw new Error('El email ya está registrado con otra autenticación');
        }

        user = userService.registerUser({
          ...profile,
          email: profile.email,
          oauthProvider: provider,
          oauthId: profile.providerId,
          emailVerified: true,
        });
      }

      return {
        user,
        ...authService.issueTokens(user),
      };
    },
  };
}

module.exports = {
  createOAuthService,
};
