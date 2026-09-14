export type AppDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  port: number;
  localPath: string;
  repositoryUrl: string | null;
};

export type AppRuntimeStatus = {
  id: string;
  state: "running" | "stopped";
  checkedAt: string;
  responseTimeMs: number;
};

export type StatusResponse = {
  statuses: AppRuntimeStatus[];
  checkedAt: string;
};
