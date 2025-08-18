export interface Server {
  id: number;
  host: string;
  port: number;
  username: string;
  password: string;
  from_address: string;
  use_ssl: boolean;
  use_tls: boolean;
  version: number;
}
