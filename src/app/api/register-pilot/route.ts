import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/libs/prismaDB";
import { db } from "../../../../server/db";
import { users, pilotProfiles } from "../../../../shared/schema";
import { eq } from "drizzle-orm";

interface PilotRegistrationData {
  // Basic user info
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  companyName?: string;
  businessType: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Certifications
  part107Number: string;
  part107ExpiryDate: string;
  thermalExperienceYears: string;
  totalFlightHours: string;
  
  // Equipment
  droneModels: string[];
  thermalCameraModels: string[];
  
  // Insurance
  hasInsurance: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  liabilityCoverage?: string;
  
  // Service Area
  maxTravelDistance: string;
  serviceStates: string[];
  
  // Application notes
  applicationNotes: string;
}

export async function POST(request: Request) {
  try {
    const body: PilotRegistrationData = await request.json();
    const {
      name,
      email,
      password,
      phoneNumber,
      companyName,
      businessType,
      address,
      city,
      state,
      zipCode,
      part107Number,
      part107ExpiryDate,
      thermalExperienceYears,
      totalFlightHours,
      droneModels,
      thermalCameraModels,
      hasInsurance,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceExpiryDate,
      liabilityCoverage,
      maxTravelDistance,
      serviceStates,
      applicationNotes
    } = body;

    // Validation
    if (!name || !email || !password || !phoneNumber || !businessType) {
      return NextResponse.json(
        { error: "Missing required basic information" },
        { status: 400 }
      );
    }

    if (!address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: "Missing required address information" },
        { status: 400 }
      );
    }

    if (!part107Number || !part107ExpiryDate || !thermalExperienceYears || !totalFlightHours) {
      return NextResponse.json(
        { error: "Missing required certification information" },
        { status: 400 }
      );
    }

    if (!droneModels?.length || !thermalCameraModels?.length) {
      return NextResponse.json(
        { error: "Please select at least one drone model and thermal camera" },
        { status: 400 }
      );
    }

    if (!maxTravelDistance || !serviceStates?.length || !applicationNotes) {
      return NextResponse.json(
        { error: "Missing service area or application information" },
        { status: 400 }
      );
    }

    if (hasInsurance && (!insuranceProvider || !insurancePolicyNumber || !insuranceExpiryDate || !liabilityCoverage)) {
      return NextResponse.json(
        { error: "Insurance details are required when you have insurance" },
        { status: 400 }
      );
    }

    // Check if user already exists (Prisma)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if user already exists (Drizzle)
    const existingUserDrizzle = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUserDrizzle.length > 0) {
      return NextResponse.json(
        { error: "Email already registered in pilot system" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in Prisma (for NextAuth compatibility)
    const prismaUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create user in Drizzle (for pilot profiles)
    const drizzleUser = await db
      .insert(users)
      .values({
        email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
      })
      .returning();

    // Create pilot profile
    const pilotProfile = await db
      .insert(pilotProfiles)
      .values({
        userId: drizzleUser[0].id,
        
        // Professional Information
        companyName: companyName || null,
        businessType,
        
        // Contact Information  
        phoneNumber,
        address,
        city,
        state,
        zipCode,
        
        // Pilot Qualifications
        part107Certified: true,
        part107Number,
        licenseExpiryDate: new Date(part107ExpiryDate),
        thermalExperienceYears: parseInt(thermalExperienceYears),
        totalFlightHours: parseInt(totalFlightHours.split('-')[0]) || 0, // Extract first number from range
        
        // Equipment Information
        droneModels,
        thermalCameraModels,
        
        // Insurance Information
        hasInsurance,
        insuranceProvider: insuranceProvider || null,
        insurancePolicyNumber: insurancePolicyNumber || null,
        insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
        liabilityCoverage: liabilityCoverage ? parseInt(liabilityCoverage) : null,
        
        // Geographic Coverage
        serviceStates,
        maxTravelDistance: maxTravelDistance === 'nationwide' ? 99999 : parseInt(maxTravelDistance),
        
        // Platform Status
        status: 'pending', // Will be reviewed by admin
        
        // Application Information
        applicationNotes,
        
        // Initialize metrics
        completedJobs: 0,
        totalEarnings: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Pilot registration submitted successfully",
      user: {
        id: prismaUser.id,
        email: prismaUser.email,
        name: prismaUser.name
      },
      pilotProfile: {
        id: pilotProfile[0].id,
        status: pilotProfile[0].status
      }
    });

  } catch (error) {
    console.error("Pilot registration error:", error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}