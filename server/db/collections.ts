import mongoose, { Schema, Document } from "mongoose";
import { isMongoDB } from "../config/db";
import { JsonCollection } from "../utils/jsonDb";

// TYPES & INTERFACES

export interface IUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "citizen" | "authority" | "admin";
  avatarColor?: string;
  createdAt: string;
}

export interface IComment {
  id: string;
  issueId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface ITimelineEvent {
  status: "Pending" | "In Progress" | "Resolved";
  notes?: string;
  updatedBy: string;
  timestamp: string;
}

export interface IIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  department: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  status: "Pending" | "In Progress" | "Resolved";
  upvotes: number;
  upvoters: string[]; // List of user IDs
  verifiedBy: string[]; // List of authority/admin IDs
  reporterId: string;
  reporterName: string;
  comments: IComment[];
  timeline: ITimelineEvent[];
  createdAt: string;
}

// ==========================================
// MONGODB SCHEMAS & MODELS (for when Atlas is connected)
// ==========================================

const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["citizen", "authority", "admin"], default: "citizen" },
  avatarColor: { type: String, default: "#5A5A40" },
  createdAt: { type: Date, default: Date.now }
});

const TimelineEventSchema = new Schema({
  status: { type: String, enum: ["Pending", "In Progress", "Resolved"], required: true },
  notes: String,
  updatedBy: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const CommentSchema = new Schema({
  issueId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const IssueSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
  department: { type: String, required: true },
  imageUrl: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "In Progress", "Resolved"], default: "Pending" },
  upvotes: { type: Number, default: 0 },
  upvoters: { type: [String], default: [] },
  verifiedBy: { type: [String], default: [] },
  reporterId: { type: String, required: true },
  reporterName: { type: String, required: true },
  comments: [CommentSchema],
  timeline: [TimelineEventSchema],
  createdAt: { type: Date, default: Date.now }
});

let MongoUser: any;
let MongoIssue: any;

try {
  MongoUser = mongoose.models.User || mongoose.model("User", UserSchema);
  MongoIssue = mongoose.models.Issue || mongoose.model("Issue", IssueSchema);
} catch (e) {
  // Safe handling for double compilations
}

// ==========================================
// REIFIED UNIFIED COLLECTIONS API
// ==========================================

const jsonUserDb = new JsonCollection<IUser>("users");
const jsonIssueDb = new JsonCollection<IIssue>("issues");

export const Users = {
  async findOne(filter: Partial<IUser> | ((item: IUser) => boolean)): Promise<IUser | null> {
    if (isMongoDB) {
      try {
        const query: any = {};
        if (typeof filter === "object") {
          if (filter.email) query.email = filter.email;
          if (filter.id) query._id = filter.id;
          if (filter.username) query.username = filter.username;
        }
        const user = await MongoUser.findOne(query);
        if (!user) return null;
        return {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          avatarColor: user.avatarColor,
          createdAt: user.createdAt.toISOString()
        };
      } catch (e) {
        console.error("MongoDB findOne user error, falling back", e);
      }
    }
    return jsonUserDb.findOne(filter);
  },

  async findById(id: string): Promise<IUser | null> {
    if (isMongoDB) {
      try {
        const user = await MongoUser.findById(id);
        if (!user) return null;
        return {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          avatarColor: user.avatarColor,
          createdAt: user.createdAt.toISOString()
        };
      } catch (e) {
        console.error("MongoDB findById user error, falling back", e);
      }
    }
    return jsonUserDb.findById(id);
  },

  async create(user: Omit<IUser, "id" | "createdAt">): Promise<IUser> {
    if (isMongoDB) {
      try {
        const newMongoUser = new MongoUser({
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          avatarColor: user.avatarColor || "#5A5A40"
        });
        const saved = await newMongoUser.save();
        return {
          id: saved._id.toString(),
          username: saved.username,
          email: saved.email,
          passwordHash: saved.passwordHash,
          role: saved.role,
          avatarColor: saved.avatarColor,
          createdAt: saved.createdAt.toISOString()
        };
      } catch (e) {
        console.error("MongoDB create user error, falling back", e);
      }
    }
    return jsonUserDb.create(user);
  }
};

