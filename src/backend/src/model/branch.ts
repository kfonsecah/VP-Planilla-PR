export interface Branch {
  id: number;
  branch_name: string;
  location: string;
  version: number;
}

export interface CreateBranchDto {
  branch_name: string;
  location: string;
}

export interface UpdateBranchDto {
  branch_name?: string;
  location?: string;
}