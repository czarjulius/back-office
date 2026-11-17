export type User = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  email: string;
  loginCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SessionPayload = {
  sessionId: string;
  user: User;
};

export type SignUpInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export type SignInInput = {
  email: string;
  password: string;
};
