import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Users, IUser } from "../db/collections";

const JWT_SECRET = process.env.JWT_SECRET || "community_hero_super_secret_fallback_key_2026";

export interface AuthenticatedRequest extends Request {
  user?: Omit<IUser, "passwordHash">;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function protect(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await Users.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: "Not authorized, user not found" });
      return;
    }

    // Exclude password from the attached user object
    const { passwordHash, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
}

export function authorizeRoles(...roles: ("citizen" | "authority" | "admin")[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden: Role '${req.user?.role || "unknown"}' is not authorized`
      });
      return;
    }
    next();
  };
}
