// Authentication utilities for error handling and validation
// Based on NextAuth session handling

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message) || 
         error.message.includes('Unauthorized') ||
         (error as any)?.status === 401;
}

// Toast notification helper for unauthorized errors
export function handleUnauthorizedError(error: Error, showToast?: (message: { title: string; description: string; variant: string }) => void) {
  if (isUnauthorizedError(error)) {
    if (showToast) {
      showToast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
    }
    
    setTimeout(() => {
      window.location.href = "/auth/signin";
    }, 500);
    
    return true;
  }
  
  return false;
}

// Form validation utilities
export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return "Phone number is required";
  if (!/^\+?[\d\s\-\(\)\.]{10,}$/.test(phone)) return "Please enter a valid phone number";
  return null;
};

export const validatePart107 = (number: string): string | null => {
  if (!number) return "Part 107 certificate number is required";
  if (!/^\d{8,12}$/.test(number.replace(/\D/g, ''))) return "Please enter a valid Part 107 certificate number";
  return null;
};

// Status helpers
export const getPilotStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
    case 'active':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'inactive':
      return 'text-gray-600 bg-gray-100';
    case 'suspended':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getPilotStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Application Pending';
    case 'approved':
      return 'Approved';
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'suspended':
      return 'Suspended';
    default:
      return 'Unknown';
  }
};
