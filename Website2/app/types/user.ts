export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isPremium: boolean;
  milesBalance: number;
  addresses: Address[];
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
