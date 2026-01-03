export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  skillsTeaching: string[];
  skillsLearning: string[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
}

export interface SkillPost {
  id: string;
  user: User;
  skillOffered: string;
  skillWanted: string;
  description: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'message';
  user: User;
  message: string;
  createdAt: string;
  isRead: boolean;
  postId?: string;
}

export interface Message {
  id: string;
  user: User;
  lastMessage: string;
  createdAt: string;
  unreadCount: number;
}
