"use client";
import axios from "axios";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";
import { integrations, messages } from "../../../../integrations.config";
import z from "zod";
import {
  droneModels,
  thermalCameraModels,
  businessTypes,
  statesAndTerritories,
  insuranceProviders,
  experienceLevels,
  flightHoursRanges,
  maxTravelDistances
} from "@/data/pilotEquipmentData";

// Comprehensive validation schema for pilot registration
const PilotRegistrationSchema = z.object({
  // Basic user info
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine((val) => /\d/.test(val), {
      message: "Password must contain at least one number",
    }),
  
  // Professional info
  phoneNumber: z.string().min(10, "Please enter a valid phone number"),
  companyName: z.string().optional(),
  businessType: z.string().min(1, "Please select a business type"),
  
  // Address
  address: z.string().min(5, "Please enter your full address"),
  city: z.string().min(2, "Please enter your city"),
  state: z.string().min(2, "Please select your state"),
  zipCode: z.string().min(5, "Please enter a valid ZIP code"),
  
  // Certifications
  part107Number: z.string().min(1, "Part 107 certificate number is required"),
  part107ExpiryDate: z.string().min(1, "Please enter your Part 107 expiry date"),
  thermalExperienceYears: z.string().min(1, "Please select your experience level"),
  totalFlightHours: z.string().min(1, "Please select your total flight hours"),
  
  // Equipment
  droneModels: z.array(z.string()).min(1, "Please select at least one drone model"),
  thermalCameraModels: z.array(z.string()).min(1, "Please select at least one thermal camera"),
  
  // Insurance
  hasInsurance: z.boolean(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceExpiryDate: z.string().optional(),
  liabilityCoverage: z.string().optional(),
  
  // Service Area
  maxTravelDistance: z.string().min(1, "Please select your travel distance"),
  serviceStates: z.array(z.string()).min(1, "Please select at least one service state"),
  
  // Application notes
  applicationNotes: z.string().min(50, "Please provide at least 50 characters about your experience")
}).refine((data) => {
  if (data.hasInsurance) {
    return (
      data.insuranceProvider && 
      data.insurancePolicyNumber && 
      data.insuranceExpiryDate && 
      data.liabilityCoverage
    );
  }
  return true;
}, {
  message: "Insurance details are required when you have insurance",
  path: ["insuranceProvider"]
});

const PilotRegistration = () => {
  const [formData, setFormData] = useState({
    // Basic info
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    companyName: "",
    businessType: "",
    
    // Address
    address: "",
    city: "",
    state: "",
    zipCode: "",
    
    // Certifications
    part107Number: "",
    part107ExpiryDate: "",
    thermalExperienceYears: "",
    totalFlightHours: "",
    
    // Equipment
    droneModels: [] as string[],
    thermalCameraModels: [] as string[],
    
    // Insurance
    hasInsurance: true,
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceExpiryDate: "",
    liabilityCoverage: "",
    
    // Service Area
    maxTravelDistance: "",
    serviceStates: [] as string[],
    
    // Application notes
    applicationNotes: ""
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loader, setLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const totalSteps = 5;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof typeof prev] as string[]), value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.name && formData.email && formData.password && formData.phoneNumber);
      case 2:
        return !!(formData.businessType && formData.address && formData.city && formData.state && formData.zipCode);
      case 3:
        return !!(formData.part107Number && formData.part107ExpiryDate && formData.thermalExperienceYears && formData.totalFlightHours);
      case 4:
        return !!(formData.droneModels.length > 0 && formData.thermalCameraModels.length > 0);
      case 5:
        return !!(formData.maxTravelDistance && formData.serviceStates.length > 0 && formData.applicationNotes.length >= 50);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error("Please fill in all required fields before continuing");
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!integrations?.isAuthEnabled) {
      toast.error(messages.auth);
      return;
    }

    setLoader(true);

    const result = PilotRegistrationSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      setLoader(false);
      return;
    }

    try {
      await axios.post("/api/register-pilot", formData);
      toast.success("Pilot registration submitted successfully! We'll review your application within 48 hours.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        phoneNumber: "",
        companyName: "",
        businessType: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        part107Number: "",
        part107ExpiryDate: "",
        thermalExperienceYears: "",
        totalFlightHours: "",
        droneModels: [],
        thermalCameraModels: [],
        hasInsurance: true,
        insuranceProvider: "",
        insurancePolicyNumber: "",
        insuranceExpiryDate: "",
        liabilityCoverage: "",
        maxTravelDistance: "",
        serviceStates: [],
        applicationNotes: ""
      });
      setCurrentStep(1);
    } catch (error) {
      toast.error("Registration failed. Please check your information and try again.");
    } finally {
      setLoader(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="mb-6 text-xl font-semibold text-white">Basic Information</h3>
            
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 pl-14.5 pr-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value.toLowerCase())}
                className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 pl-14.5 pr-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
                required
              />
            </div>

            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password *"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 pl-14.5 pr-12 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </span>
              <input
                type="tel"
                placeholder="Phone Number *"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 pl-14.5 pr-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="mb-6 text-xl font-semibold text-white">Business Information</h3>
            
            <input
              type="text"
              placeholder="Company/Business Name (optional)"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
            />

            <select
              value={formData.businessType}
              onChange={(e) => handleInputChange("businessType", e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white outline-none focus:border-primary"
              required
            >
              <option value="" className="bg-gray-800">Business Type *</option>
              {businessTypes.map((type) => (
                <option key={type} value={type} className="bg-gray-800">
                  {type}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Street Address *"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <input
                type="text"
                placeholder="City *"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
                required
              />
              
              <select
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white outline-none focus:border-primary"
                required
              >
                <option value="" className="bg-gray-800">State *</option>
                {statesAndTerritories.map((state) => (
                  <option key={state} value={state} className="bg-gray-800">
                    {state}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="ZIP Code *"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="mb-6 text-xl font-semibold text-white">Certifications & Experience</h3>
            
            <input
              type="text"
              placeholder="Part 107 Certificate Number *"
              value={formData.part107Number}
              onChange={(e) => handleInputChange("part107Number", e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
              required
            />

            <input
              type="date"
              placeholder="Part 107 Expiry Date *"
              value={formData.part107ExpiryDate}
              onChange={(e) => handleInputChange("part107ExpiryDate", e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
              required
            />

            <select
              value={formData.thermalExperienceYears}
              onChange={(e) => handleInputChange("thermalExperienceYears", e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white outline-none focus:border-primary"
              required
            >
              <option value="" className="bg-gray-800">Thermal Imaging Experience *</option>
              {experienceLevels.map((level) => (
                <option key={level.value} value={level.value} className="bg-gray-800">
                  {level.label}
                </option>
              ))}
            </select>

            <select
              value={formData.totalFlightHours}
              onChange={(e) => handleInputChange("totalFlightHours", e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white outline-none focus:border-primary"
              required
            >
              <option value="" className="bg-gray-800">Total Flight Hours *</option>
              {flightHoursRanges.map((range) => (
                <option key={range.value} value={range.value} className="bg-gray-800">
                  {range.label}
                </option>
              ))}
            </select>

            <div className="mt-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.hasInsurance}
                  onChange={(e) => handleInputChange("hasInsurance", e.target.checked)}
                  className="h-4 w-4 rounded border-white/[0.12] bg-transparent text-primary focus:ring-primary"
                />
                <span className="text-white">I have liability insurance</span>
              </label>
            </div>

            {formData.hasInsurance && (
              <div className="space-y-4 pl-7">
                <select
                  value={formData.insuranceProvider}
                  onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white outline-none focus:border-primary"
                  required
                >
                  <option value="" className="bg-gray-800">Insurance Provider *</option>
                  {insuranceProviders.map((provider) => (
                    <option key={provider} value={provider} className="bg-gray-800">
                      {provider}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Policy Number *"
                  value={formData.insurancePolicyNumber}
                  onChange={(e) => handleInputChange("insurancePolicyNumber", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
                  required
                />

                <input
                  type="date"
                  placeholder="Insurance Expiry Date *"
                  value={formData.insuranceExpiryDate}
                  onChange={(e) => handleInputChange("insuranceExpiryDate", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary"
                  required
                />

                <select
                  value={formData.liabilityCoverage}
                  onChange={(e) => handleInputChange("liabilityCoverage", e.target.value)}
                  className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white outline-none focus:border-primary"
                  required
                >
                  <option value="" className="bg-gray-800">Liability Coverage Amount *</option>
                  <option value="1000000" className="bg-gray-800">$1,000,000</option>
                  <option value="2000000" className="bg-gray-800">$2,000,000</option>
                  <option value="5000000" className="bg-gray-800">$5,000,000</option>
                  <option value="10000000" className="bg-gray-800">$10,000,000+</option>
                </select>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="mb-6 text-xl font-semibold text-white">Equipment</h3>
            
            <div>
              <h4 className="mb-3 text-lg font-medium text-white">Drone Models *</h4>
              <p className="mb-3 text-sm text-gray-400">Select all drone models you own or operate</p>
              <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-white/[0.12] p-4">
                {droneModels.map((drone) => (
                  <label key={drone} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.droneModels.includes(drone)}
                      onChange={(e) => handleArrayChange("droneModels", drone, e.target.checked)}
                      className="h-4 w-4 rounded border-white/[0.12] bg-transparent text-primary focus:ring-primary"
                    />
                    <span className="text-white text-sm">{drone}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium text-white">Thermal Camera Models *</h4>
              <p className="mb-3 text-sm text-gray-400">Select all thermal cameras you own or have access to</p>
              <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-white/[0.12] p-4">
                {thermalCameraModels.map((camera) => (
                  <label key={camera} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.thermalCameraModels.includes(camera)}
                      onChange={(e) => handleArrayChange("thermalCameraModels", camera, e.target.checked)}
                      className="h-4 w-4 rounded border-white/[0.12] bg-transparent text-primary focus:ring-primary"
                    />
                    <span className="text-white text-sm">{camera}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="mb-6 text-xl font-semibold text-white">Service Area & Application</h3>
            
            <select
              value={formData.maxTravelDistance}
              onChange={(e) => handleInputChange("maxTravelDistance", e.target.value)}
              className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white outline-none focus:border-primary"
              required
            >
              <option value="" className="bg-gray-800">Maximum Travel Distance *</option>
              {maxTravelDistances.map((distance) => (
                <option key={distance.value} value={distance.value} className="bg-gray-800">
                  {distance.label}
                </option>
              ))}
            </select>

            <div>
              <h4 className="mb-3 text-lg font-medium text-white">Service States *</h4>
              <p className="mb-3 text-sm text-gray-400">Select all states where you can provide services</p>
              <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-white/[0.12] p-4">
                {statesAndTerritories.map((state) => (
                  <label key={state} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.serviceStates.includes(state)}
                      onChange={(e) => handleArrayChange("serviceStates", state, e.target.checked)}
                      className="h-4 w-4 rounded border-white/[0.12] bg-transparent text-primary focus:ring-primary"
                    />
                    <span className="text-white text-sm">{state}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-lg font-medium text-white">
                Tell us about your experience *
              </label>
              <p className="mb-3 text-sm text-gray-400">
                Describe your experience with thermal imaging, drone operations, or relevant technical background (minimum 50 characters)
              </p>
              <textarea
                rows={6}
                placeholder="Please describe your relevant experience, previous thermal inspection work, technical background, or why you're interested in joining our pilot network..."
                value={formData.applicationNotes}
                onChange={(e) => handleInputChange("applicationNotes", e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-transparent py-3.5 px-4 font-medium text-white placeholder-gray-400 outline-none focus:border-primary resize-none"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                {formData.applicationNotes.length}/50 characters minimum
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <section className="pb-17.5 pt-17.5 lg:pb-22.5 xl:pb-27.5">
        <div className="mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0">
          <div className="wow fadeInUp rounded-3xl bg-white/[0.05]">
            <div className="flex">
              <div className="hidden w-full lg:block lg:w-1/2">
                <div className="relative py-20 pl-17.5 pr-22">
                  <div className="absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-white/0 via-white/20 to-white/0"></div>

                  <h2 className="mb-6 max-w-[292px] text-heading-4 font-bold text-white">
                    Join the ComplianceDrone Pilot Network
                  </h2>
                  <p className="mb-8 max-w-[350px] text-white/80">
                    Professional thermal inspection pilots earn competitive rates using cutting-edge drone technology.
                  </p>
                  
                  {/* Progress indicator */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                      {Array.from({ length: totalSteps }, (_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i + 1 <= currentStep ? 'bg-primary' : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-white/70">
                      Step {currentStep} of {totalSteps}
                    </p>
                  </div>

                  <div className="relative aspect-square w-full max-w-[300px]">
                    <Image 
                      src="/images/thermal-inspection-main.jpg" 
                      alt="Thermal inspection" 
                      fill 
                      className="rounded-lg object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="py-8 pl-8 pr-8 sm:py-20 sm:pl-21 sm:pr-20">
                  <form onSubmit={submitRegistration}>
                    {renderStep()}

                    <div className="mt-8 flex justify-between space-x-4">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
                        >
                          Previous
                        </button>
                      )}
                      
                      <div className="flex-1"></div>
                      
                      {currentStep < totalSteps ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="hero-button-gradient flex items-center justify-center rounded-lg px-6 py-3 font-medium text-white duration-300 ease-in hover:opacity-80"
                        >
                          Next Step
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={loader}
                          className="hero-button-gradient flex items-center justify-center rounded-lg px-6 py-3 font-medium text-white duration-300 ease-in hover:opacity-80 disabled:opacity-50"
                        >
                          Submit Application {loader && <Loader />}
                        </button>
                      )}
                    </div>
                  </form>

                  <p className="mt-6 text-center font-medium text-white">
                    Already have an account?{" "}
                    <Link href="/auth/signin" className="text-primary hover:underline">
                      Sign in Here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PilotRegistration;