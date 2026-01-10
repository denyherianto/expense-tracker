import { pgTable, text, timestamp, boolean, uuid, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Better Auth Schema ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// --- Application Schema ---

export const pockets = pgTable('pockets', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  summary: text('summary').notNull(),
  date: timestamp('date').notNull(),
  totalAmount: numeric('total_amount').notNull(),
  pocketId: uuid('pocket_id').references(() => pockets.id),
  rawText: text('raw_text'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  quantity: numeric('quantity').notNull(),
  unitPrice: numeric('unit_price').notNull(),
  totalPrice: numeric('total_price').notNull(),
  category: text('category').notNull(),
});

export const pocketMembers = pgTable('pocket_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  pocketId: uuid('pocket_id').notNull().references(() => pockets.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Relations ---

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  pockets: many(pockets),
  invoices: many(invoices),
  sharedPockets: many(pocketMembers),
}));

export const pocketsRelations = relations(pockets, ({ many, one }) => ({
  invoices: many(invoices),
  owner: one(user, {
    fields: [pockets.userId],
    references: [user.id],
  }),
  members: many(pocketMembers),
}));

export const pocketMembersRelations = relations(pocketMembers, ({ one }) => ({
  pocket: one(pockets, {
    fields: [pocketMembers.pocketId],
    references: [pockets.id],
  }),
  user: one(user, {
    fields: [pocketMembers.userId],
    references: [user.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ many, one }) => ({
  items: many(items),
  pocket: one(pockets, {
    fields: [invoices.pocketId],
    references: [pockets.id],
  }),
  owner: one(user, {
    fields: [invoices.userId],
    references: [user.id],
  }),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  invoice: one(invoices, {
    fields: [items.invoiceId],
    references: [invoices.id],
  }),
}));
