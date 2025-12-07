import { mssqlTable, int, varchar, bit, primaryKey, unique } from 'drizzle-orm/mssql-core';

export const projects = mssqlTable('projects', {
  id: int('id').primaryKey().identity(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 'max' }),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
});

export const permissions = mssqlTable('permissions', {
  id: int('id').primaryKey().identity(),
  projectId: int('project_id').references(() => projects.id).notNull(),
  key: varchar('key', { length: 255 }).notNull(), // e.g. feature.permission
  description: varchar('description', { length: 'max' }),
}, (t) => [
  unique('unique_key_per_project').on(t.projectId, t.key),
]);

export const permissionGroups = mssqlTable('permission_groups', {
  id: int('id').primaryKey().identity(),
  projectId: int('project_id').references(() => projects.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
}, (t) => [
  unique('unique_name_per_project').on(t.projectId, t.name),
]);

export const groupPermissions = mssqlTable('group_permissions', {
  groupId: int('group_id').references(() => permissionGroups.id).notNull(),
  permissionId: int('permission_id').references(() => permissions.id).notNull(),
  enabled: bit('enabled').default(false).notNull(),
}, (t) => [
  primaryKey({ columns: [t.groupId, t.permissionId] }),
]);

export const users = mssqlTable('users', {
  id: int('id').primaryKey().identity(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  permissionGroupId: int('permission_group_id').references(() => permissionGroups.id),
});

export const schema = {
  projects,
  permissions,
  permissionGroups,
  groupPermissions,
  users,
};





