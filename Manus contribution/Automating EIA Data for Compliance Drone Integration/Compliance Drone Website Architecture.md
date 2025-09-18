# Compliance Drone Website Architecture

## System Overview
**Project**: Compliance Drone - Energy Infrastructure Management Platform  
**Framework**: Next.js 15.2.4 with React 19.0.0  
**Core Message**: "Energy Infrastructure Management Inspection and oversight services"  

## Architecture Principles
1. **Modular Design**: Component-based architecture for scalability
2. **Data-Driven**: Real-time integration with EIA and solar project data
3. **User-Centric**: Separate interfaces for pilots and customers
4. **Mobile-First**: Responsive design for field operations
5. **Compliance-Focused**: Regulatory compliance at the core

## System Architecture

### Frontend Architecture
```
Next.js App Router Structure:
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard area
│   │   ├── pilot/           # Pilot-specific dashboard
│   │   └── customer/        # Customer portal
│   ├── (public)/            # Public pages
│   │   ├── page.tsx         # Landing page
│   │   ├── about/           # About page
│   │   ├── services/        # Services page
│   │   └── pricing/         # Pricing page
│   └── api/                 # API routes
│       ├── eia/             # EIA data integration
│       ├── solar/           # Solar project data
│       ├── auth/            # Authentication
│       └── upload/          # File upload handling
```

### Component Architecture
```
components/
├── Layout/                  # Layout components
│   ├── Header/             # Navigation with role-based menus
│   ├── Footer/             # Footer with compliance links
│   └── Sidebar/            # Dashboard sidebar navigation
├── Auth/                   # Authentication components
│   ├── SignIn/             # Pilot/Customer sign-in
│   ├── SignUp/             # Registration forms
│   └── Profile/            # User profile management
├── Dashboard/              # Dashboard components
│   ├── PilotDashboard/     # Pilot-specific interface
│   ├── CustomerPortal/     # Customer interface
│   └── Analytics/          # Data visualization
├── Maps/                   # Map integration
│   ├── ProjectMap/         # Solar project visualization
│   ├── KMLViewer/          # KML file display
│   └── ServiceAreaMap/     # Pilot service areas
├── Forms/                  # Form components
│   ├── PilotRegistration/  # Enhanced pilot registration
│   ├── ProjectCreation/    # Project creation wizard
│   └── FileUpload/         # KMZ, PDF, DXF upload
├── DataTables/             # Data display components
│   ├── SolarProjects/      # Solar project listings
│   ├── EIAData/            # EIA data tables
│   └── ComplianceStatus/   # Compliance monitoring
└── Common/                 # Shared components
    ├── LoadingSpinner/     # Loading states
    ├── ErrorBoundary/      # Error handling
    └── Notifications/      # Toast notifications
```

## Data Architecture

### Database Schema (Prisma)
```sql
-- Users and Authentication
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  role        UserRole @default(CUSTOMER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  pilotProfile    PilotProfile?
  customerProfile CustomerProfile?
  projects        Project[]
}

-- Pilot-specific data
model PilotProfile {
  id              String @id @default(cuid())
  userId          String @unique
  certifications  String[]
  equipment       Json
  serviceAreas    Json    // Geographic boundaries
  
  user User @relation(fields: [userId], references: [id])
}

-- Customer-specific data
model CustomerProfile {
  id       String @id @default(cuid())
  userId   String @unique
  company  String?
  
  user User @relation(fields: [userId], references: [id])
}

-- Solar Projects
model Project {
  id              String        @id @default(cuid())
  name            String
  status          ProjectStatus @default(PLANNING)
  location        Json          // Coordinates
  capacity        Float?        // MW
  technology      String?
  eiaPlantId      String?       // Link to EIA data
  
  // File attachments
  kmlFiles        String[]      // File paths
  pdfFiles        String[]
  dxfFiles        String[]
  
  // Relations
  ownerId         String
  owner           User          @relation(fields: [ownerId], references: [id])
  inspections     Inspection[]
}

-- Inspection records
model Inspection {
  id          String           @id @default(cuid())
  projectId   String
  pilotId     String
  status      InspectionStatus @default(SCHEDULED)
  scheduledAt DateTime
  completedAt DateTime?
  findings    Json?            // Inspection results
  
  project Project @relation(fields: [projectId], references: [id])
}

-- EIA Data Cache
model EIAPlant {
  id            String @id // EIA Plant ID
  name          String
  state         String
  technology    String
  capacity      Float?
  status        String
  coordinates   Json
  lastUpdated   DateTime @default(now())
}
```

