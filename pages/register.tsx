// ComplianceDrone Pilot Registration Page
// Professional registration form with comprehensive screening

import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { validateEmail, validatePhone, validatePart107 } from "../lib/authUtils";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

interface RegistrationForm {
  // Business Information
  companyName: string;
  businessType: 'individual' | 'llc' | 'corporation' | 'partnership';
  taxId: string;
  
  // Contact Information
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Pilot Qualifications
  part107Certified: boolean;
  part107Number: string;
  licenseExpiryDate: string;
  thermalExperienceYears: number;
  totalFlightHours: number;
  
  // Equipment
  droneModels: string[];
  thermalCameraModels: string[];
  additionalEquipment: string[];
  
  // Insurance
  hasInsurance: boolean;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiryDate: string;
  liabilityCoverage: number;
  
  // Service Area
  serviceAreaType: 'local' | 'nationwide';
  serviceRadius: number;
  isNationwide: boolean;
  
  // Application Notes
  applicationNotes: string;
}

const initialForm: RegistrationForm = {
  companyName: '',
  businessType: 'individual',
  taxId: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  part107Certified: false,
  part107Number: '',
  licenseExpiryDate: '',
  thermalExperienceYears: 0,
  totalFlightHours: 0,
  droneModels: [],
  thermalCameraModels: [],
  additionalEquipment: [],
  hasInsurance: false,
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insuranceExpiryDate: '',
  liabilityCoverage: 0,
  serviceAreaType: 'local',
  serviceRadius: 50,
  isNationwide: false,
  applicationNotes: ''
};

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY',
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const DRONE_MODELS = [
  'DJI Mavic 3 Enterprise',
  'DJI Mavic 3 Enterprise Thermal',
  'DJI Matrice 300 RTK',
  'DJI Matrice 30T',
  'DJI Air 3',
  'Autel EVO Max 4T',
  'FLIR Vue TZ20',
  'Skydio X2',
  'Other'
];

const THERMAL_CAMERAS = [
  'DJI Zenmuse H30',
  'DJI Zenmuse H20T',
  'DJI Zenmuse H20 Series',
  'DJI Zenmuse XT2',
  'FLIR Vue Pro R',
  'FLIR Duo Pro R',
  'FLIR XT2',
  'Teledyne FLIR Boson',
  'Workswell WIRIS Pro',
  'Other'
];

const ADDITIONAL_INVENTORY = [
  'RTK Base Station',
  'Extra Batteries',
  'Multi-battery Charging Hub',
  'Rugged Carrying Case',
  'iPad/Tablet Controller',
  'Backup Controller',
  'Memory Cards',
  'Calibration Equipment',
  'Other'
];

const TRAVEL_RADIUS_OPTIONS = [
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
  { value: 150, label: '150 miles' },
  { value: 200, label: '200 miles' },
  { value: 250, label: '250 miles' },
  { value: 300, label: '300 miles' },
];

