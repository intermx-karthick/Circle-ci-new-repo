export interface UserMetadata {
  'given-name': string;
  'family-name': string;
  company: string;
  title: string;
}

export interface UserData {
  _id: string;
  email: string;
  displayName: string;
  name: string;
  nickname: string;
  user_metadata: UserMetadata | null;
}

export interface UserDataFromAPI {
  pagination: {
    total: number;
    page: number;
    perPage: number;
  };
  result: [
    {
      _id: string;
      email: string;
      displayName: string;
      name: string;
      nickname: string;
      user_metadata: UserMetadata | null;
    }
  ];
}
