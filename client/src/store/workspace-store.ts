import { create } from "zustand";

interface Workspace {
  id: string;
  name: string;
  plan: string;
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