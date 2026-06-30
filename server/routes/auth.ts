import express, { Response } from "express";
import bcrypt from "bcryptjs";
import { Users } from "../db/collections";
import { generateToken, protect, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new citizen or authority
// @access  Public
router.post("/register", async (req: express.Request, res: Response): Promise<void> => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: "Please provide username, email, and password" });
    return;
  }

  try {
    // Check if user exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    // Determine role - default to 'citizen'. Prevent unauthorized setting of 'admin'
    let finalRole: "citizen" | "authority" | "admin" = "citizen";
    if (role === "authority") {
      finalRole = "authority";
    } else if (role === "admin") {
      finalRole = "admin";
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Random natural avatar color from the palette
    const avatarColors = ["#5A5A40", "#BC6C25", "#A3AD91", "#7A7A7A", "#8F8F75"];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    // Create user
    const newUser = await Users.create({
      username,
      email,
      passwordHash,
      role: finalRole,
      avatarColor
    });

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        avatarColor: newUser.avatarColor,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal Server Error during registration" });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req: express.Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Please provide email and password" });
    return;
  }

  try {
    const user = await Users.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error during login" });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(404).json({ message: "User profile not found" });
    return;
  }
  res.json({ user: req.user });
});

export default router;
