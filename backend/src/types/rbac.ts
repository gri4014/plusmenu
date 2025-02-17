import { z } from 'zod';

/**
 * Available resources in the system
 */
export const ResourceType = {
  RESTAURANT: 'restaurant',
  MENU: 'menu',
  ORDER: 'order',
  TABLE: 'table',
  ADMIN: 'admin',
  THEME: 'theme'
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

/**
 * Available actions that can be performed on resources
 */
export const ActionType = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage' // Special action that grants all permissions
} as const;

export type ActionType = typeof ActionType[keyof typeof ActionType];

/**
 * Interface for a permission
 */
export interface Permission {
  /** The resource this permission applies to */
  resource: ResourceType;
  /** The action allowed on the resource */
  action: ActionType;
}

/**
 * Available roles in the system
 */
export const RoleType = {
  DEVELOPER: 'developer',
  RESTAURANT_ADMIN: 'restaurant_admin',
  CUSTOMER: 'customer'
} as const;

export type RoleType = typeof RoleType[keyof typeof RoleType];

/**
 * Interface for a role
 */
export interface Role {
  /** Name of the role */
  name: RoleType;
  /** List of permissions granted to this role */
  permissions: Permission[];
}

/**
 * Zod schema for permissions
 */
export const permissionSchema = z.object({
  resource: z.enum([
    ResourceType.RESTAURANT,
    ResourceType.MENU,
    ResourceType.ORDER,
    ResourceType.TABLE,
    ResourceType.ADMIN,
    ResourceType.THEME
  ]),
  action: z.enum([
    ActionType.CREATE,
    ActionType.READ,
    ActionType.UPDATE,
    ActionType.DELETE,
    ActionType.MANAGE
  ])
});

/**
 * Zod schema for roles
 */
export const roleSchema = z.object({
  name: z.enum([RoleType.DEVELOPER, RoleType.RESTAURANT_ADMIN, RoleType.CUSTOMER]),
  permissions: z.array(permissionSchema)
});

/**
 * Type for permission check result
 */
export type PermissionCheckResult = {
  granted: true;
} | {
  granted: false;
  reason: string;
};
