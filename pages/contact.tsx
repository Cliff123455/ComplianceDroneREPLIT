// ComplianceDrone Contact/Quote Request Page
// Professional contact form for service inquiries and quotes

import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { validateEmail, validatePhone } from "../lib/authUtils";

interface ContactForm {
  // Company Information
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  
  // Service Details
  serviceType: 'thermal_inspection' | 'solar_panel_inspection' | 'electrical_inspection' | 'construction_monitoring' | 'other';
  projectLocation: string;
  projectSize: string;
  urgency: 'asap' | 'within_week' | 'within_month' | 'flexible';
  
  // Budget and Requirements
  budgetRange: 'under_5k' | '5k_15k' | '15k_50k' | '50k_plus' | 'discuss';
  projectDescription: string;
  specificRequirements: string;
}

const initialForm: ContactForm = {
  companyName: '',
  contactName: '',
  email: '',
  phoneNumber: '',
  serviceType: 'thermal_inspection',
  projectLocation: '',
  projectSize: '',
  urgency: 'flexible',
  budgetRange: 'discuss',
  projectDescription: '',
  specificRequirements: ''
};

const SERVICE_TYPES = [
  { value: 'thermal_inspection', label: 'Thermal Inspection' },
  { value: 'solar_panel_inspection', label: 'Solar Panel Inspection' },
  { value: 'electrical_inspection', label: 'Electrical Infrastructure Inspection' },
  { value: 'construction_monitoring', label: 'Construction Site Monitoring' },
  { value: 'other', label: 'Other Services' }
];

const URGENCY_OPTIONS = [
  { value: 'asap', label: 'ASAP (Within 48 hours)' },
  { value: 'within_week', label: 'Within a week' },
  { value: 'within_month', label: 'Within a month' },
  { value: 'flexible', label: 'Flexible timeline' }
];

const BUDGET_RANGES = [
  { value: 'under_5k', label: 'Under $5,000' },
  { value: '5k_15k', label: '$5,000 - $15,000' },
  { value: '15k_50k', label: '$15,000 - $50,000' },
  { value: '50k_plus', label: '$50,000+' },
  { value: 'discuss', label: 'Prefer to discuss' }
];

const Contact: NextPage = () => {
  const [formData, setFormData] = useState<ContactForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.contactName.trim()) newErrors.contactName = "Contact name is required";
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;

    if (!formData.projectLocation.trim()) newErrors.projectLocation = "Project location is required";
    if (!formData.projectDescription.trim()) newErrors.projectDescription = "Project description is required";

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
      // For now, we'll just simulate a successful submission
      // In production, this would send to a backend API
      setTimeout(() => {
        setSubmitSuccess(true);
      }, 1500);
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <>
        <Head>
          <title>Quote Request Submitted - ComplianceDrone</title>
        </Head>

        {/* Header */}
        <header className="gradient-bg text-white">
          <div className="cd-container">
            <nav className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-3">
                <Image 
                  src="/compliance-drone-shield-logo.png" 
                  alt="ComplianceDrone Logo" 
                  width={50} 
                  height={50}
                  priority
                  className="rounded-lg"
                />
                <h1 className="text-2xl font-bold">ComplianceDrone</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/" className="hover:text-gray-200 transition-colors">
                  Home
                </Link>
              </div>
            </nav>
          </div>
        </header>

        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your interest in ComplianceDrone services. Our team will review your requirements and contact you within 24 hours with a detailed quote.
            </p>
            <div className="space-y-3">
              <Link href="/" className="btn-primary block">
                Return to Home
              </Link>
              <Link href="/contact" className="btn-secondary block">
                Submit Another Request
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Request a Quote - ComplianceDrone</title>
        <meta name="description" content="Get a professional quote for thermal inspection and aerial construction management services from ComplianceDrone" />
        <meta name="keywords" content="thermal inspection quote, drone services pricing, aerial construction management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="gradient-bg text-white">
        <div className="cd-container">
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <Image 
                src="/compliance-drone-shield-logo.png" 
                alt="ComplianceDrone Logo" 
                width={50} 
                height={50}
                priority
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold">ComplianceDrone</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:text-gray-200 transition-colors">
                Home
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="cd-container max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gradient mb-4">
              Request a Professional Quote
            </h2>
            <p className="text-xl text-gray-600">
              Get a customized quote for your thermal inspection and aerial construction management needs
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Contact Information */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Contact Information
              </h3>
              <div className="cd-grid cd-grid-2 gap-6">
                <div>
                  <label className="form-label">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.contactName ? 'border-red-300' : ''}`}
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                  {errors.contactName && <p className="form-error">{errors.contactName}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.companyName ? 'border-red-300' : ''}`}
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your company name"
                    required
                  />
                  {errors.companyName && <p className="form-error">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'border-red-300' : ''}`}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@company.com"
                    required
                  />
                  {errors.email && <p className="form-error">{errors.email}</p>}
                </div>

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
              </div>
            </section>

            {/* Service Requirements */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Service Requirements
              </h3>
              
              <div className="cd-grid cd-grid-2 gap-6 mb-6">
                <div>
                  <label className="form-label">
                    Service Type *
                  </label>
                  <select
                    className="form-input"
                    value={formData.serviceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value as any }))}
                    required
                  >
                    {SERVICE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">
                    Timeline *
                  </label>
                  <select
                    className="form-input"
                    value={formData.urgency}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                    required
                  >
                    {URGENCY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">
                    Project Location *
                  </label>
                  <input
                    type="text"
                    className={`form-input ${errors.projectLocation ? 'border-red-300' : ''}`}
                    value={formData.projectLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectLocation: e.target.value }))}
                    placeholder="City, State"
                    required
                  />
                  {errors.projectLocation && <p className="form-error">{errors.projectLocation}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Budget Range
                  </label>
                  <select
                    className="form-input"
                    value={formData.budgetRange}
                    onChange={(e) => setFormData(prev => ({ ...prev, budgetRange: e.target.value as any }))}
                  >
                    {BUDGET_RANGES.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>

                <div className="cd-grid-span-2">
                  <label className="form-label">
                    Project Size/Scope
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.projectSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectSize: e.target.value }))}
                    placeholder="e.g., 500 MW solar farm, 10-story building, 50-acre site"
                  />
                </div>
              </div>
            </section>

            {/* Project Details */}
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                Project Details
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="form-label">
                    Project Description *
                  </label>
                  <textarea
                    className={`form-textarea ${errors.projectDescription ? 'border-red-300' : ''}`}
                    rows={4}
                    value={formData.projectDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                    placeholder="Please describe your project, the issues you're facing, and what you hope to achieve with our services..."
                    required
                  />
                  {errors.projectDescription && <p className="form-error">{errors.projectDescription}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Specific Requirements or Concerns
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.specificRequirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, specificRequirements: e.target.value }))}
                    placeholder="Any specific technical requirements, safety concerns, or compliance needs..."
                  />
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn-primary-large ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Submitting Quote Request...' : 'Request Quote'}
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Our team will review your requirements and contact you within 24 hours
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Contact;