### API Integration Layer
```typescript
// EIA API Integration
interface EIAService {
  getPlantData(filters: PlantFilters): Promise<EIAPlant[]>
  getGenerationData(plantId: string): Promise<GenerationData>
  getStateData(state: string): Promise<StateEnergyData>
  syncPlantDatabase(): Promise<void>
}

// Solar Project Data Processing
interface SolarDataService {
  processKMLFile(file: File): Promise<ProjectGeometry>
  extractProjectData(kmlData: KMLData): Promise<ProjectInfo>
  validateProjectCompliance(project: Project): Promise<ComplianceReport>
}

// File Upload Service
interface FileUploadService {
  uploadKML(file: File, projectId: string): Promise<string>
  uploadPDF(file: File, projectId: string): Promise<string>
  uploadDXF(file: File, projectId: string): Promise<string>
  processUploadedFiles(projectId: string): Promise<ProcessingResult>
}
```

## Feature Architecture

### Phase I Core Features

#### 1. Enhanced Pilot Registration
```typescript
interface PilotRegistrationForm {
  personalInfo: {
    name: string
    email: string
    phone: string
    address: Address
  }
  certifications: {
    droneOperatorLicense: string
    part107Certificate: string
    additionalCertifications: string[]
  }
  equipment: {
    drones: DroneInfo[]
    cameras: CameraInfo[]
    sensors: SensorInfo[]
  }
  serviceAreas: {
    states: string[]
    radius: number // miles
    specializations: string[]
  }
}
```

#### 2. Customer Portal
```typescript
interface CustomerPortal {
  projectCreationWizard: {
    basicInfo: ProjectBasicInfo
    locationData: ProjectLocation
    fileUploads: FileUploadSection
    requirements: ProjectRequirements
  }
  projectManagement: {
    activeProjects: Project[]
    inspectionHistory: Inspection[]
    complianceReports: ComplianceReport[]
  }
  quoteRequests: {
    createRequest: QuoteRequestForm
    trackRequests: QuoteRequest[]
    pilotMatching: PilotMatchingService
  }
}
```

#### 3. Map Integration (Mapbox)
```typescript
interface MapIntegration {
  satelliteImagery: MapboxSatelliteLayer
  kmlVisualization: {
    projectBoundaries: KMLLayer
    solarPanelLayout: KMLLayer
    complianceZones: KMLLayer
  }
  interactiveFeatures: {
    clickToInspect: ClickHandler
    measurementTools: MeasurementTools
    layerToggle: LayerControls
  }
  mobileOptimization: {
    touchControls: TouchGestures
    responsiveUI: ResponsiveMapUI
    offlineCapability: OfflineMapData
  }
}
```

### EIA Automation Features

#### 1. Real-time Plant Monitoring
```typescript
interface PlantMonitoringDashboard {
  solarPlantStatus: {
    operationalPlants: EIAPlant[]
    plannedPlants: EIAPlant[]
    retiredPlants: EIAPlant[]
  }
  performanceMetrics: {
    capacityFactors: PerformanceData[]
    generationTrends: TrendData[]
    stateComparisons: ComparisonData[]
  }
  complianceAlerts: {
    regulatoryChanges: Alert[]
    reportingDeadlines: Deadline[]
    statusUpdates: StatusUpdate[]
  }
}
```

