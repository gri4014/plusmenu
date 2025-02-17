import { IDeveloper, IRestaurantAdmin } from '../models/interfaces/auth';
import { ICustomer } from '../models/interfaces/customer';
import { RoleType } from '../types/rbac';
import { TableStatus } from '../models/interfaces/system';

// Table management request types
export interface CreateTableRequest {
  number: number;
}

export interface UpdateTableStatusRequest {
  status: TableStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: RoleType;
        sessionId: string;
        entity?: IDeveloper | IRestaurantAdmin | ICustomer;
      };
      restaurantAdmin?: IRestaurantAdmin;
      customer?: ICustomer;
    }
  }
}
