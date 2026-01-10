import { pgTable, text, timestamp, decimal, uuid, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const pockets = pgTable('pockets', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id').notNull(), // Hardcoded 'demo-user' for now
});

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
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

export const pocketsRelations = relations(pockets, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ many, one }) => ({
  items: many(items),
  pocket: one(pockets, {
    fields: [invoices.pocketId],
    references: [pockets.id],
  }),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  invoice: one(invoices, {
    fields: [items.invoiceId],
    references: [invoices.id],
  }),
}));
