import { create } from "zustand";

export interface SidebarProject {
  id: string;
  name: string;
  color: string;
  progress: number;
  avatar_url?: string | null;
}

interface ProjectsStore {
  projects: SidebarProject[];
  workspaceId: string | null;
  setProjects: (projects: SidebarProject[], workspaceId: string) => void;
  addProject: (project: SidebarProject) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, partial: Partial<SidebarProject>) => void;
}

export const useProjectsStore = create<ProjectsStore>((set) => ({
  projects: [],
  workspaceId: null,

  setProjects: (projects, workspaceId) => set({ projects, workspaceId }),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  updateProject: (id, partial) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    })),
}));