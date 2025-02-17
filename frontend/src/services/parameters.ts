import api from './api';
import { 
  Parameter, 
  CreateParameterPayload, 
  UpdateParameterPayload,
  ParameterResponse,
  ParametersResponse
} from '@/types/parameters';

// Developer operations
const developerParametersService = {
  getParameters: async (): Promise<ParametersResponse> => {
    const { data } = await api.get<ParametersResponse>('/developer/parameters');
    return data;
  },

  createParameter: async (payload: CreateParameterPayload): Promise<ParameterResponse> => {
    const { data } = await api.post<ParameterResponse>('/developer/parameters', payload);
    return data;
  },

  updateParameter: async (id: string, payload: UpdateParameterPayload): Promise<ParameterResponse> => {
    const { data } = await api.put<ParameterResponse>(`/developer/parameters/${id}`, payload);
    return data;
  },

  deleteParameter: async (id: string): Promise<ParameterResponse> => {
    const { data } = await api.delete<ParameterResponse>(`/developer/parameters/${id}`);
    return data;
  }
};

// Restaurant operations
const restaurantParametersService = {
  getParameters: async (): Promise<ParametersResponse> => {
    const { data } = await api.get<ParametersResponse>('/restaurant/parameters');
    return data;
  }
};

export { developerParametersService, restaurantParametersService };
