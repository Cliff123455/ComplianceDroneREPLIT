// Database schema for ComplianceDrone authentication and pilot management
// Integrates with Replit Auth integration for secure authentication

import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Required for Replit Auth, extended with pilot fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pilot status enum
export const pilotStatusEnum = pgEnum('pilot_status', [
  'pending',     // Initial registration, awaiting review
  'approved',    // Approved by admin, can access platform
  'active',      // Currently active pilot with jobs
  'inactive',    // Temporarily inactive
  'suspended'    // Account suspended
]);

// Pilot profiles - Extended information for drone pilots
export const pilotProfiles = pgTable("pilot_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Professional Information
  companyName: varchar("company_name"),
  businessType: varchar("business_type"), // 'individual', 'llc', 'corporation', 'partnership'
  taxId: varchar("tax_id"),
  
  // Contact Information
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  
  // Pilot Qualifications
  part107Certified: boolean("part_107_certified").default(false),
  part107Number: varchar("part_107_number"),
  licenseExpiryDate: timestamp("license_expiry_date"),
  thermalExperienceYears: integer("thermal_experience_years"),
  totalFlightHours: integer("total_flight_hours"),
  
  // Equipment Information
  droneModels: jsonb("drone_models").$type<string[]>(), // Array of drone model names
  thermalCameraModels: jsonb("thermal_camera_models").$type<string[]>(),
  
  // Insurance Information
  hasInsurance: boolean("has_insurance").default(false),
  insuranceProvider: varchar("insurance_provider"),
  insurancePolicyNumber: varchar("insurance_policy_number"),
  insuranceExpiryDate: timestamp("insurance_expiry_date"),
  liabilityCoverage: integer("liability_coverage"), // Coverage amount in USD
  
  // Geographic Coverage
  serviceStates: jsonb("service_states").$type<string[]>(),
  maxTravelDistance: integer("max_travel_distance"), // Miles from base location
  
  // Platform Status
  status: pilotStatusEnum("status").default('pending'),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"), // Admin user ID who approved
  
  // Performance Metrics
  completedJobs: integer("completed_jobs").default(0),
  averageRating: integer("average_rating"), // 1-5 star rating
  totalEarnings: integer("total_earnings").default(0), // In cents
  
  // Application Information
  notes: text("notes"), // Admin notes
  applicationNotes: text("application_notes"), // Pilot's application essay/notes
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table - Thermal inspection jobs
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientUserId: varchar("client_user_id").references(() => users.id),
  assignedPilotId: varchar("assigned_pilot_id").references(() => pilotProfiles.id),
  
  // Job Details
  title: varchar("title").notNull(),
  description: text("description"),
  location: varchar("location"),
  coordinatesLat: varchar("coordinates_lat"),
  coordinatesLng: varchar("coordinates_lng"),
  
  // Job Status
  status: varchar("status").default('created'), // 'created', 'assigned', 'in_progress', 'completed', 'cancelled'
  
  // File Processing
  fileCount: integer("file_count").default(0),
  processedCount: integer("processed_count").default(0),
  anomalyCount: integer("anomaly_count"),
  reportGenerated: boolean("report_generated").default(false),
  
  // Scheduling
  scheduledDate: timestamp("scheduled_date"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  pilotProfile: one(pilotProfiles, {
    fields: [users.id],
    references: [pilotProfiles.userId],
  }),
}));

export const pilotProfilesRelations = relations(pilotProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [pilotProfiles.userId],
    references: [users.id],
  }),
  assignedJobs: many(jobs, {
    relationName: "pilot_jobs",
  }),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  client: one(users, {
    fields: [jobs.clientUserId],
    references: [users.id],
  }),
  assignedPilot: one(pilotProfiles, {
    fields: [jobs.assignedPilotId],
    references: [pilotProfiles.id],
  }),
}));

// Type definitions for TypeScript
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpsertPilotProfile = typeof pilotProfiles.$inferInsert;
export type PilotProfile = typeof pilotProfiles.$inferSelect;
export type UpsertJob = typeof jobs.$inferInsert;
export type Job = typeof jobs.$inferSelect;

// Combined types for API responses
export type UserWithPilotProfile = User & {
  pilotProfile?: PilotProfile;
};

export type PilotWithUser = PilotProfile & {
  user: User;
};