
import { Timestamp } from "firebase/firestore";

export type Ticket = {
  id: string;
  subject: string;
  description: string;
  category: 'General Inquiry' | 'Technical Support' | 'Billing' | 'Bug Report';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  createdBy: string;
  agent: string;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
};

export type Comment = {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  createdAt: string | Timestamp;
};
