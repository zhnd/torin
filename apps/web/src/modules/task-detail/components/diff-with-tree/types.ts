export interface DiffFile {
  file: string;
  patch: string;
  additions?: number;
  deletions?: number;
}

export interface DiffWithTreeProps {
  files: DiffFile[];
}
