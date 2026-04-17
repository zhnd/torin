export interface Source {
  repo: string;
  branch?: string;
  token?: string;
  newBranch?: string;
}

export interface GitUser {
  name: string;
  email: string;
}
