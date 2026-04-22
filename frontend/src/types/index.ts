export interface User {
  id: string
  email: string
  username: string
  full_name: string
  is_active: boolean
  is_verified: boolean
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type?: string
  user?: User
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterResponse {
  id: string
  email: string
  username: string
  full_name: string
  is_active: boolean
  is_verified: boolean
  avatar_url: string | null
  bio: string | null
  created_at: string
}
