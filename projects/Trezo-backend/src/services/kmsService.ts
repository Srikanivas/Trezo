import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";
import crypto from "crypto";
import { logger } from "../utils/logger";

export class KMSService {
  private static kms: KMSClient = new KMSClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  private static useLocalEncryption = false;
  private static encryptionKey: string = process.env.LOCAL_ENCRYPTION_KEY || "trezo-dev-key-2024-secure-fallback-encryption";

  private static encryptLocal(plaintext: string): string {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(this.encryptionKey, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    return Buffer.from(iv.toString("hex") + ":" + encrypted).toString("base64");
  }

  private static decryptLocal(encryptedData: string): string {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(this.encryptionKey, "salt", 32);
    const data = Buffer.from(encryptedData, "base64").toString();
    const parts = data.split(":");
    if (parts.length !== 2) throw new Error("Invalid encrypted data format");
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(parts[0], "hex"));
    let decrypted = decipher.update(parts[1], "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  static async encrypt(plaintext: string): Promise<string> {
    if (!this.useLocalEncryption) {
      try {
        const command = new EncryptCommand({
          KeyId: process.env.KMS_KEY_ID!,
          Plaintext: Buffer.from(plaintext),
        });
        const result = await this.kms.send(command);
        if (!result.CiphertextBlob) throw new Error("No ciphertext returned");
        logger.info("Successfully encrypted data using AWS KMS");
        return Buffer.from(result.CiphertextBlob).toString("base64");
      } catch (error) {
        logger.warn("AWS KMS encryption failed, falling back to local encryption:", error);
        this.useLocalEncryption = true;
      }
    }

    try {
      const encryptedData = this.encryptLocal(plaintext);
      logger.info("Successfully encrypted data using local encryption");
      return encryptedData;
    } catch (error) {
      logger.error("Local encryption error:", error);
      throw new Error("Failed to encrypt private key");
    }
  }

  static async decrypt(encryptedData: string): Promise<string> {
    if (!this.useLocalEncryption) {
      try {
        const command = new DecryptCommand({
          CiphertextBlob: Buffer.from(encryptedData, "base64"),
        });
        const result = await this.kms.send(command);
        if (!result.Plaintext) throw new Error("No plaintext returned");
        logger.info("Successfully decrypted data using AWS KMS");
        return Buffer.from(result.Plaintext).toString();
      } catch (error) {
        logger.warn("AWS KMS decryption failed, trying local decryption:", error);
      }
    }

    try {
      const decryptedData = this.decryptLocal(encryptedData);
      logger.info("Successfully decrypted data using local encryption");
      return decryptedData;
    } catch (error) {
      logger.error("Local decryption error:", error);
      throw new Error("Failed to decrypt private key");
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const testData = "test-encryption";
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted);
      if (decrypted === testData) {
        logger.info("Encryption service test successful");
        return true;
      }
      logger.error("Encryption service test failed - data mismatch");
      return false;
    } catch (error) {
      logger.error("Encryption service test failed:", error);
      return false;
    }
  }
}
