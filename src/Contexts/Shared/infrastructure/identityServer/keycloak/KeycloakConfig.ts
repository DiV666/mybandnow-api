type KeycloakConfig = {
  origin: string;
  realm: string;
  audience: string;
  // Decoded PEM public key. When set, JWT signatures are verified against this
  // pinned key instead of the dynamic JWKS lookup.
  pinnedPublicKey?: string;
};

export default KeycloakConfig;
