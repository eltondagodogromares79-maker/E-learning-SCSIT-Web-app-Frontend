export interface ChatSection {
  id: string;
  name: string;
}

export interface ChatContext {
  id: string;
  role: string;
  sections: ChatSection[];
  hidden_rooms?: string[];
}

export interface ChatContact {
  id: string;
  full_name: string;
  role: string;
  profile_picture?: string | null;
}

export interface ChatMessage {
  id: string;
  room_key: string;
  sender: string;
  sender_name?: string;
  content: string;
  kind?: string;
  sent_at: string;
  reply_to_id?: string | null;
  reply_to_content?: string | null;
  reply_to_sender?: string | null;
  reactions?: Record<string, string[]>;
}

export interface ChatReadReceipt {
  user: string;
  last_read_at: string;
}

export interface ChatRoomPayload {
  room: {
    id: string;
    room_key: string;
    room_type: string;
    name?: string | null;
  };
  messages: ChatMessage[];
  read_receipts: ChatReadReceipt[];
  has_more?: boolean;
  next_before?: string | null;
}

export interface ChatGroup {
  id: string;
  room_key: string;
  room_type: string;
  name?: string | null;
  member_count?: number;
  created_by?: string | null;
}
