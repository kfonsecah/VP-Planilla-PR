export interface User {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  national_id: string;
  email: string;
  username: string;
  password: string;
  role: string; // e.g., 'admin', 'user'
  version: number;
}