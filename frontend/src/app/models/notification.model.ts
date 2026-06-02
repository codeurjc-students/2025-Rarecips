export interface Notification {
  id?: number;
  recipientUsername: string;
  senderUsername?: string;
  type: 'WELCOME' | 'REPORTED_USER' | 'REPORTED_RECIPE' | 'REPORTED_REVIEW' | 'LIKED_RECIPE' | 'ADDED_TO_COLLECTION' | 'REVIEW_ADDED';
  message: string;
  isRead?: boolean;
  messageKey?: string;
  messageArgs?: { [k: string]: string };
  relatedId?: number;
  read: boolean;
  createdAt: string;
  displayMessage?: string;
  displayMessageParts?: { text: string; linkCommands?: any[] }[];
}
