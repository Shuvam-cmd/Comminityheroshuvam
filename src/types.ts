export interface IUser {
  id: string;
  username: string;
  email: string;
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
  upvoters: string[];
  verifiedBy: string[];
  reporterId: string;
  reporterName: string;
  comments: IComment[];
  timeline: ITimelineEvent[];
  createdAt: string;
}

export interface IStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  categoryDistribution: { [key: string]: number };
  departmentDistribution: { [key: string]: number };
}
