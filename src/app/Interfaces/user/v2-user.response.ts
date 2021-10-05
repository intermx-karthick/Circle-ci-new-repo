export interface Views {
  defaultViewId: number;
}

export interface UserMetadata {
  views: Views;
}

export interface Identity {
  user_id: string;
  provider: string;
  connection: string;
  isSocial: boolean;
}

export interface V2UserResponse {
  email: string;
  emailVerified: boolean;
  name: string;
  nickName: string;
  picture: string;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  legacyUserId: string;
  'given-name': string;
  accountIds: number[];
  user_metadata: UserMetadata;
  identities: Identity[];
}

