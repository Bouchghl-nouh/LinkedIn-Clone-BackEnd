import { Injectable } from "@nestjs/common";
import crypto from "crypto";
@Injectable()
export class TokenService {
  generate(): {
    rawToken: string;
    tokenHash: string;
  } {
    const rawToken = crypto.randomBytes(64).toString("hex");
    const tokenHash = this.hash(rawToken);
    return { rawToken, tokenHash };
  }
  hash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
  generateWithExpiration(expiresIn: number): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const { rawToken, tokenHash } = this.generate();
    const expiresAt = new Date(Date.now() + expiresIn);
    return { rawToken, tokenHash, expiresAt };
  }
}
