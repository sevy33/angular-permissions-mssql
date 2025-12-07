import { Hono } from 'hono';
import { db } from '../../db';
import { projects, permissions, permissionGroups, groupPermissions } from '../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const projectRoutes = new Hono();

// Get all projects with permissions and groups
projectRoutes.get('/projects', async (c) => {
  const allProjects = await db.select().from(projects);
  const projectIds = allProjects.map((p: any) => p.id);

  if (projectIds.length === 0) {
    return c.json([]);
  }

  const allPermissions = await db.select().from(permissions).where(inArray(permissions.projectId, projectIds));
  const allGroups = await db.select().from(permissionGroups).where(inArray(permissionGroups.projectId, projectIds));
  
  const groupIds = allGroups.map((g: any) => g.id);
  let allGroupPermissions: any[] = [];
  if (groupIds.length > 0) {
    allGroupPermissions = await db.select().from(groupPermissions).where(inArray(groupPermissions.groupId, groupIds));
  }

  const result = allProjects.map((p: any) => ({
    ...p,
    permissions: allPermissions.filter((perm: any) => perm.projectId === p.id),
    permissionGroups: allGroups.filter((g: any) => g.projectId === p.id).map((g: any) => ({
      ...g,
      groupPermissions: allGroupPermissions.filter((gp: any) => gp.groupId === g.id)
    }))
  }));

  return c.json(result);
});

// Bulk import permissions and groups
projectRoutes.post('/projects/:id/bulk-import', async (c) => {
  const projectId = Number(c.req.param('id'));
  const body = await c.req.json();
  const { items } = body as { items: { key: string; description: string; group?: string }[] };

  if (!items || !Array.isArray(items)) {
    return c.json({ error: 'Invalid payload' }, 400);
  }

  const results = {
    permissionsCreated: 0,
    groupsCreated: 0,
    assignmentsCreated: 0,
    errors: [] as string[]
  };

  for (const item of items) {
    try {
      // 1. Create or Get Permission
      let permissionId: number;
      const existingPerm = await db.select().top(1).from(permissions).where(and(
        eq(permissions.projectId, projectId),
        eq(permissions.key, item.key)
      ));

      if (existingPerm.length > 0) {
        permissionId = existingPerm[0].id;
      } else {
        const [newPerm] = await db.insert(permissions).output().values({
          projectId,
          key: item.key,
          description: item.description
        });
        permissionId = newPerm.id;
        results.permissionsCreated++;
      }

      // 2. Handle Group if present
      if (item.group) {
        let groupId: number;
        const existingGroup = await db.select().top(1).from(permissionGroups).where(and(
          eq(permissionGroups.projectId, projectId),
          eq(permissionGroups.name, item.group)
        ));

        if (existingGroup.length > 0) {
          groupId = existingGroup[0].id;
        } else {
          const [newGroup] = await db.insert(permissionGroups).output().values({
            projectId,
            name: item.group
          });
          groupId = newGroup.id;
          results.groupsCreated++;
        }

        // 3. Assign Permission to Group
        const existingAssignment = await db.select().top(1).from(groupPermissions).where(and(
          eq(groupPermissions.groupId, groupId),
          eq(groupPermissions.permissionId, permissionId)
        ));

        if (existingAssignment.length === 0) {
          await db.insert(groupPermissions)
            .values({ groupId, permissionId, enabled: true });
          results.assignmentsCreated++;
        }
      }
    } catch (e: any) {
      results.errors.push(`Failed to process ${item.key}: ${e.message}`);
    }
  }

  return c.json(results);
});

// Create a new project
projectRoutes.post('/projects', async (c) => {
  const body = await c.req.json();
  const { name, description } = body;

  if (!name) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const [newProject] = await db.insert(projects).output().values({
    name,
    description,
    apiKey: randomUUID()
  });

  return c.json(newProject);
});

// Delete a project
projectRoutes.delete('/projects/:id', async (c) => {
  const id = Number(c.req.param('id'));

  // 1. Get all permission IDs for this project
  const projectPermissions = await db.select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.projectId, id));
  const permissionIds = projectPermissions.map((p: any) => p.id);

  // 2. Get all group IDs for this project
  const projectGroups = await db.select({ id: permissionGroups.id })
    .from(permissionGroups)
    .where(eq(permissionGroups.projectId, id));
  const groupIds = projectGroups.map((g: any) => g.id);

  // 3. Delete groupPermissions
  if (groupIds.length > 0) {
     await db.delete(groupPermissions).where(inArray(groupPermissions.groupId, groupIds));
  }
  if (permissionIds.length > 0) {
      await db.delete(groupPermissions).where(inArray(groupPermissions.permissionId, permissionIds));
  }

  // 4. Delete permissions
  await db.delete(permissions).where(eq(permissions.projectId, id));

  // 5. Delete groups
  await db.delete(permissionGroups).where(eq(permissionGroups.projectId, id));

  // 6. Delete project
  await db.delete(projects).where(eq(projects.id, id));

  return c.json({ success: true });
});
