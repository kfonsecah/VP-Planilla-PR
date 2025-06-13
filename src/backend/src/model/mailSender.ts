export interface MailServerSettings {
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

export interface CreateMailServerSettingsDto {
  host: string;
  port: number;
  username: string;
  password: string;
  from_address: string;
  use_ssl: boolean;
  use_tls: boolean;
}

export interface UpdateMailServerSettingsDto {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  from_address?: string;
  use_ssl?: boolean;
  use_tls?: boolean;
}