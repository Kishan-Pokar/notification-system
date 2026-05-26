// user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  api_key: string;
  created_at: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}