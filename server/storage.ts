// Storage layer for ComplianceDrone authentication and pilot management
// Integrates with Replit Auth integration for secure user operations

import {
  users,
  pilotProfiles,
  jobs,
  type User,
  type UpsertUser,
  type PilotProfile,
  type UpsertPilotProfile,
  type UserWithPilotProfile,
  type PilotWithUser,
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Extended user operations
  getUserWithPilotProfile(id: string): Promise<UserWithPilotProfile | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Pilot profile operations
  createPilotProfile(profile: UpsertPilotProfile): Promise<PilotProfile>;
  updatePilotProfile(id: string, profile: Partial<UpsertPilotProfile>): Promise<PilotProfile>;
  getPilotProfile(userId: string): Promise<PilotProfile | undefined>;
  getPilotProfileById(id: string): Promise<PilotProfile | undefined>;
  getPilotWithUser(profileId: string): Promise<PilotWithUser | undefined>;
  
  // Pilot management operations
  getPendingPilots(): Promise<PilotWithUser[]>;
  getApprovedPilots(): Promise<PilotWithUser[]>;
  approvePilot(profileId: string, approvedBy: string): Promise<PilotProfile>;
  updatePilotStatus(profileId: string, status: 'pending' | 'approved' | 'active' | 'inactive' | 'suspended'): Promise<PilotProfile>;
}

export class DatabaseStorage implements IStorage {
  // User operations - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Extended user operations
  async getUserWithPilotProfile(id: string): Promise<UserWithPilotProfile | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .leftJoin(pilotProfiles, eq(users.id, pilotProfiles.userId))
      .where(eq(users.id, id));
    
    if (!result.users) return undefined;
    
    return {
      ...result.users,
      pilotProfile: result.pilot_profiles || undefined
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Pilot profile operations
  async createPilotProfile(profileData: UpsertPilotProfile): Promise<PilotProfile> {
    const [profile] = await db
      .insert(pilotProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updatePilotProfile(id: string, profileData: Partial<UpsertPilotProfile>): Promise<PilotProfile> {
    const [profile] = await db
      .update(pilotProfiles)
      .set({
        ...profileData,
        updatedAt: new Date()
      })
      .where(eq(pilotProfiles.id, id))
      .returning();
    return profile;
  }

  async getPilotProfile(userId: string): Promise<PilotProfile | undefined> {
    const [profile] = await db
      .select()
      .from(pilotProfiles)
      .where(eq(pilotProfiles.userId, userId));
    return profile;
  }

  async getPilotProfileById(id: string): Promise<PilotProfile | undefined> {
    const [profile] = await db
      .select()
      .from(pilotProfiles)
      .where(eq(pilotProfiles.id, id));
    return profile;
  }

  async getPilotWithUser(profileId: string): Promise<PilotWithUser | undefined> {
    const [result] = await db
      .select()
      .from(pilotProfiles)
      .innerJoin(users, eq(pilotProfiles.userId, users.id))
      .where(eq(pilotProfiles.id, profileId));
    
    if (!result.pilot_profiles || !result.users) return undefined;
    
    return {
      ...result.pilot_profiles,
      user: result.users
    };
  }

  // Pilot management operations
  async getPendingPilots(): Promise<PilotWithUser[]> {
    const results = await db
      .select()
      .from(pilotProfiles)
      .innerJoin(users, eq(pilotProfiles.userId, users.id))
      .where(eq(pilotProfiles.status, 'pending'))
      .orderBy(desc(pilotProfiles.createdAt));
    
    return results.map(result => ({
      ...result.pilot_profiles,
      user: result.users
    }));
  }

  async getApprovedPilots(): Promise<PilotWithUser[]> {
    const results = await db
      .select()
      .from(pilotProfiles)
      .innerJoin(users, eq(pilotProfiles.userId, users.id))
      .where(eq(pilotProfiles.status, 'approved'))
      .orderBy(desc(pilotProfiles.createdAt));
    
    return results.map(result => ({
      ...result.pilot_profiles,
      user: result.users
    }));
  }

  async approvePilot(profileId: string, approvedBy: string): Promise<PilotProfile> {
    const [profile] = await db
      .update(pilotProfiles)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date()
      })
      .where(eq(pilotProfiles.id, profileId))
      .returning();
    return profile;
  }

  async updatePilotStatus(
    profileId: string, 
    status: 'pending' | 'approved' | 'active' | 'inactive' | 'suspended'
  ): Promise<PilotProfile> {
    const [profile] = await db
      .update(pilotProfiles)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(pilotProfiles.id, profileId))
      .returning();
    return profile;
  }
}

export const storage = new DatabaseStorage();