const Register: NextPage = () => {
  const { user, isLoading, isAuthenticated, isPilot } = useAuth();
  const [formData, setFormData] = useState<RegistrationForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, isLoading]);

  // Redirect if already a pilot
  useEffect(() => {
    if (isPilot) {
      window.location.href = "/profile";
    }
  }, [isPilot]);

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Contact validation
    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;

    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.zipCode) newErrors.zipCode = "ZIP code is required";

    // Pilot qualifications
    if (formData.part107Certified) {
      const part107Error = validatePart107(formData.part107Number);
      if (part107Error) newErrors.part107Number = part107Error;
      
      if (!formData.licenseExpiryDate) {
        newErrors.licenseExpiryDate = "License expiry date is required";
      }
    }

    if (formData.thermalExperienceYears < 0) {
      newErrors.thermalExperienceYears = "Experience years cannot be negative";
    }

    if (formData.totalFlightHours < 0) {
      newErrors.totalFlightHours = "Flight hours cannot be negative";
    }

    // Equipment
    if (formData.droneModels.length === 0) {
      newErrors.droneModels = "Please select at least one drone model";
    }

    if (formData.thermalCameraModels.length === 0) {
      newErrors.thermalCameraModels = "Please select at least one thermal camera";
    }

    // Insurance
    if (formData.hasInsurance) {
      if (!formData.insuranceProvider) newErrors.insuranceProvider = "Insurance provider is required";
      if (!formData.insurancePolicyNumber) newErrors.insurancePolicyNumber = "Policy number is required";
      if (!formData.insuranceExpiryDate) newErrors.insuranceExpiryDate = "Insurance expiry date is required";
      if (formData.liabilityCoverage <= 0) newErrors.liabilityCoverage = "Liability coverage amount is required";
    }

    // Service area
    if (!formData.isNationwide && formData.serviceRadius <= 0) {
      newErrors.serviceRadius = "Service radius is required for local service";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-pilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          window.location.href = "/profile";
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiSelect = (field: keyof Pick<RegistrationForm, 'droneModels' | 'thermalCameraModels' | 'additionalEquipment'>, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceAreaChange = (isNationwide: boolean) => {
    setFormData(prev => ({
      ...prev,
      isNationwide,
      serviceAreaType: isNationwide ? 'nationwide' : 'local'
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">Thank you for applying to become a ComplianceDrone pilot.</p>
          <p className="text-sm text-gray-500">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Become a Pilot - ComplianceDrone</title>
        <meta name="description" content="Apply to become a certified thermal inspection pilot with ComplianceDrone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="gradient-bg text-white">
        <div className="cd-container">
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <Image 
                src="/logo.png" 
                alt="ComplianceDrone Logo" 
                width={50} 
                height={50}
                priority
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold">ComplianceDrone</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Welcome, {user?.firstName || user?.email}</span>
              <Link href="/dashboard" className="hover:text-gray-200 transition-colors">
                Dashboard
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="cd-container max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gradient mb-4">
              Become a Certified Pilot
            </h2>
            <p className="text-xl text-gray-600">
              Join our network of professional thermal inspection pilots
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Business Information */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Business Information
              </h3>
              <div className="cd-grid cd-grid-2 gap-6">
                <div>
                  <label className="form-label">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Business Type *
                  </label>
                  <select
                    className="form-input"
                    value={formData.businessType}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value as any }))}
                    required
                  >
                    <option value="individual">Individual</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                  </select>
                </div>

                <div className="cd-grid-span-2">
                  <label className="form-label">
                    Tax ID (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.taxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    placeholder="Federal Tax ID or SSN"
                  />
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Contact Information
              </h3>
              <div className="cd-grid cd-grid-2 gap-6">
                <div>
                  <label className="form-label">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className={`form-input ${errors.phoneNumber ? 'border-red-300' : ''}`}
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="(555) 123-4567"
                    required
                  />
                  {errors.phoneNumber && <p className="form-error">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label className="form-label">
                    State *
                  </label>
                  <select
                    className={`form-input ${errors.state ? 'border-red-300' : ''}`}
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    required
                  >
                    <option value="">Select State</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && <p className="form-error">{errors.state}</p>}
                </div>

                <div className="cd-grid-span-2">
                  <label className="form-label">
                    Address *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.address ? 'border-red-300' : ''}`}
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address"
                    required
                  />
                  {errors.address && <p className="form-error">{errors.address}</p>}
                </div>

                <div>
                  <label className="form-label">
                    City *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.city ? 'border-red-300' : ''}`}
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    required
                  />
                  {errors.city && <p className="form-error">{errors.city}</p>}
                </div>

                <div>
                  <label className="form-label">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.zipCode ? 'border-red-300' : ''}`}
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="12345"
                    required
                  />
                  {errors.zipCode && <p className="form-error">{errors.zipCode}</p>}
                </div>
              </div>
            </section>

            {/* Pilot Qualifications */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Pilot Qualifications
              </h3>
              
              <div className="mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.part107Certified}
                    onChange={(e) => setFormData(prev => ({ ...prev, part107Certified: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span className="form-label mb-0">I hold a valid Part 107 Remote Pilot Certificate</span>
                </label>
              </div>

              {formData.part107Certified && (
                <div className="cd-grid cd-grid-2 gap-6 mb-6">
                  <div>
                    <label className="form-label">
                      Part 107 Certificate Number *
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.part107Number ? 'border-red-300' : ''}`}
                      value={formData.part107Number}
                      onChange={(e) => setFormData(prev => ({ ...prev, part107Number: e.target.value }))}
                      placeholder="Certificate number"
                      required
                    />
                    {errors.part107Number && <p className="form-error">{errors.part107Number}</p>}
                  </div>

                  <div>
                    <label className="form-label">
                      License Expiry Date *
                    </label>
                    <input
                      type="date"
                      className={`form-input ${errors.licenseExpiryDate ? 'border-red-300' : ''}`}
                      value={formData.licenseExpiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseExpiryDate: e.target.value }))}
                      required
                    />
                    {errors.licenseExpiryDate && <p className="form-error">{errors.licenseExpiryDate}</p>}
                  </div>
                </div>
              )}

              <div className="cd-grid cd-grid-2 gap-6">
                <div>
                  <label className="form-label">
                    Thermal Inspection Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`form-input ${errors.thermalExperienceYears ? 'border-red-300' : ''}`}
                    value={formData.thermalExperienceYears}
                    onChange={(e) => setFormData(prev => ({ ...prev, thermalExperienceYears: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                  {errors.thermalExperienceYears && <p className="form-error">{errors.thermalExperienceYears}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Total Flight Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={`form-input ${errors.totalFlightHours ? 'border-red-300' : ''}`}
                    value={formData.totalFlightHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalFlightHours: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                  {errors.totalFlightHours && <p className="form-error">{errors.totalFlightHours}</p>}
                </div>
              </div>
            </section>

            {/* Equipment */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Equipment & Inventory
              </h3>
              
              <div className="cd-grid cd-grid-2 gap-6">
                <div>
                  <FormControl fullWidth error={!!errors.droneModels}>
                    <InputLabel>Drone Models *</InputLabel>
                    <Select<string[]>
                      multiple
                      value={formData.droneModels}
                      onChange={(e: SelectChangeEvent<string[]>) => {
                        const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                        handleMultiSelect('droneModels', value);
                      }}
                      input={<OutlinedInput label="Drone Models *" />}
                      renderValue={(selected: string[]) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        },
                      }}
                    >
                      {DRONE_MODELS.map((model) => (
                        <MenuItem key={model} value={model}>
                          {model}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.droneModels && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.droneModels}
                      </Typography>
                    )}
                  </FormControl>
                </div>

                <div>
                  <FormControl fullWidth error={!!errors.thermalCameraModels}>
                    <InputLabel>Thermal Camera Equipment *</InputLabel>
                    <Select<string[]>
                      multiple
                      value={formData.thermalCameraModels}
                      onChange={(e: SelectChangeEvent<string[]>) => {
                        const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                        handleMultiSelect('thermalCameraModels', value);
                      }}
                      input={<OutlinedInput label="Thermal Camera Equipment *" />}
                      renderValue={(selected: string[]) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        },
                      }}
                    >
                      {THERMAL_CAMERAS.map((camera) => (
                        <MenuItem key={camera} value={camera}>
                          {camera}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.thermalCameraModels && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.thermalCameraModels}
                      </Typography>
                    )}
                  </FormControl>
                </div>
              </div>
              
              <div className="mt-6">
                <FormControl fullWidth>
                  <InputLabel>Additional Equipment</InputLabel>
                  <Select<string[]>
                    multiple
                    value={formData.additionalEquipment}
                    onChange={(e: SelectChangeEvent<string[]>) => {
                      const value = typeof e.target.value === 'string' ? [e.target.value] : e.target.value;
                      handleMultiSelect('additionalEquipment', value);
                    }}
                    input={<OutlinedInput label="Additional Equipment" />}
                    renderValue={(selected: string[]) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
                    }}
                  >
                    {ADDITIONAL_INVENTORY.map((equipment) => (
                      <MenuItem key={equipment} value={equipment}>
                        {equipment}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, ml: 1.75 }}>
                    Select any additional equipment you have available
                  </Typography>
                </FormControl>
              </div>
            </section>

            {/* Insurance Information */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Insurance Information
              </h3>
              
              <div className="mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.hasInsurance}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasInsurance: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span className="form-label mb-0">I have drone liability insurance</span>
                </label>
              </div>

              {formData.hasInsurance && (
                <div className="cd-grid cd-grid-2 gap-6">
                  <div>
                    <label className="form-label">
                      Insurance Provider *
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.insuranceProvider ? 'border-red-300' : ''}`}
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
                      placeholder="Insurance company name"
                      required
                    />
                    {errors.insuranceProvider && <p className="form-error">{errors.insuranceProvider}</p>}
                  </div>

                  <div>
                    <label className="form-label">
                      Policy Number *
                    </label>
                    <input
                      type="text"
                      className={`form-input ${errors.insurancePolicyNumber ? 'border-red-300' : ''}`}
                      value={formData.insurancePolicyNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))}
                      placeholder="Policy number"
                      required
                    />
                    {errors.insurancePolicyNumber && <p className="form-error">{errors.insurancePolicyNumber}</p>}
                  </div>

                  <div>
                    <label className="form-label">
                      Insurance Expiry Date *
                    </label>
                    <input
                      type="date"
                      className={`form-input ${errors.insuranceExpiryDate ? 'border-red-300' : ''}`}
                      value={formData.insuranceExpiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceExpiryDate: e.target.value }))}
                      required
                    />
                    {errors.insuranceExpiryDate && <p className="form-error">{errors.insuranceExpiryDate}</p>}
                  </div>

                  <div>
                    <label className="form-label">
                      Liability Coverage (USD) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className={`form-input ${errors.liabilityCoverage ? 'border-red-300' : ''}`}
                      value={formData.liabilityCoverage}
                      onChange={(e) => setFormData(prev => ({ ...prev, liabilityCoverage: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g., 1000000"
                      required
                    />
                    {errors.liabilityCoverage && <p className="form-error">{errors.liabilityCoverage}</p>}
                  </div>
                </div>
              )}
            </section>

            {/* Service Area */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Service Coverage Area
              </h3>
              
              <div className="mb-6">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isNationwide}
                      onChange={(e) => handleServiceAreaChange(e.target.checked)}
                      sx={{
                        color: 'var(--compliance-orange)',
                        '&.Mui-checked': {
                          color: 'var(--compliance-orange)',
                        },
                      }}
                    />
                  }
                  label={<Typography variant="body1" fontWeight={600}>I offer nationwide service</Typography>}
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1 }}>
                  Check this if you're willing to travel anywhere in the US for jobs
                </Typography>
              </div>

              {!formData.isNationwide && (
                <div className="cd-grid cd-grid-2 gap-6">
                  <div>
                    <label className="form-label">
                      Service Area Address *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Your primary service area location"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter the city/area you primarily serve from
                    </p>
                  </div>

                  <div>
                    <FormControl fullWidth error={!!errors.serviceRadius}>
                      <InputLabel>Travel Radius *</InputLabel>
                      <Select
                        value={formData.serviceRadius.toString()}
                        onChange={(e) => setFormData(prev => ({ ...prev, serviceRadius: parseInt(e.target.value) }))}
                        label="Travel Radius *"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                          },
                        }}
                      >
                        {TRAVEL_RADIUS_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.serviceRadius && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.serviceRadius}
                        </Typography>
                      )}
                    </FormControl>
                  </div>
                </div>
              )}
            </section>

            {/* Application Essay */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Tell Us About Yourself
              </h3>
              
              <div>
                <label className="form-label">
                  Why do you want to become a ComplianceDrone pilot? What relevant experience do you have?
                </label>
                <textarea
                  rows={6}
                  className="form-input resize-none"
                  value={formData.applicationNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, applicationNotes: e.target.value }))}
                  placeholder="Share your background in thermal inspection, drone operations, or relevant field experience. What makes you a good fit for professional thermal inspection work?"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This helps us understand your qualifications and commitment to quality thermal inspection services.
                </p>
              </div>
            </section>

            {/* Submit */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting Application...</span>
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Your application will be reviewed within 2-3 business days.
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Register;