type AppDefinitionBase = {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  repositoryUrl: string | null;
  previewUrl?: string;
};

export type LocalAppDefinition = AppDefinitionBase & {
  kind: "local";
  port: number;
  localPath: string;
  launch?: {
    script: "dev" | "edit" | "tauri";
    portEnv?: string;
    portArg?: "-p" | "--port";
    tauriDevUrl?: boolean;
    astroForeground?: boolean;
    desktopExecutable?: string;
  };
};

export type WebAppDefinition = AppDefinitionBase & {
  kind: "web";
};

export type AppDefinition = LocalAppDefinition | WebAppDefinition;

export type AppRuntimeStatus = {
  id: string;
  state: "running" | "stopped";
  checkedAt: string;
  responseTimeMs: number;
  managed?: boolean;
};

export type StatusResponse = {
  statuses: AppRuntimeStatus[];
  checkedAt: string;
};
