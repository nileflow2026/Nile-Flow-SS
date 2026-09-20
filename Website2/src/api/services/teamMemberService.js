import { httpClient } from '@api/client/HttpClient';

export const teamMemberService = {
  async getTeamMembers() {
    const response = await httpClient.get('/api/v1/team-members', {}, {
      skipAuth: true,
      withCredentials: false,
    });
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  async createTeamMember(payload) {
    const response = await httpClient.post('/api/v1/team-members', payload);
    return response.data;
  },

  async updateTeamMember(teamMemberId, payload) {
    const response = await httpClient.patch(`/api/v1/team-members/${teamMemberId}`, payload);
    return response.data;
  },

  async deleteTeamMember(teamMemberId) {
    const response = await httpClient.delete(`/api/v1/team-members/${teamMemberId}`);
    return response.data;
  },
};

export default teamMemberService;
