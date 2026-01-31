export interface Contact {
  id: string;
  name: string;
  initials: string;
  avatarColor: string; // Gradient string
  lastGift?: {
    type: 'given' | 'received';
    item: string;
    date: string;
  };
}

export interface Gift {
  id: string;
  contactId: string;
  type: 'given' | 'received';
  item: string;
  date: string;
  price?: number;
  note?: string;
  image?: string; // Future proofing
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}
