/**
 * TypeScript interfaces for BNI Sigmaconnect.
 * These mirror the backend Pydantic schemas exactly.
 */

// ── User Types ──

export interface UserCard {
  id: string;
  name: string;
  business_name: string | null;
  business_category: string | null;
  profile_image: string | null;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  business_name: string | null;
  business_category: string | null;
  profile_image: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBrief {
  id: string;
  name: string;
  phone: string;
  is_admin: boolean;
  profile_image: string | null;
}

// ── Auth Types ──

export interface SendOTPRequest {
  phone: string;
}

export interface SendOTPResponse {
  message: string;
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserBrief;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ── Swipe Types ──

export type SwipeDirection = "like" | "reject";

export interface SwipeRequest {
  swiped_id: string;
  direction: SwipeDirection;
}

export interface SwipeResponse {
  matched: boolean;
  matched_user: UserCard | null;
}

export interface SentSwipeItem {
  user: UserCard;
  swiped_at: string;
}

export interface MatchItem {
  user: UserCard;
  matched_at: string;
}

export interface SentSwipeListResponse {
  sent: SentSwipeItem[];
  total: number;
}

export interface MatchListResponse {
  matches: MatchItem[];
  total: number;
}

// ── Stack Types ──

export interface UserStackResponse {
  stack: UserCard[];
  total: number;
}

// ── Admin Types ──

export interface AdminMemberCreate {
  phone: string;
  name: string;
  business_name?: string;
  business_category?: string;
}

export interface AdminMemberUpdate {
  name?: string;
  business_name?: string;
  business_category?: string;
  phone?: string;
  is_active?: boolean;
}

export interface AdminMemberResponse {
  id: string;
  phone: string;
  name: string;
  business_name: string | null;
  business_category: string | null;
  profile_image: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Admin Dashboard Swipe Stats ──

export interface MemberSwipeStats {
  id: string;
  name: string;
  profile_image: string | null;
  liked_count: number;
  rejected_count: number;
}

export interface SwipedUserInfo {
  id: string;
  name: string;
  profile_image: string | null;
  business_name: string | null;
}

export interface MemberSwipeDetail {
  member: SwipedUserInfo;
  liked: SwipedUserInfo[];
  rejected: SwipedUserInfo[];
  not_swiped: SwipedUserInfo[];
  liked_by: SwipedUserInfo[];
  matches: SwipedUserInfo[];
}

