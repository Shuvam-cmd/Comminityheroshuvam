import express, { Response } from "express";
import multer from "multer";
import { Issues, IIssue, IComment, ITimelineEvent } from "../db/collections";
import { protect, authorizeRoles, AuthenticatedRequest } from "../middleware/auth";
import { analyzeReport } from "../services/ai";

const router = express.Router();

// Multer memory storage configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed!"));
    }
  }
});

// @route   GET /api/issues
// @desc    Get all community issues
// @access  Public
router.get("/", async (req: express.Request, res: Response) => {
  try {
    const issues = await Issues.find();
    res.json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ message: "Internal server error fetching issues" });
  }
});

// @route   GET /api/issues/:id
// @desc    Get details of a single issue
// @access  Public
router.get("/:id", async (req: express.Request, res: Response): Promise<void> => {
  try {
    const issue = await Issues.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }
    res.json(issue);
  } catch (error) {
    console.error("Error fetching issue details:", error);
    res.status(500).json({ message: "Internal server error fetching issue" });
  }
});

// @route   POST /api/issues
// @desc    Report a new issue (with image upload & Gemini analysis)
// @access  Private
router.post(
  "/",
  protect,
  upload.single("image"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { description, latitude, longitude } = req.body;
      const reporter = req.user!;

      const parsedLat = parseFloat(latitude || "37.7749"); // Default to SF coordinates for visual demo if not provided
      const parsedLng = parseFloat(longitude || "-122.4194");

      let imageUrl: string | undefined;
      let aiResult;

      if (req.file) {
        // If an image file is uploaded, convert it to a base64 string for direct storage
        const base64Data = req.file.buffer.toString("base64");
        imageUrl = `data:${req.file.mimetype};base64,${base64Data}`;

        // Analyze image and text via Gemini
        aiResult = await analyzeReport(
          description || "",
          req.file.buffer,
          req.file.mimetype,
          { latitude: parsedLat, longitude: parsedLng }
        );
      } else {
        // Analyze text only
        aiResult = await analyzeReport(
          description || "",
          undefined,
          undefined,
          { latitude: parsedLat, longitude: parsedLng }
        );
      }

      // Create new issue with Gemini/Heuristic AI-generated insights
      const newIssue = await Issues.create({
        title: aiResult.title,
        description: aiResult.description,
        category: aiResult.category,
        priority: aiResult.priority,
        department: aiResult.department,
        imageUrl,
        latitude: parsedLat,
        longitude: parsedLng,
        reporterId: reporter.id,
        reporterName: reporter.username,
        status: "Pending"
      });

      res.status(201).json({
        issue: newIssue,
        aiAnalysis: {
          isDuplicate: aiResult.isDuplicate,
          duplicateOfId: aiResult.duplicateOfId
        }
      });
    } catch (error: any) {
      console.error("Error reporting issue:", error);
      res.status(500).json({ message: error.message || "Failed to create issue report" });
    }
  }
);

// @route   POST /api/issues/:id/vote
// @desc    Upvote/remove upvote from an issue
// @access  Private
router.post("/:id/vote", protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const issue = await Issues.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    const userId = req.user!.id;
    let upvoters = issue.upvoters || [];
    let upvotes = issue.upvotes || 0;

    if (upvoters.includes(userId)) {
      // Remove upvote
      upvoters = upvoters.filter((id) => id !== userId);
      upvotes = Math.max(0, upvotes - 1);
    } else {
      // Add upvote
      upvoters.push(userId);
      upvotes += 1;
    }

    const updatedIssue = await Issues.update(req.params.id, { upvoters, upvotes });
    res.json(updatedIssue);
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ message: "Error toggling vote status" });
  }
});

// @route   POST /api/issues/:id/verify
// @desc    Mark issue as verified (Authority / Admin only)
// @access  Private
router.post(
  "/:id/verify",
  protect,
  authorizeRoles("authority", "admin"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const issue = await Issues.findById(req.params.id);
      if (!issue) {
        res.status(404).json({ message: "Issue not found" });
        return;
      }

      const verifierId = req.user!.id;
      let verifiedBy = issue.verifiedBy || [];

      if (!verifiedBy.includes(verifierId)) {
        verifiedBy.push(verifierId);
      } else {
        // Already verified, so un-verify
        verifiedBy = verifiedBy.filter((id) => id !== verifierId);
      }

      const updatedIssue = await Issues.update(req.params.id, { verifiedBy });
      res.json(updatedIssue);
    } catch (error) {
      console.error("Error verifying:", error);
      res.status(500).json({ message: "Error changing verification status" });
    }
  }
);

// @route   POST /api/issues/:id/comment
// @desc    Add comment to issue
// @access  Private
router.post("/:id/comment", protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ message: "Comment text cannot be empty" });
    return;
  }

  try {
    const issue = await Issues.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    const newComment: IComment = {
      id: Math.random().toString(36).substring(2, 11),
      issueId: req.params.id,
      userId: req.user!.id,
      username: req.user!.username,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    const comments = [...(issue.comments || []), newComment];
    const updatedIssue = await Issues.update(req.params.id, { comments });
    res.json(updatedIssue);
  } catch (error) {
    console.error("Error commenting:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
});

// @route   PATCH /api/issues/:id/status
// @desc    Change status of issue (Authority / Admin only)
// @access  Private
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("authority", "admin"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { status, notes } = req.body;

    if (!status || !["Pending", "In Progress", "Resolved"].includes(status)) {
      res.status(400).json({ message: "Invalid status provided" });
      return;
    }

    try {
      const issue = await Issues.findById(req.params.id);
      if (!issue) {
        res.status(404).json({ message: "Issue not found" });
        return;
      }

      const timelineEvent: ITimelineEvent = {
        status,
        notes: notes || `Status updated to ${status}.`,
        updatedBy: req.user!.username,
        timestamp: new Date().toISOString()
      };

      const timeline = [...(issue.timeline || []), timelineEvent];
      const updatedIssue = await Issues.update(req.params.id, { status, timeline });

      res.json(updatedIssue);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Error updating issue status" });
    }
  }
);

// @route   DELETE /api/issues/:id
// @desc    Delete/Remove fake report (Admin only)
// @access  Private
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const success = await Issues.delete(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Issue not found" });
        return;
      }
      res.json({ message: "Report successfully removed" });
    } catch (error) {
      console.error("Error deleting issue:", error);
      res.status(500).json({ message: "Error deleting report" });
    }
  }
);

export default router;
