export enum RoutePath {
  HOME = '/',
  GALLERY = '/gallery',
  NEWS = '/news',
  LOGIN = '/login',
  DASHBOARD = '/dashboard',
  TRANSPARENCY = '/transparency',
  SIGNUP = '/signup',
  BILLS = '/admin/bills',
  FUNDS = '/funds',
  USERS = '/users',
  REQUESTS = '/admin/requests',
  SITE_EDITOR = '/admin/site-editor',
  GALLERY_ADMIN = '/admin/gallery',
  MONTHLY_REPORT = '/admin/monthly-report',
  GENERATE_ID = '/admin/generate-id',
  ALL_IDS = '/admin/all-ids',
  VERIFY_ID = '/verify-id/:uid',
  NEWS_ADMIN = '/admin/news',
  CHAT = '/admin/chat'
}

export type Role = 'SUPER_ADMIN' | 'MEMBER_ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string; // In a real app, this is hashed. 
  accessCode?: string; // Unique code for ID generation
  transparencyCode?: string; // Unique code for Transparency access
}

export interface FinanceState {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  transactions: Transaction[];
  requests: ExpenseRequest[];
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  date: string;
  source?: string;
}

export interface ExpenseRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  projectName: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  date: string;
  proofUrl?: string; // Image/Bill URL
  deadline?: string;
}

export interface CMSData {
  heroTitle: string;
  heroSubtitle: string;
  heroImages: string[];
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    linkedin: string;
  };
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  pdfUrl?: string;
  downloadLinks?: LinkItem[];
  date: string;
}

export interface GalleryAlbum {
  id: string;
  name: string;
  images: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  targetUserId?: string; // If null, global
}

export interface IDCard {
  id?: string;
  uid: string;
  fullName: string;
  memberId: string;
  position: string;
  profileImage: string;
  phone: string;
  email: string;
  generatedAt: string;
  motto?: string;
  batch?: string;
  issuedDate?: string;
  expiryDate?: string;
  secretaryName?: string;
}