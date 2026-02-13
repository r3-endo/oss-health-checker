export type RepositoryId = string;

export type Repository = Readonly<{
  id: RepositoryId;
  url: string;
  owner: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}>;