#### 2. Market Intelligence
```typescript
interface MarketIntelligence {
  competitiveAnalysis: {
    marketShare: MarketShareData
    newProjects: ProjectPipeline
    technologyTrends: TechnologyData
  }
  geographicInsights: {
    stateRankings: StateRanking[]
    regionalTrends: RegionalData
    policyImpacts: PolicyAnalysis
  }
  forecastingTools: {
    capacityProjections: ForecastData
    marketGrowth: GrowthProjections
    investmentTrends: InvestmentData
  }
}
```

## User Experience Architecture

### Landing Page Design
```typescript
interface LandingPage {
  heroSection: {
    headline: "Energy Infrastructure Management"
    subheadline: "Inspection and oversight services"
    ctaButtons: ["Get Started", "Learn More"]
    backgroundVideo: "drone-inspection-footage.mp4"
  }
  servicesSection: {
    pilotServices: ServiceCard[]
    customerServices: ServiceCard[]
    complianceServices: ServiceCard[]
  }
  featuresSection: {
    eiaIntegration: FeatureHighlight
    realTimeMonitoring: FeatureHighlight
    complianceTracking: FeatureHighlight
  }
  pricingSection: {
    pilotPlans: PricingTier[]
    customerPlans: PricingTier[]
    enterprisePlans: PricingTier[]
  }
}
```

### Dashboard Layouts
```typescript
interface DashboardLayouts {
  pilotDashboard: {
    sidebar: PilotNavigation
    mainContent: {
      activeJobs: JobsWidget
      serviceAreaMap: MapWidget
      earnings: EarningsWidget
      equipment: EquipmentWidget
    }
    notifications: NotificationCenter
  }
  customerDashboard: {
    sidebar: CustomerNavigation
    mainContent: {
      projectOverview: ProjectsWidget
      complianceStatus: ComplianceWidget
      eiaData: EIADataWidget
      inspectionSchedule: ScheduleWidget
    }
    quickActions: QuickActionPanel
  }
}
```

## Technical Implementation Strategy

### Development Phases
1. **Foundation Setup** (Week 1)
   - Next.js project initialization
   - Database schema implementation
   - Authentication system setup
   - Basic component library

2. **Core Features** (Weeks 2-3)
   - Pilot registration enhancement
   - Customer portal development
   - File upload system
   - Basic map integration

3. **EIA Integration** (Week 4)
   - API integration development
   - Data synchronization
   - Dashboard implementation
   - Real-time monitoring

4. **Advanced Features** (Week 5)
   - Market intelligence tools
   - Compliance automation
   - Advanced map features
   - Mobile optimization

5. **Testing & Deployment** (Week 6)
   - Comprehensive testing
   - Performance optimization
   - Production deployment
   - User acceptance testing

### Technology Stack
- **Frontend**: Next.js 15.2.4, React 19.0.0, TailwindCSS v4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Maps**: Mapbox GL JS
- **File Storage**: AWS S3 or similar
- **Deployment**: Vercel or similar platform
- **Monitoring**: Built-in analytics and error tracking

### Performance Considerations
- **Caching**: Redis for EIA data caching
- **CDN**: Static asset delivery optimization
- **Database**: Query optimization and indexing
- **API**: Rate limiting and request optimization
- **Mobile**: Progressive Web App features

## Security & Compliance
- **Data Protection**: GDPR/CCPA compliance
- **Authentication**: Multi-factor authentication
- **Authorization**: Role-based access control
- **File Security**: Virus scanning and validation
- **API Security**: Rate limiting and authentication
- **Audit Logging**: Comprehensive activity tracking

## Conclusion
This architecture provides a comprehensive foundation for the Compliance Drone website, integrating EIA automation capabilities with solar project management and compliance monitoring. The modular design allows for iterative development while maintaining scalability and performance.

