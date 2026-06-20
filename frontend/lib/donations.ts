import api from './api';
import {
  Donation,
  CreateDonationData,
  DonationFilters,
  ApiResponse,
  Pagination,
} from '../types';

export const donationService = {
  /**
   * Get all donations with optional filters
   */
  getAll: async (
    filters: DonationFilters = {}
  ): Promise<{ donations: Donation[]; pagination: Pagination }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') params.append(key, String(val));
    });
    const response = await api.get<
      ApiResponse<{ donations: Donation[] }>
    >(`/donations?${params.toString()}`);
    return {
      donations: response.data.data!.donations,
      pagination: response.data.pagination!,
    };
  },

  /**
   * Get single donation
   */
  getById: async (id: string): Promise<Donation> => {
    const response = await api.get<ApiResponse<{ donation: Donation }>>(
      `/donations/${id}`
    );
    return response.data.data!.donation;
  },

  /**
   * Create a new donation (hotel only)
   */
  create: async (data: CreateDonationData): Promise<Donation> => {
    const response = await api.post<ApiResponse<{ donation: Donation }>>(
      '/donations',
      data
    );
    return response.data.data!.donation;
  },

  /**
   * Claim a donation (NGO only)
   */
  claim: async (id: string): Promise<Donation> => {
    const response = await api.patch<ApiResponse<{ donation: Donation }>>(
      `/donations/${id}/claim`
    );
    return response.data.data!.donation;
  },

  /**
   * Assign a volunteer to a donation
   */
  assignVolunteer: async (
    donationId: string,
    volunteerId: string
  ): Promise<Donation> => {
    const response = await api.patch<ApiResponse<{ donation: Donation }>>(
      `/donations/${donationId}/assign-volunteer`,
      { volunteerId }
    );
    return response.data.data!.donation;
  },

  /**
   * Mark donation as delivered
   */
  markDelivered: async (id: string): Promise<Donation> => {
    const response = await api.patch<ApiResponse<{ donation: Donation }>>(
      `/donations/${id}/deliver`
    );
    return response.data.data!.donation;
  },

  /**
   * Cancel a donation
   */
  cancel: async (id: string): Promise<void> => {
    await api.delete(`/donations/${id}`);
  },
};

export default donationService;
