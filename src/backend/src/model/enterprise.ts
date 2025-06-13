export interface Enterprise {
  id: number;
  name: string;
  image: Buffer;
  creation_date: Date;
  version: number;
}

export interface CreateEnterpriseDto {
  name: string;
  image: Buffer;
  creation_date: Date;
}

export interface UpdateEnterpriseDto {
  name?: string;
  image?: Buffer;
  creation_date?: Date;
}