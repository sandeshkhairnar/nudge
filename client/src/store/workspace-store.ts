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
  setWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void; // New method
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspace: null,
  workspaces: [], // Initialize empty array

  setWorkspace: (workspace) =>
    set(() => ({
      workspace,
    })),

  setWorkspaces: (workspaces) =>
    set(() => ({
      workspaces,
    })),

  clearWorkspace: () =>
    set(() => ({
      workspace: null,
      workspaces: [],
    })),
}));