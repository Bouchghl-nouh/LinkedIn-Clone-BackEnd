import { AuthenticatedUser } from "../../auth/interfaces/authenticated_user.js";
import { Request } from "express";
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
