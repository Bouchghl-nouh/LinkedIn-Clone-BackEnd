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
}
