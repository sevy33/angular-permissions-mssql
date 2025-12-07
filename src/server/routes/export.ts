import { Hono } from 'hono';
import { db } from '../../db';
import { projects, permissions, groupPermissions, permissionGroups } from '../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';

export const exportRoutes = new Hono();

// Get all projects with groups and their permissions
exportRoutes.get('/all', async (c) => {
  const allProjects = await db.select({
    id: projects.id,
    name: projects.name,
    description: projects.description,
    apiKey: projects.apiKey
  }).from(projects);

  const projectIds = allProjects.map((p: any) => p.id);
  if (projectIds.length === 0) {
    return c.json([]);
  }

  const allGroups = await db.select({
    id: permissionGroups.id,
    projectId: permissionGroups.projectId,
    name: permissionGroups.name
  }).from(permissionGroups).where(inArray(permissionGroups.projectId, projectIds));

  const allPermissions = await db.select({
    id: permissions.id,
    projectId: permissions.projectId,
    key: permissions.key,
    description: permissions.description
  }).from(permissions).where(inArray(permissions.projectId, projectIds));

  const groupIds = allGroups.map((g: any) => g.id);
  let allGroupPermissions: any[] = [];
  if (groupIds.length > 0) {
    allGroupPermissions = await db.select({
        groupId: groupPermissions.groupId,
        permissionId: groupPermissions.permissionId,
        enabled: groupPermissions.enabled
    })
    .from(groupPermissions)
    .where(inArray(groupPermissions.groupId, groupIds));
  }

  const result = allProjects.map((p: any) => {
    const projPerms = allPermissions.filter((perm: any) => perm.projectId === p.id);
    const projGroups = allGroups.filter((g: any) => g.projectId === p.id);

    return {
        id: p.id,
        name: p.name,
        description: p.description,
        apiKey: p.apiKey,
        permissionGroups: projGroups.map((g: any) => {
            const groupPerms = projPerms.map((perm: any) => {
                const gp = allGroupPermissions.find((gp: any) => gp.groupId === g.id && gp.permissionId === perm.id);
                return {
                    key: perm.key,
                    description: perm.description,
                    enabled: gp ? gp.enabled : false
                };
            });
            return {
                id: g.id,
                name: g.name,
                permissions: groupPerms
            };
        })
    };
  });

  return c.json(result);
});

// Get single project by API Key
exportRoutes.get('/project/:apiKey', async (c) => {
  const apiKey = c.req.param('apiKey');

  const [project] = await db.select({
    id: projects.id,
    name: projects.name,
    description: projects.description,
    apiKey: projects.apiKey
  }).from(projects).where(eq(projects.apiKey, apiKey));

  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const groups = await db.select({
    id: permissionGroups.id,
    name: permissionGroups.name
  }).from(permissionGroups).where(eq(permissionGroups.projectId, project.id));

  const projectPermissions = await db.select({
      id: permissions.id,
      key: permissions.key,
      description: permissions.description
  }).from(permissions).where(eq(permissions.projectId, project.id));

  const groupIds = groups.map((g: any) => g.id);
  let groupPermissionsList: any[] = [];
  if (groupIds.length > 0) {
    groupPermissionsList = await db.select({
        groupId: groupPermissions.groupId,
        permissionId: groupPermissions.permissionId,
        enabled: groupPermissions.enabled
    })
    .from(groupPermissions)
    .where(inArray(groupPermissions.groupId, groupIds));
  }

  const result = {
    id: project.id,
    name: project.name,
    description: project.description,
    apiKey: project.apiKey,
    permissionGroups: groups.map((g: any) => {
        const perms = projectPermissions.map((perm: any) => {
            const gp = groupPermissionsList.find((p: any) => p.groupId === g.id && p.permissionId === perm.id);
            return {
                key: perm.key,
                description: perm.description,
                enabled: gp ? gp.enabled : false
            };
        });
        return {
            id: g.id,
            name: g.name,
            permissions: perms
        };
    })
  };

  return c.json(result);
});

// Get permissions for a specific group in a project
exportRoutes.get('/project/:apiKey/group/:groupName', async (c) => {
  const apiKey = c.req.param('apiKey');
  const groupName = c.req.param('groupName');

  const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.apiKey, apiKey));

  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const [group] = await db.select({
    id: permissionGroups.id,
    name: permissionGroups.name
  }).from(permissionGroups).where(and(eq(permissionGroups.projectId, project.id), eq(permissionGroups.name, groupName)));

  if (!group) {
    return c.json({ error: 'Group not found' }, 404);
  }

  const projectPermissions = await db.select({
    id: permissions.id,
    key: permissions.key
  }).from(permissions).where(eq(permissions.projectId, project.id));

  const groupPermissionsList = await db.select({
    permissionId: groupPermissions.permissionId,
    enabled: groupPermissions.enabled
  }).from(groupPermissions).where(eq(groupPermissions.groupId, group.id));

  const result = projectPermissions.reduce((acc: any, perm: any) => {
    const gp = groupPermissionsList.find((p: any) => p.permissionId === perm.id);
    acc[perm.key] = gp ? gp.enabled : false;
    return acc;
  }, {} as Record<string, boolean>);

  return c.json(result);
});