export const Issues = {
  async find(filter?: any): Promise<IIssue[]> {
    if (isMongoDB) {
      try {
        const query: any = {};
        if (filter && typeof filter === "object") {
          if (filter.status) query.status = filter.status;
          if (filter.category) query.category = filter.category;
          if (filter.reporterId) query.reporterId = filter.reporterId;
        }
        const issues = await MongoIssue.find(query).sort({ createdAt: -1 });
        return issues.map((doc: any) => ({
          id: doc._id.toString(),
          title: doc.title,
          description: doc.description,
          category: doc.category,
          priority: doc.priority,
          department: doc.department,
          imageUrl: doc.imageUrl,
          latitude: doc.latitude,
          longitude: doc.longitude,
          status: doc.status,
          upvotes: doc.upvotes,
          upvoters: doc.upvoters || [],
          verifiedBy: doc.verifiedBy || [],
          reporterId: doc.reporterId,
          reporterName: doc.reporterName,
          comments: (doc.comments || []).map((c: any) => ({
            id: c._id ? c._id.toString() : c.id,
            issueId: c.issueId,
            userId: c.userId,
            username: c.username,
            text: c.text,
            createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString()
          })),
          timeline: (doc.timeline || []).map((t: any) => ({
            status: t.status,
            notes: t.notes,
            updatedBy: t.updatedBy,
            timestamp: t.timestamp ? t.timestamp.toISOString() : new Date().toISOString()
          })),
          createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
        }));
      } catch (e) {
        console.error("MongoDB find issues error, falling back", e);
      }
    }
    return jsonIssueDb.find(filter);
  },

  async findById(id: string): Promise<IIssue | null> {
    if (isMongoDB) {
      try {
        const doc = await MongoIssue.findById(id);
        if (!doc) return null;
        return {
          id: doc._id.toString(),
          title: doc.title,
          description: doc.description,
          category: doc.category,
          priority: doc.priority,
          department: doc.department,
          imageUrl: doc.imageUrl,
          latitude: doc.latitude,
          longitude: doc.longitude,
          status: doc.status,
          upvotes: doc.upvotes,
          upvoters: doc.upvoters || [],
          verifiedBy: doc.verifiedBy || [],
          reporterId: doc.reporterId,
          reporterName: doc.reporterName,
          comments: (doc.comments || []).map((c: any) => ({
            id: c._id ? c._id.toString() : c.id,
            issueId: c.issueId,
            userId: c.userId,
            username: c.username,
            text: c.text,
            createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString()
          })),
          timeline: (doc.timeline || []).map((t: any) => ({
            status: t.status,
            notes: t.notes,
            updatedBy: t.updatedBy,
            timestamp: t.timestamp ? t.timestamp.toISOString() : new Date().toISOString()
          })),
          createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
        };
      } catch (e) {
        console.error("MongoDB findById issue error, falling back", e);
      }
    }
    return jsonIssueDb.findById(id);
  },

  async create(issue: Omit<IIssue, "id" | "createdAt" | "upvotes" | "upvoters" | "verifiedBy" | "comments" | "timeline">): Promise<IIssue> {
    const initialTimeline: ITimelineEvent[] = [
      {
        status: "Pending",
        notes: "Issue reported to Community Hero platform.",
        updatedBy: issue.reporterName,
        timestamp: new Date().toISOString()
      }
    ];

    if (isMongoDB) {
      try {
        const newMongoIssue = new MongoIssue({
          title: issue.title,
          description: issue.description,
          category: issue.category,
          priority: issue.priority,
          department: issue.department,
          imageUrl: issue.imageUrl,
          latitude: issue.latitude,
          longitude: issue.longitude,
          status: "Pending",
          upvotes: 0,
          upvoters: [],
          verifiedBy: [],
          reporterId: issue.reporterId,
          reporterName: issue.reporterName,
          comments: [],
          timeline: initialTimeline
        });
        const saved = await newMongoIssue.save();
        return {
          id: saved._id.toString(),
          title: saved.title,
          description: saved.description,
          category: saved.category,
          priority: saved.priority,
          department: saved.department,
          imageUrl: saved.imageUrl,
          latitude: saved.latitude,
          longitude: saved.longitude,
          status: saved.status,
          upvotes: saved.upvotes,
          upvoters: saved.upvoters,
          verifiedBy: saved.verifiedBy,
          reporterId: saved.reporterId,
          reporterName: saved.reporterName,
          comments: [],
          timeline: saved.timeline.map((t: any) => ({
            status: t.status,
            notes: t.notes,
            updatedBy: t.updatedBy,
            timestamp: t.timestamp ? t.timestamp.toISOString() : new Date().toISOString()
          })),
          createdAt: saved.createdAt.toISOString()
        };
      } catch (e) {
        console.error("MongoDB create issue error, falling back", e);
      }
    }

    return jsonIssueDb.create({
      ...issue,
      status: "Pending",
      upvotes: 0,
      upvoters: [],
      verifiedBy: [],
      comments: [],
      timeline: initialTimeline
    } as any);
  },

  async update(id: string, update: Partial<IIssue>): Promise<IIssue | null> {
    if (isMongoDB) {
      try {
        // Build raw mongoose update based on object keys
        const mongoUpdate: any = {};
        for (const key in update) {
          mongoUpdate[key] = (update as any)[key];
        }
        const updated = await MongoIssue.findByIdAndUpdate(id, mongoUpdate, { new: true });
        if (!updated) return null;
        return {
          id: updated._id.toString(),
          title: updated.title,
          description: updated.description,
          category: updated.category,
          priority: updated.priority,
          department: updated.department,
          imageUrl: updated.imageUrl,
          latitude: updated.latitude,
          longitude: updated.longitude,
          status: updated.status,
          upvotes: updated.upvotes,
          upvoters: updated.upvoters || [],
          verifiedBy: updated.verifiedBy || [],
          reporterId: updated.reporterId,
          reporterName: updated.reporterName,
          comments: (updated.comments || []).map((c: any) => ({
            id: c._id ? c._id.toString() : c.id,
            issueId: c.issueId,
            userId: c.userId,
            username: c.username,
            text: c.text,
            createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString()
          })),
          timeline: (updated.timeline || []).map((t: any) => ({
            status: t.status,
            notes: t.notes,
            updatedBy: t.updatedBy,
            timestamp: t.timestamp ? t.timestamp.toISOString() : new Date().toISOString()
          })),
          createdAt: updated.createdAt ? updated.createdAt.toISOString() : new Date().toISOString()
        };
      } catch (e) {
        console.error("MongoDB update issue error, falling back", e);
      }
    }
    return jsonIssueDb.findByIdAndUpdate(id, update);
  },

  async delete(id: string): Promise<boolean> {
    if (isMongoDB) {
      try {
        const res = await MongoIssue.findByIdAndDelete(id);
        return !!res;
      } catch (e) {
        console.error("MongoDB delete issue error, falling back", e);
      }
    }
    return jsonIssueDb.findByIdAndDelete(id);
  }
};
