import { api } from './client';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  link?: string;
  order: number;
}

export interface PathDefinition {
  id: string;
  title: string;
  description: string;
  milestones: Milestone[];
}

export interface CompassState {
  pathId: string;
  completedMilestones: string[];
  startedAt: string;
  updatedAt: string;
}

export interface CompassResponse {
  paths: PathDefinition[];
  state: CompassState | null;
  recommendations: string[];
}

export interface CompassActionResponse {
  state: CompassState;
  recommendations: string[];
}

export const compassApi = {
  getCompass: async () => {
    return api.get<CompassResponse>('/compass');
  },

  selectPath: async (pathId: string) => {
    return api.post<CompassActionResponse>('/compass/select', { pathId });
  },

  completeMilestone: async (milestoneId: string) => {
    return api.patch<CompassActionResponse>(`/compass/milestone/${milestoneId}`, {});
  },
};
