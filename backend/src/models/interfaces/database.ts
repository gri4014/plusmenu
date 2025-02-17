import { DbError } from '../../utils/errors';

export interface DbResponse<T> {
  success: boolean;
  data?: T;
  error?: DbError | string;
}
