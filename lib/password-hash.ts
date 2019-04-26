/**
 * 借鉴 node-password-hash link: https://github.com/davidwood/node-password-hash
 * 实现原理与werkzeug的原理基本一样
 */
import crypto from "crypto";

let saltChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let saltCharsCount = saltChars.length;

function generateSalt(len: number) {
  if (crypto.randomBytes) {
    return crypto
      .randomBytes(Math.ceil(len / 2))
      .toString("hex")
      .substring(0, len);
  } else {
    let salt = "";
    for (let i = 0; i < len; i++) {
      salt += saltChars.charAt(Math.floor(Math.random() * saltCharsCount));
    }
    return salt;
  }
}

function generateHash(
  algorithm: string,
  salt: string,
  password: string,
  iterations: number
) {
  iterations = iterations || 1;
  try {
    let hash = password;
    for (let i = 0; i < iterations; ++i) {
      hash = crypto
        .createHmac(algorithm, salt)
        .update(hash)
        .digest("hex");
    }
    return algorithm + "$" + salt + "$" + iterations + "$" + hash;
  } catch (e) {
    throw new Error("Invalid message digest algorithm");
  }
}

export interface Option {
  algorithm?: string;
  saltLength?: number;
  iterations?: number;
}

/**
 * 生成密文密码
 * @param password 密码
 * @param options 参数
 */
export const generate = function(password: string, options?: Option) {
  options || (options = {});
  options.algorithm || (options.algorithm = "sha1");
  options.saltLength || options.saltLength === 0 || (options.saltLength = 8);
  options.iterations || (options.iterations = 1);
  let salt = generateSalt(options.saltLength);
  return generateHash(options.algorithm, salt, password, options.iterations);
};

/**
 * 校验密码
 * @param password 原始密码
 * @param hashedPassword 密文密码
 */
export const verify = function(password: string, hashedPassword: string) {
  if (!password || !hashedPassword) return false;
  let parts = hashedPassword.split("$");
  if (parts.length !== 4) return false;
  try {
    const iter = parseInt(parts[2], 10);
    return generateHash(parts[0], parts[1], password, iter) === hashedPassword;
  } catch (e) {
    return false;
  }
};

/**
 * 判断当前密码是否为密文
 * @param password 密码
 */
export const isHashed = function(password: string) {
  if (!password) return false;
  return password.split("$").length === 4;
};
