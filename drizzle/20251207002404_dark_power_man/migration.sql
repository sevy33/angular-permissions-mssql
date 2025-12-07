CREATE TABLE [group_permissions] (
	[group_id] int,
	[permission_id] int,
	[enabled] bit NOT NULL CONSTRAINT [group_permissions_enabled_default] DEFAULT ((0)),
	CONSTRAINT [group_permissions_pkey] PRIMARY KEY([group_id],[permission_id])
);
--> statement-breakpoint
CREATE TABLE [permission_groups] (
	[id] int IDENTITY(1, 1),
	[project_id] int NOT NULL,
	[name] varchar(255) NOT NULL,
	CONSTRAINT [permission_groups_pkey] PRIMARY KEY([id]),
	CONSTRAINT [permission_groups_project_id_name_key] UNIQUE([project_id],[name])
);
--> statement-breakpoint
CREATE TABLE [permissions] (
	[id] int IDENTITY(1, 1),
	[project_id] int NOT NULL,
	[key] varchar(255) NOT NULL,
	[description] varchar(max),
	CONSTRAINT [permissions_pkey] PRIMARY KEY([id]),
	CONSTRAINT [permissions_project_id_key_key] UNIQUE([project_id],[key])
);
--> statement-breakpoint
CREATE TABLE [projects] (
	[id] int IDENTITY(1, 1),
	[name] varchar(255) NOT NULL,
	[description] varchar(max),
	[api_key] varchar(255) NOT NULL,
	CONSTRAINT [projects_pkey] PRIMARY KEY([id]),
	CONSTRAINT [projects_api_key_key] UNIQUE([api_key])
);
--> statement-breakpoint
CREATE TABLE [users] (
	[id] int IDENTITY(1, 1),
	[username] varchar(255) NOT NULL,
	[password] varchar(255) NOT NULL,
	[permission_group_id] int,
	CONSTRAINT [users_pkey] PRIMARY KEY([id]),
	CONSTRAINT [users_username_key] UNIQUE([username])
);
--> statement-breakpoint
ALTER TABLE [group_permissions] ADD CONSTRAINT [group_permissions_group_id_permission_groups_id_fk] FOREIGN KEY ([group_id]) REFERENCES [permission_groups]([id]);--> statement-breakpoint
ALTER TABLE [group_permissions] ADD CONSTRAINT [group_permissions_permission_id_permissions_id_fk] FOREIGN KEY ([permission_id]) REFERENCES [permissions]([id]);--> statement-breakpoint
ALTER TABLE [permission_groups] ADD CONSTRAINT [permission_groups_project_id_projects_id_fk] FOREIGN KEY ([project_id]) REFERENCES [projects]([id]);--> statement-breakpoint
ALTER TABLE [permissions] ADD CONSTRAINT [permissions_project_id_projects_id_fk] FOREIGN KEY ([project_id]) REFERENCES [projects]([id]);--> statement-breakpoint
ALTER TABLE [users] ADD CONSTRAINT [users_permission_group_id_permission_groups_id_fk] FOREIGN KEY ([permission_group_id]) REFERENCES [permission_groups]([id]);