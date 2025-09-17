import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload,
} from '@mui/icons-material';
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Select,
  MenuItem,
  InputLabel,
  LinearProgress,
  Card,
  CardContent,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const steps = [
  'Personal Information',
  'Licensing & Certification',
  'Equipment',
  'Work Experience & Insurance',
  'Review & Submit',
];

function PilotRegistration() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [equipmentDialogs, setEquipmentDialogs] = useState({
    droneModels: false,
    cameraEquipment: false,
    additionalInventory: false,
    additionalCertifications: false,
    customSoftware: false,
  });
  const [customEquipment, setCustomEquipment] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customSoftwareDescription, setCustomSoftwareDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [emailValidationError, setEmailValidationError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',

    // Licensing & Certification
    part107License: '',
    licenseNumber: '',
    licenseIssueDate: '',
    licenseExpiration: '',
    recurrentCertNumber: '',
    willGetRecurrentBeforeFlying: false,
    part61License: '',
    part137License: '',
    mqOperator: false,
    additionalCertifications: [],

    // Email verification
    emailVerified: false,
    verificationCode: '',

    // Experience & Equipment
    yearsExperience: '',
    totalFlightHours: '',
    commercialHours: '',
    droneModels: [],
    cameraEquipment: [],
    additionalInventory: [],
    softwareExperience: [],
    softwareLicenses: [],
    imageProcessingApproach: '',
    customSoftwareDescription: '',

    // Military & Insurance
    militaryService: '',
    militaryDroneOperator: false,
    insuranceCoverage: [],

    // Work Experience & Documents
    workExperience: '',
    uploadedDocuments: [],

    // Availability & Services
    availabilityType: '',
    serviceRadius: '',
    servicesOffered: [],
    rateStructure: '',

    // Additional
    backgroundCheck: false,
    termsAccepted: false,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Email validation
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setEmailValidationError('Please enter a valid email address');
      } else {
        setEmailValidationError('');
        // Send verification email if email is valid and changed
        if (value && emailRegex.test(value) && value !== formData.email) {
          sendVerificationEmail(value);
        }
      }
    }
  };

  const sendVerificationEmail = async email => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setVerificationSent(true);
      }
    } catch (error) {
      // Verification email failed silently
    }
  };

  const verifyEmail = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
        }),
      });

      if (response.ok) {
        setFormData(prev => ({ ...prev, emailVerified: true }));
        setVerificationSent(false);
      } else {
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      alert('Verification failed. Please try again.');
    }
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter(item => item !== value),
    }));
  };

  // File upload handler
  const handleFileUpload = (event, fileType = 'document') => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      name: file.name,
      size: file.size,
      type: fileType,
      mimeType: file.type,
      file: file,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setFormData(prev => ({
      ...prev,
      uploadedDocuments: [...prev.uploadedDocuments, ...newFiles.map(f => f.name)],
    }));
  };

  const removeFile = fileName => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
    setFormData(prev => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.filter(name => name !== fileName),
    }));
  };

  // Equipment management functions
  const addEquipment = (field, equipment, quantity = 1) => {
    if (equipment) {
      const equipmentWithQuantity = `${equipment} (${quantity})`;
      const existingIndex = formData[field].findIndex(item => item.startsWith(equipment));

      if (existingIndex >= 0) {
        // Update existing equipment quantity
        setFormData(prev => ({
          ...prev,
          [field]: prev[field].map((item, index) =>
            index === existingIndex ? equipmentWithQuantity : item
          ),
        }));
      } else {
        // Add new equipment
        setFormData(prev => ({
          ...prev,
          [field]: [...prev[field], equipmentWithQuantity],
        }));
      }
    }
  };

  const removeEquipment = (field, equipment) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => !item.startsWith(equipment)),
    }));
  };

  const handleCustomEquipment = async (field, customEquipment) => {
    // Notify backend about new equipment suggestion (equipment already added in handleAddFromDialog)
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/equipment-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field,
          equipment: customEquipment,
          timestamp: new Date().toISOString(),
          userEmail: formData.email,
        }),
      });
    } catch (error) {
      // Equipment suggestion notification failed - silent fail
    }
  };

  // Equipment options
  const droneOptions = [
    'DJI Mavic 3 Enterprise',
    'DJI Mavic 2 Enterprise',
    'DJI Air 2S',
    'DJI Mini 3 Pro',
    'DJI Phantom 4 Pro',
    'DJI Matrice 300 RTK',
    'DJI Matrice 350 RTK',
    'DJI Matrice 30/30T',
    'DJI Inspire 2',
    'Autel EVO II Pro',
    'Parrot Anafi',
    'Skydio 2+',
    'Freefly Alta X',
  ];

  const cameraOptions = [
    {
      name: 'Zenmuse H30 Series',
      description:
        'Enhanced night vision and infrared performance, suitable for multi-scenario operations',
    },
    {
      name: 'Zenmuse H20 Series',
      description: 'Multi-sensor payloads with RGB, thermal, and laser rangefinder capabilities',
    },
    { name: 'Zenmuse H20T', description: 'Thermal imaging payload with RGB and thermal sensors' },
    {
      name: 'Zenmuse H20N',
      description: 'Integrates starlight sensors for enhanced night vision capabilities',
    },
    {
      name: 'Zenmuse P1',
      description:
        'Full-frame sensor with interchangeable lenses, ideal for photogrammetry missions',
    },
    {
      name: 'Zenmuse L2',
      description:
        'LiDAR sensor with frame LiDAR, high-accuracy IMU, and 4/3 CMOS RGB mapping camera',
    },
    {
      name: 'Zenmuse S1',
      description:
        'Versatile sensor for various lighting conditions, offering brightness and energy efficiency',
    },
    {
      name: 'FLIR XT2',
      description: 'Dual thermal and RGB sensor for professional thermal imaging',
    },
    {
      name: 'FLIR Z20',
      description: 'High-resolution thermal imaging camera for detailed heat analysis',
    },
  ];

  const additionalInventoryOptions = [
    'GNSS Mobile Station (DJI RTK, DJI RTK 2, DJI RTK 3, Reach RS2, Reach RS3, etc.)',
    'Ground Control Points (GCPs)',
    "GPS-GCPs Propeller's AeroPoints",
    'Extra Batteries (TB60s, TB65s, BS60s, etc.)',
    'Charging Hub',
    'DJI Dock 2 (with Matrice 3D)',
    'DJI Dock 3 (with Matrice 4T)',
  ];

  const openEquipmentDialog = field => {
    setEquipmentDialogs(prev => ({ ...prev, [field]: true }));
  };

  const closeEquipmentDialog = field => {
    setEquipmentDialogs(prev => ({ ...prev, [field]: false }));
    setCustomEquipment('');
    setSelectedQuantity(1);
  };

  const handleAddFromDialog = (field, selectedEquipment) => {
    if (selectedEquipment === 'custom') {
      if (customEquipment.trim()) {
        addEquipment(field, customEquipment.trim(), selectedQuantity);
        handleCustomEquipment(field, customEquipment.trim());
        setCustomEquipment('');
        closeEquipmentDialog(field);
      }
    } else {
      addEquipment(field, selectedEquipment, selectedQuantity);
      closeEquipmentDialog(field);
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pilot-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `Registration submitted successfully! We will review your application and contact you soon. Reference ID: ${result.pilot_id}`
        );
        navigate('/');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Network error: ${error.message}`);
    }
  };

  const renderStepContent = step => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ space: 2 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={e => handleInputChange('firstName', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                required
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                required
                fullWidth
                error={!!emailValidationError}
                helperText={emailValidationError}
                InputProps={{
                  endAdornment: formData.emailVerified ? (
                    <CheckCircle sx={{ color: 'green' }} />
                  ) : null,
                }}
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                required
                fullWidth
              />
            </Box>

            {/* Email Verification Section */}
            {verificationSent && !formData.emailVerified && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Verification code sent to {formData.email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    label="Verification Code"
                    value={formData.verificationCode}
                    onChange={e => handleInputChange('verificationCode', e.target.value)}
                    size="small"
                    sx={{ width: 150 }}
                  />
                  <Button
                    onClick={verifyEmail}
                    variant="contained"
                    size="small"
                    disabled={!formData.verificationCode}
                  >
                    Verify
                  </Button>
                </Box>
              </Alert>
            )}

            {formData.emailVerified && (
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ Email verified successfully!
              </Alert>
            )}
            <TextField
              label="Address"
              value={formData.address}
              onChange={e => handleInputChange('address', e.target.value)}
              required
              fullWidth
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2 }}>
              <TextField
                label="City"
                value={formData.city}
                onChange={e => handleInputChange('city', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="State"
                value={formData.state}
                onChange={e => handleInputChange('state', e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="ZIP Code"
                value={formData.zipCode}
                onChange={e => handleInputChange('zipCode', e.target.value)}
                required
                fullWidth
              />
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Licensing & Certification
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">
                Do you have a current Part 107 Remote Pilot License?
              </FormLabel>
              <RadioGroup
                value={formData.part107License}
                onChange={e => handleInputChange('part107License', e.target.value)}
              >
                <FormControlLabel
                  value="yes"
                  control={<Radio />}
                  label="Yes, I have a current Part 107 license"
                />
                <FormControlLabel
                  value="no"
                  control={<Radio />}
                  label="No, I don't have Part 107"
                />
              </RadioGroup>
            </FormControl>

            {formData.part107License === 'yes' && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="Part 107 License Number"
                    value={formData.licenseNumber}
                    onChange={e => handleInputChange('licenseNumber', e.target.value)}
                    required
                  />
                  <TextField
                    label="License Issue Date"
                    type="date"
                    value={formData.licenseIssueDate}
                    onChange={e => handleInputChange('licenseIssueDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Box>

                {/* Recurrent Training Reminder */}
                {formData.licenseIssueDate &&
                  (() => {
                    const issueDate = new Date(formData.licenseIssueDate);
                    const twoYearsAgo = new Date();
                    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                    const needsRecurrent = issueDate <= twoYearsAgo;

                    return needsRecurrent ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Reminder:</strong> Certificate holders must complete the online
                          recurrent training every 24 calendar months. Complete the Part 107 Small
                          UAS Recurrent (ALC-677) online training course (no cost) at{' '}
                          <a
                            href="https://www.faasafety.gov/gslac/ALC/CourseLanding.aspx?cID=677"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1976d2', textDecoration: 'none' }}
                          >
                            faasafety.gov
                          </a>
                        </Typography>
                      </Alert>
                    ) : null;
                  })()}

                {/* File Upload for License */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload copy of License and recurrent certification (PDF):
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 1 }}
                  >
                    Upload License PDF
                    <input
                      type="file"
                      accept=".pdf"
                      hidden
                      onChange={e => handleFileUpload(e, 'license')}
                    />
                  </Button>
                  {uploadedFiles
                    .filter(f => f.type === 'license')
                    .map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => removeFile(file.name)}
                        deleteIcon={<DeleteIcon />}
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    ))}
                </Box>

                {/* Recurrent Certification Logic */}
                {formData.licenseIssueDate &&
                  (() => {
                    const issueDate = new Date(formData.licenseIssueDate);
                    const twoYearsAgo = new Date();
                    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                    const needsRecurrent = issueDate <= twoYearsAgo;

                    return needsRecurrent ? (
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          label="Recurrent Certification Number (if completed)"
                          value={formData.recurrentCertNumber}
                          onChange={e => handleInputChange('recurrentCertNumber', e.target.value)}
                          fullWidth
                          sx={{ mb: 2 }}
                          helperText="Enter your recurrent training certificate number if you have completed it"
                        />
                        {!formData.recurrentCertNumber && (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.willGetRecurrentBeforeFlying}
                                onChange={e =>
                                  handleInputChange(
                                    'willGetRecurrentBeforeFlying',
                                    e.target.checked
                                  )
                                }
                              />
                            }
                            label="I will complete recurrent training before flying commercially"
                          />
                        )}
                      </Box>
                    ) : null;
                  })()}
              </Box>
            )}

            {/* Other FAA Licenses */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Other FAA Licenses (Optional):
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Part 61 Pilot License</FormLabel>
                  <RadioGroup
                    value={formData.part61License}
                    onChange={e => handleInputChange('part61License', e.target.value)}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>

                <FormControl component="fieldset">
                  <FormLabel component="legend">Part 137 Agricultural License</FormLabel>
                  <RadioGroup
                    value={formData.part137License}
                    onChange={e => handleInputChange('part137License', e.target.value)}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              </Box>
            </Box>

            {/* MQ-1C Platform Operator Section */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.mqOperator}
                    onChange={e => handleInputChange('mqOperator', e.target.checked)}
                  />
                }
                label="MQ-1C platform operator with Part 107"
              />

              {formData.mqOperator && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">Please upload a copy of your military ID.</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{ mt: 1 }}
                    size="small"
                  >
                    Upload Military ID (PDF/Image)
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      hidden
                      onChange={e => handleFileUpload(e, 'military-id')}
                    />
                  </Button>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {uploadedFiles
                      .filter(f => f.type === 'military-id')
                      .map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => removeFile(file.name)}
                          deleteIcon={<DeleteIcon />}
                          color="warning"
                          variant="outlined"
                        />
                      ))}
                  </Box>
                </Alert>
              )}
            </Box>

            {/* Relevant Certifications Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Relevant Certifications:
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Please upload any certifications showing additional training or competency
                  relevant to drone operations, such as thermal imaging, construction inspection,
                  mapping/surveying, first aid, or industry-specific training.
                </Typography>
              </Alert>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.additionalCertifications.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    onDelete={() => removeEquipment('additionalCertifications', cert)}
                    deleteIcon={<DeleteIcon />}
                    color="success"
                    variant="outlined"
                  />
                ))}
                {formData.additionalCertifications.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No certifications added yet.
                  </Typography>
                )}
              </Box>

              {/* Add Certification Button */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openEquipmentDialog('additionalCertifications')}
                  variant="outlined"
                  size="small"
                >
                  Add Certification
                </Button>
              </Box>

              {/* Certification Documents Upload */}
              {formData.additionalCertifications.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Certification Documents (PDF):
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{ mb: 1 }}
                  >
                    Upload Certification PDFs
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      hidden
                      onChange={e => handleFileUpload(e, 'certification')}
                    />
                  </Button>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {uploadedFiles
                      .filter(f => f.type === 'certification')
                      .map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => removeFile(file.name)}
                          deleteIcon={<DeleteIcon />}
                          color="success"
                          variant="outlined"
                        />
                      ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Equipment
            </Typography>

            {/* Drone Models Section */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1">Drone Models You Own/Operate:</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openEquipmentDialog('droneModels')}
                  variant="outlined"
                  size="small"
                >
                  Add Drone
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.droneModels.map((drone, index) => (
                  <Chip
                    key={index}
                    label={drone}
                    onDelete={() => removeEquipment('droneModels', drone)}
                    deleteIcon={<DeleteIcon />}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {formData.droneModels.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No drones added yet. Click &quot;Add Drone&quot; to get started.
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Camera/Sensor Equipment Section */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1">Camera/Sensor Equipment:</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openEquipmentDialog('cameraEquipment')}
                  variant="outlined"
                  size="small"
                >
                  Add Camera/Sensor
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.cameraEquipment.map((equipment, index) => (
                  <Chip
                    key={index}
                    label={equipment}
                    onDelete={() => removeEquipment('cameraEquipment', equipment)}
                    deleteIcon={<DeleteIcon />}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
                {formData.cameraEquipment.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No camera/sensor equipment added yet. Click &quot;Add Camera/Sensor&quot; to get
                    started.
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Additional Inventory Section */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1">Additional Inventory & Equipment:</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openEquipmentDialog('additionalInventory')}
                  variant="outlined"
                  size="small"
                >
                  Add Equipment
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Include GNSS mobile stations, ground control points, batteries, etc.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.additionalInventory.map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    onDelete={() => removeEquipment('additionalInventory', item)}
                    deleteIcon={<DeleteIcon />}
                    color="success"
                    variant="outlined"
                  />
                ))}
                {formData.additionalInventory.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No additional equipment added yet. Click &quot;Add Equipment&quot; to get
                    started.
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Software Licensing Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Image Processing & Software:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Do you do your own image processing? What software do you use?
              </Typography>

              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">Image Processing Approach:</FormLabel>
                <RadioGroup
                  value={formData.imageProcessingApproach}
                  onChange={e => handleInputChange('imageProcessingApproach', e.target.value)}
                >
                  <FormControlLabel
                    value="own-processing"
                    control={<Radio />}
                    label="I do my own image processing"
                  />
                  <FormControlLabel
                    value="client-processing"
                    control={<Radio />}
                    label="Client handles processing (I provide raw data)"
                  />
                  <FormControlLabel
                    value="both"
                    control={<Radio />}
                    label="Both - depends on project requirements"
                  />
                </RadioGroup>
              </FormControl>

              <Typography variant="subtitle2" gutterBottom>
                Software Licenses & Experience:
              </Typography>
              <FormGroup sx={{ mb: 2 }}>
                {[
                  'DroneDeploy',
                  'Pix4D',
                  'DJI Terra',
                  'Agisoft Metashape',
                  'Global Mapper',
                  'ArcGIS',
                  'QGIS',
                  'Correlator3D',
                  'Bentley ContextCapture',
                  'Other/Custom Software',
                ].map(software => (
                  <FormControlLabel
                    key={software}
                    control={
                      <Checkbox
                        checked={formData.softwareLicenses.includes(software)}
                        onChange={e => {
                          if (software === 'Other/Custom Software' && e.target.checked) {
                            setEquipmentDialogs(prev => ({ ...prev, customSoftware: true }));
                          }
                          handleArrayChange('softwareLicenses', software, e.target.checked);
                        }}
                      />
                    }
                    label={software}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Work Experience & Insurance
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Employment Status:
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.employmentStatus?.includes('own_company')}
                      onChange={e => {
                        const status = 'own_company';
                        setFormData(prev => ({
                          ...prev,
                          employmentStatus: e.target.checked
                            ? [...(prev.employmentStatus || []), status]
                            : (prev.employmentStatus || []).filter(s => s !== status),
                        }));
                      }}
                    />
                  }
                  label="I own my own drone services company"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.employmentStatus?.includes('open_to_joining')}
                      onChange={e => {
                        const status = 'open_to_joining';
                        setFormData(prev => ({
                          ...prev,
                          employmentStatus: e.target.checked
                            ? [...(prev.employmentStatus || []), status]
                            : (prev.employmentStatus || []).filter(s => s !== status),
                        }));
                      }}
                    />
                  }
                  label="I'm open to joining a drone services company"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.employmentStatus?.includes('fulltime_other')}
                      onChange={e => {
                        const status = 'fulltime_other';
                        setFormData(prev => ({
                          ...prev,
                          employmentStatus: e.target.checked
                            ? [...(prev.employmentStatus || []), status]
                            : (prev.employmentStatus || []).filter(s => s !== status),
                        }));
                      }}
                    />
                  }
                  label="I have a full-time career outside of drone operations"
                />
              </FormGroup>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                FAA Waiver Experience:
              </Typography>
              <FormControl component="fieldset" margin="normal">
                <RadioGroup
                  value={formData.faaWaiverExperience || ''}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, faaWaiverExperience: e.target.value }))
                  }
                >
                  <FormControlLabel
                    value="yes"
                    control={<Radio />}
                    label="Yes, I have applied for FAA waivers"
                  />
                  <FormControlLabel
                    value="no"
                    control={<Radio />}
                    label="No, I have not applied for FAA waivers"
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Work Experience Background:
              </Typography>
              <TextField
                value={formData.workExperience}
                onChange={e => handleInputChange('workExperience', e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Tell us a little bit about your work experience, outside of drone services. What industry do you work in and how long have you been in that industry?"
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Insurance Coverage:
              </Typography>
              <FormGroup>
                {[
                  'Commercial Liability Insurance',
                  'Workers Compensation Insurance',
                  'Property Damage Insurance',
                  'Accident Insurance',
                  'Other/Custom Insurance',
                ].map(insurance => (
                  <Box key={insurance} sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.insuranceCoverage.some(item =>
                            item.startsWith(insurance)
                          )}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                insuranceCoverage: [
                                  ...prev.insuranceCoverage.filter(
                                    item => !item.startsWith(insurance)
                                  ),
                                  insurance,
                                ],
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                insuranceCoverage: prev.insuranceCoverage.filter(
                                  item => !item.startsWith(insurance)
                                ),
                              }));
                            }
                          }}
                        />
                      }
                      label={insurance}
                    />
                    {formData.insuranceCoverage.some(item => item.startsWith(insurance)) && (
                      <Box sx={{ ml: 4, mt: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <InputLabel>Coverage Amount</InputLabel>
                          <Select
                            value={
                              formData.insuranceCoverage
                                .find(item => item.startsWith(insurance))
                                ?.split(' - ')[1] || ''
                            }
                            onChange={e => {
                              const amount = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                insuranceCoverage: [
                                  ...prev.insuranceCoverage.filter(
                                    item => !item.startsWith(insurance)
                                  ),
                                  `${insurance} - ${amount}`,
                                ],
                              }));
                            }}
                            label="Coverage Amount"
                          >
                            <MenuItem value="$100,000">$100,000</MenuItem>
                            <MenuItem value="$250,000">$250,000</MenuItem>
                            <MenuItem value="$500,000">$500,000</MenuItem>
                            <MenuItem value="$1,000,000">$1,000,000</MenuItem>
                            <MenuItem value="$2,000,000">$2,000,000</MenuItem>
                            <MenuItem value="$5,000,000">$5,000,000</MenuItem>
                            <MenuItem value="Other">Other Amount</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>
                ))}
              </FormGroup>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Availability & Travel Preferences:
              </Typography>

              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">
                  Current work schedule and availability for drone operations:
                </FormLabel>
                <RadioGroup
                  value={formData.availabilityType}
                  onChange={e => handleInputChange('availabilityType', e.target.value)}
                >
                  <FormControlLabel
                    value="immediate"
                    control={<Radio />}
                    label="Immediately available - drone operations are my primary focus"
                  />
                  <FormControlLabel
                    value="flexible"
                    control={<Radio />}
                    label="Flexible schedule - can accommodate most project timelines"
                  />
                  <FormControlLabel
                    value="evenings-weekends"
                    control={<Radio />}
                    label="Evenings and weekends - have other work commitments"
                  />
                  <FormControlLabel
                    value="project-based"
                    control={<Radio />}
                    label="Project-based - available with advance notice"
                  />
                </RadioGroup>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Travel Range & Commitment</InputLabel>
                <Select
                  value={formData.serviceRadius}
                  onChange={e => handleInputChange('serviceRadius', e.target.value)}
                  label="Travel Range & Commitment"
                >
                  <MenuItem value="local">Local area only (within 25 miles)</MenuItem>
                  <MenuItem value="regional">Regional day trips (within 100 miles)</MenuItem>
                  <MenuItem value="state">Statewide - willing to travel same-day</MenuItem>
                  <MenuItem value="multi-state">Multi-state - willing to stay overnight</MenuItem>
                  <MenuItem value="extended">
                    Extended assignments - willing to relocate temporarily for projects
                  </MenuItem>
                  <MenuItem value="national">
                    National - available for long-term travel assignments
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">Short-notice availability:</FormLabel>
                <RadioGroup
                  value={formData.shortNoticeAvailability || ''}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, shortNoticeAvailability: e.target.value }))
                  }
                >
                  <FormControlLabel
                    value="same-day"
                    control={<Radio />}
                    label="Same-day availability for urgent projects"
                  />
                  <FormControlLabel
                    value="24-hours"
                    control={<Radio />}
                    label="24-48 hours notice preferred"
                  />
                  <FormControlLabel
                    value="week"
                    control={<Radio />}
                    label="1 week advance notice required"
                  />
                  <FormControlLabel
                    value="planning"
                    control={<Radio />}
                    label="Prefer planned projects with 2+ weeks notice"
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Services You Can Provide:
              </Typography>
              <Box sx={{ mb: 2 }}>
                {formData.servicesOffered?.map((service, index) => (
                  <Chip
                    key={index}
                    label={service}
                    onDelete={() => {
                      setFormData(prev => ({
                        ...prev,
                        servicesOffered: prev.servicesOffered.filter((_, i) => i !== index),
                      }));
                    }}
                    sx={{ mr: 1, mb: 1 }}
                    color="primary"
                  />
                ))}
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Add Service</InputLabel>
                <Select
                  value=""
                  onChange={e => {
                    const service = e.target.value;
                    if (service === 'custom') {
                      setEquipmentDialogs(prev => ({ ...prev, customService: true }));
                    } else if (service && !formData.servicesOffered?.includes(service)) {
                      setFormData(prev => ({
                        ...prev,
                        servicesOffered: [...(prev.servicesOffered || []), service],
                      }));
                    }
                  }}
                  label="Add Service"
                >
                  <MenuItem value="Solar Panel Inspection">Solar Panel Inspection</MenuItem>
                  <MenuItem value="Roof Inspection">Roof Inspection</MenuItem>
                  <MenuItem value="Construction Site Monitoring">
                    Construction Site Monitoring
                  </MenuItem>
                  <MenuItem value="Real Estate Photography">Real Estate Photography</MenuItem>
                  <MenuItem value="Infrastructure Inspection">Infrastructure Inspection</MenuItem>
                  <MenuItem value="Agricultural Monitoring">Agricultural Monitoring</MenuItem>
                  <MenuItem value="Thermal Imaging Services">Thermal Imaging Services</MenuItem>
                  <MenuItem value="Mapping & Surveying">Mapping & Surveying</MenuItem>
                  <MenuItem value="Search & Rescue">Search & Rescue</MenuItem>
                  <MenuItem value="Event Photography/Videography">
                    Event Photography/Videography
                  </MenuItem>
                  <MenuItem value="custom">Other/Custom Service</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Additional Information:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={formData.additionalInfo || ''}
                onChange={e => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="Please share any additional qualifications, specialized experience, or relevant information that would help us understand your capabilities as a drone pilot."
                variant="outlined"
              />
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your information below. You can go back to make changes if needed.
            </Alert>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Personal Information
                </Typography>
                <Typography>
                  Name: {formData.firstName} {formData.lastName}
                </Typography>
                <Typography>Email: {formData.email}</Typography>
                <Typography>Phone: {formData.phone}</Typography>
                <Typography>
                  Location: {formData.city}, {formData.state} {formData.zipCode}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Licensing
                </Typography>
                <Typography>Part 107 License: {formData.part107License}</Typography>
                {formData.licenseNumber && (
                  <Typography>License #: {formData.licenseNumber}</Typography>
                )}
                <Typography>
                  Additional Certifications: {formData.additionalCertifications.length} selected
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Equipment
                </Typography>
                <Typography>Drone Models: {formData.droneModels.length} selected</Typography>
                <Typography>
                  Camera Equipment: {formData.cameraEquipment.length} selected
                </Typography>
                <Typography>
                  Additional Equipment: {formData.additionalInventory.length} selected
                </Typography>
                <Typography>
                  Image Processing: {formData.imageProcessingApproach || 'Not specified'}
                </Typography>
                <Typography>
                  Software Licenses: {formData.softwareLicenses.length} selected
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Work Experience & Insurance
                </Typography>
                <Typography>
                  Work Experience: {formData.workExperience || 'Not specified'}
                </Typography>
                <Typography>Insurance Coverage: {formData.insuranceCoverage.join(', ')}</Typography>
                <Typography>
                  Uploaded Documents: {formData.uploadedDocuments.length} files
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Services & Availability
                </Typography>
                <Typography>Availability: {formData.availabilityType}</Typography>
                <Typography>Service Radius: {formData.serviceRadius}</Typography>
                <Typography>
                  Services Offered: {formData.servicesOffered.length} selected
                </Typography>
              </CardContent>
            </Card>

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.backgroundCheck}
                    onChange={e => handleInputChange('backgroundCheck', e.target.checked)}
                    required
                  />
                }
                label="I consent to a background check if required for certain projects"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.termsAccepted}
                    onChange={e => handleInputChange('termsAccepted', e.target.checked)}
                    required
                  />
                }
                label="I accept the Terms of Service and Privacy Policy"
              />
            </FormGroup>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  const isStepValid = step => {
    switch (step) {
      case 0:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 1:
        if (formData.part107License === 'yes') {
          // Check if license number and issue date are provided
          const basicRequirements = formData.licenseNumber && formData.licenseIssueDate;

          if (!basicRequirements) return false;

          // If license is more than 2 years old, check recurrent requirements
          const issueDate = new Date(formData.licenseIssueDate);
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

          if (issueDate <= twoYearsAgo) {
            // Need either recurrent cert number OR promise to complete
            return formData.recurrentCertNumber || formData.willGetRecurrentBeforeFlying;
          }

          return true;
        }
        return formData.part107License;
      case 2:
        return formData.droneModels.length > 0; // Equipment - at least one drone required
      case 3:
        return (
          formData.insuranceCoverage.length > 0 &&
          formData.availabilityType &&
          formData.serviceRadius &&
          formData.servicesOffered?.length > 0
        ); // Work experience, insurance, and availability required
      case 4:
        return formData.backgroundCheck && formData.termsAccepted;
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mr: 2 }}>
          Back to Home
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Pilot Registration
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={(activeStep / (steps.length - 1)) * 100}
          sx={{ mb: 4 }}
        />

        {/* Step Content */}
        <Box sx={{ minHeight: 400, mb: 4 }}>{renderStepContent(activeStep)}</Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowBack />}>
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              startIcon={<CheckCircle />}
              disabled={!isStepValid(activeStep)}
              size="large"
            >
              Submit Registration
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<ArrowForward />}
              disabled={!isStepValid(activeStep)}
            >
              Next
            </Button>
          )}
        </Box>

        {/* Feedback Section */}
        <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Having issues or suggestions for improvement?
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setEquipmentDialogs(prev => ({ ...prev, feedback: true }))}
            sx={{ color: 'text.secondary', borderColor: 'text.secondary' }}
          >
            Report Bug or Provide Feedback
          </Button>
        </Box>
      </Paper>

      {/* Equipment Dialogs */}
      {/* Drone Models Dialog */}
      <Dialog
        open={equipmentDialogs.droneModels}
        onClose={() => closeEquipmentDialog('droneModels')}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Drone Model</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select from our list or add your own:
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              type="number"
              label="Quantity"
              value={selectedQuantity}
              onChange={e => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 99 }}
              sx={{ width: 120 }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {droneOptions.map(drone => {
              const isAdded = formData.droneModels.some(item => item.startsWith(drone));
              return (
                <Button
                  key={drone}
                  variant="outlined"
                  onClick={() => handleAddFromDialog('droneModels', drone)}
                  sx={{ justifyContent: 'flex-start' }}
                  disabled={isAdded}
                >
                  {drone} {isAdded && '(Added)'}
                </Button>
              );
            })}
          </Box>
          <TextField
            fullWidth
            label="Equipment not listed? Enter here:"
            value={customEquipment}
            onChange={e => setCustomEquipment(e.target.value)}
            placeholder="e.g., Custom Build, Specific Model..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeEquipmentDialog('droneModels')}>Cancel</Button>
          <Button
            onClick={() => handleAddFromDialog('droneModels', 'custom')}
            disabled={!customEquipment.trim()}
            variant="contained"
          >
            Add Custom
          </Button>
        </DialogActions>
      </Dialog>

      {/* Camera Equipment Dialog */}
      <Dialog
        open={equipmentDialogs.cameraEquipment}
        onClose={() => closeEquipmentDialog('cameraEquipment')}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Camera/Sensor Equipment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select from our list or add your own:
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              type="number"
              label="Quantity"
              value={selectedQuantity}
              onChange={e => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 99 }}
              sx={{ width: 120 }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {cameraOptions.map(camera => {
              const isAdded = formData.cameraEquipment.some(item => item.startsWith(camera.name));
              return (
                <Button
                  key={camera.name}
                  variant="outlined"
                  onClick={() => handleAddFromDialog('cameraEquipment', camera.name)}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 2 }}
                  disabled={isAdded}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      {camera.name} {isAdded && '(Added)'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {camera.description}
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Box>
          <TextField
            fullWidth
            label="Equipment not listed? Enter here:"
            value={customEquipment}
            onChange={e => setCustomEquipment(e.target.value)}
            placeholder="e.g., Custom sensor, Specific camera model..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeEquipmentDialog('cameraEquipment')}>Cancel</Button>
          <Button
            onClick={() => handleAddFromDialog('cameraEquipment', 'custom')}
            disabled={!customEquipment.trim()}
            variant="contained"
          >
            Add Custom
          </Button>
        </DialogActions>
      </Dialog>

      {/* Additional Inventory Dialog */}
      <Dialog
        open={equipmentDialogs.additionalInventory}
        onClose={() => closeEquipmentDialog('additionalInventory')}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Additional Equipment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select mapping gear, accessories, remote drone operations equipment, and other
            equipment:
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              type="number"
              label="Quantity"
              value={selectedQuantity}
              onChange={e => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 99 }}
              sx={{ width: 120 }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {additionalInventoryOptions.map(item => {
              const isAdded = formData.additionalInventory.some(equipmentItem =>
                equipmentItem.startsWith(item)
              );
              return (
                <Button
                  key={item}
                  variant="outlined"
                  onClick={() => handleAddFromDialog('additionalInventory', item)}
                  sx={{ justifyContent: 'flex-start' }}
                  disabled={isAdded}
                >
                  {item} {isAdded && '(Added)'}
                </Button>
              );
            })}
          </Box>
          <TextField
            fullWidth
            label="Equipment not listed? Enter here:"
            value={customEquipment}
            onChange={e => setCustomEquipment(e.target.value)}
            placeholder="e.g., Specific software, Custom gear..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeEquipmentDialog('additionalInventory')}>Cancel</Button>
          <Button
            onClick={() => handleAddFromDialog('additionalInventory', 'custom')}
            disabled={!customEquipment.trim()}
            variant="contained"
          >
            Add Custom
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certifications Dialog */}
      <Dialog
        open={equipmentDialogs.additionalCertifications}
        onClose={() => closeEquipmentDialog('additionalCertifications')}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Relevant Certification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please enter any certifications showing additional training or competency relevant to
            drone operations. Examples include thermal imaging, construction inspection,
            mapping/surveying, first aid, or industry-specific training.
          </Typography>
          <TextField
            fullWidth
            label="Certification Name"
            value={customEquipment}
            onChange={e => setCustomEquipment(e.target.value)}
            placeholder="e.g., Thermal Imaging Certification, First Aid/CPR, Construction Inspection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeEquipmentDialog('additionalCertifications')}>Cancel</Button>
          <Button
            onClick={() => handleAddFromDialog('additionalCertifications', 'custom')}
            disabled={!customEquipment.trim()}
            variant="contained"
          >
            Add Certification
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Software Dialog */}
      <Dialog
        open={equipmentDialogs.customSoftware}
        onClose={() => setEquipmentDialogs(prev => ({ ...prev, customSoftware: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Custom Software Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please describe the other/custom software you use for drone operations and image
            processing.
          </Typography>
          <TextField
            fullWidth
            label="Software Description"
            value={customSoftwareDescription}
            onChange={e => setCustomSoftwareDescription(e.target.value)}
            multiline
            rows={4}
            placeholder="e.g., Custom Python scripts for photogrammetry, proprietary company software, open-source tools..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEquipmentDialogs(prev => ({ ...prev, customSoftware: false }))}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (customSoftwareDescription.trim()) {
                setFormData(prev => ({
                  ...prev,
                  customSoftwareDescription: customSoftwareDescription.trim(),
                }));
              }
              setEquipmentDialogs(prev => ({ ...prev, customSoftware: false }));
              setCustomSoftwareDescription('');
            }}
            variant="contained"
          >
            Save Description
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Service Dialog */}
      <Dialog
        open={equipmentDialogs.customService}
        onClose={() => setEquipmentDialogs(prev => ({ ...prev, customService: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Custom Service</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please describe the service you can provide that is not listed in our options.
          </Typography>
          <TextField
            fullWidth
            label="Service Name"
            value={customEquipment}
            onChange={e => setCustomEquipment(e.target.value)}
            placeholder="e.g., Pipeline Inspection, Mining Surveys, Wildlife Monitoring..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEquipmentDialogs(prev => ({ ...prev, customService: false }))}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (
                customEquipment.trim() &&
                !formData.servicesOffered?.includes(customEquipment.trim())
              ) {
                setFormData(prev => ({
                  ...prev,
                  servicesOffered: [...(prev.servicesOffered || []), customEquipment.trim()],
                }));
              }
              setEquipmentDialogs(prev => ({ ...prev, customService: false }));
              setCustomEquipment('');
            }}
            disabled={!customEquipment.trim()}
            variant="contained"
          >
            Add Service
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={equipmentDialogs.feedback}
        onClose={() => setEquipmentDialogs(prev => ({ ...prev, feedback: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Bug or Provide Feedback</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Help us improve! Please describe any issues you encountered or suggestions you have for
            the registration process.
          </Typography>
          <TextField
            fullWidth
            label="Your Feedback"
            value={formData.feedbackMessage || ''}
            onChange={e => setFormData(prev => ({ ...prev, feedbackMessage: e.target.value }))}
            multiline
            rows={4}
            placeholder="e.g., The form was confusing on step 2, I could not upload my file, I suggest adding..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEquipmentDialogs(prev => ({ ...prev, feedback: false }))}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Here you would typically send the feedback to your backend
              setEquipmentDialogs(prev => ({ ...prev, feedback: false }));
              setFormData(prev => ({ ...prev, feedbackMessage: '' }));
              // You could show a success message here
            }}
            disabled={!formData.feedbackMessage?.trim()}
            variant="contained"
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PilotRegistration;
