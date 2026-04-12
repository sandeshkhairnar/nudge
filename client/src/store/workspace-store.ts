import { create } from "zustand";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  owner_id: string;
  plan?: string;
  created_at: string;
  updated_at: string;
  nudge_engine_active?: boolean;
  nudge_check_time?: string;
  nudge_check_times?: string[];
}

interface WorkspaceStore {
  workspace: Workspace | null;
  workspaces: Workspace[]; // Add list of available workspaces
  workspacesLoaded: boolean;
  setWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void; // New method
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspace: null,
  workspaces: [], // Initialize empty array
  workspacesLoaded: false,

  setWorkspace: (workspace) =>
    set(() => ({
      workspace,
    })),

  setWorkspaces: (workspaces) =>
    set(() => ({
      workspaces,
      workspacesLoaded: true,
    })),

  clearWorkspace: () =>
    set(() => ({
      workspace: null,
      workspaces: [],
      workspacesLoaded: false,
    })),
}));