export enum Feature {
  CHAT = 'Chat',
  IMAGE_GEN = 'Image Generation',
  IMAGE_EDIT = 'Image Editing',
  SETTINGS = 'Settings',
}

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  text: string;
}
