import type { Crypto, Hasher, Hmac } from "@launchdarkly/js-server-sdk-common";
import { algo as CryptoAlgo } from "crypto-js";
import CryptoJS from "crypto-js";
import Base64 from "crypto-js/enc-base64";
import Hex from "crypto-js/enc-hex";

type SupportedHashAlgorithm = "sha1" | "sha256";
type SupportedOutputEncoding = "base64" | "hex";

// This is very similar to the Akamai SDK's crypto implementation, but does not import crypto.
// The convex runtime cannot import crypto, but always includes it's own implementation.
export default class ConvexCrypto implements Crypto {
  createHash(algorithm: SupportedHashAlgorithm): Hasher {
    return new CryptoJSHasher(algorithm);
  }

  createHmac(algorithm: SupportedHashAlgorithm, key: string): Hmac {
    return new CryptoJSHmac(algorithm, key);
  }

  randomUUID(): string {
    return crypto.randomUUID();
  }
}

class CryptoJSHmac implements Hmac {
  private CryptoJSHmac;

  constructor(algorithm: SupportedHashAlgorithm, key: string) {
    let algo;

    switch (algorithm) {
      case "sha1":
        algo = CryptoJS.algo.SHA1;
        break;
      case "sha256":
        algo = CryptoJS.algo.SHA256;
        break;
      default:
        throw new Error(
          "unsupported hash algorithm. Only sha1 and sha256 are supported."
        );
    }

    this.CryptoJSHmac = CryptoJS.algo.HMAC.create(algo, key);
  }

  digest(encoding: SupportedOutputEncoding): string {
    const result = this.CryptoJSHmac.finalize();

    if (encoding === "base64") {
      return result.toString(CryptoJS.enc.Base64);
    }

    if (encoding === "hex") {
      return result.toString(CryptoJS.enc.Hex);
    }

    throw new Error(
      "unsupported output encoding. Only base64 and hex are supported."
    );
  }

  update(data: string): this {
    this.CryptoJSHmac.update(data);
    return this;
  }
}

class CryptoJSHasher implements Hasher {
  private cryptoJSHasher;

  constructor(algorithm: SupportedHashAlgorithm) {
    let algo;

    switch (algorithm) {
      case "sha1":
        algo = CryptoAlgo.SHA1;
        break;
      case "sha256":
        algo = CryptoAlgo.SHA256;
        break;
      default:
        throw new Error(
          "unsupported hash algorithm. Only sha1 and sha256 are supported."
        );
    }

    this.cryptoJSHasher = algo.create();
  }

  digest(encoding: SupportedOutputEncoding): string {
    const result = this.cryptoJSHasher.finalize();

    let enc;
    switch (encoding) {
      case "base64":
        enc = Base64;
        break;
      case "hex":
        enc = Hex;
        break;
      default:
        throw new Error(
          "unsupported output encoding. Only base64 and hex are supported."
        );
    }

    return result.toString(enc);
  }

  update(data: string): this {
    this.cryptoJSHasher.update(data);
    return this;
  }
}
