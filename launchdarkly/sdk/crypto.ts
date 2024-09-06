// This is very similar to the Akamai SDK's crypto implementation, but does not import crypto.
// The convex runtime cannot import crypto, but always includes it's own implementation.
import type { Crypto, Hasher, Hmac } from "@launchdarkly/js-server-sdk-common";
import CryptoJSHasher from "@launchdarkly/akamai-edgeworker-sdk-common/dist/platform/crypto/cryptoJSHasher";
import CryptoJSHmac from "@launchdarkly/akamai-edgeworker-sdk-common/dist/platform/crypto/cryptoJSHmac";

export type SupportedHashAlgorithm = "sha1" | "sha256";
export type SupportedOutputEncoding = "base64" | "hex";
export default class EdgeCrypto implements Crypto {
  createHash(algorithm: SupportedHashAlgorithm): Hasher {
    // @ts-expect-error CryptoJSHasher is exported as an ES Module.
    return new CryptoJSHasher.default(algorithm);
  }

  createHmac(algorithm: SupportedHashAlgorithm, key: string): Hmac {
    // @ts-expect-error CryptoJSHmac is exported as an ES Module.
    return new CryptoJSHmac.default(algorithm, key);
  }

  randomUUID(): string {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array.join();
  }
}
