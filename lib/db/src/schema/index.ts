import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  iconLibrary: text("icon_library").notNull().default("Feather"),
  color: text("color").notNull(),
  bgColor: text("bg_color").notNull(),
});

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  categoryName: text("category_name").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  duration: integer("duration").notNull(),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("review_count").notNull().default(0),
  popular: boolean("popular").default(false),
  includes: text("includes").array().notNull().default([]),
});

export const providers = pgTable("providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rating: real("rating").notNull().default(4.5),
  reviewCount: integer("review_count").notNull().default(0),
  experienceYears: integer("experience_years").notNull().default(1),
  specializations: text("specializations").array().notNull().default([]),
  pricePerHour: integer("price_per_hour").notNull(),
  verified: boolean("verified").notNull().default(false),
  completedJobs: integer("completed_jobs").notNull().default(0),
  initials: text("initials").notNull(),
  color: text("color").notNull(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  serviceId: text("service_id"),
  serviceName: text("service_name").notNull(),
  categoryName: text("category_name").notNull(),
  providerId: text("provider_id"),
  providerName: text("provider_name"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("upcoming"),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
