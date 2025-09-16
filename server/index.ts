// Main Express server for ComplianceDrone with authentication
import express from 'express';
import next from 'next';
import { storage } from './storage';
import { setupAuth, isAuthenticated } from './replitAuth';
import { createServer } from 'http';

// Initialize Next.js
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

export async function createApp(): Promise<express.Express> {
  // Prepare Next.js
  await nextApp.prepare();

  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup authentication
  await setupAuth(app);

  // Auth routes (these override Next.js API routes)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserWithPilotProfile(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Pilot registration endpoint
  app.post('/api/auth/register-pilot', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pilotData = req.body;

      // Check if pilot profile already exists
      const existingProfile = await storage.getPilotProfile(userId);
      if (existingProfile) {
        return res.status(409).json({ message: "Pilot profile already exists" });
      }

      // Create pilot profile
      const profile = await storage.createPilotProfile({
        userId,
        ...pilotData,
        status: 'pending'
      });

      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating pilot profile:", error);
      res.status(500).json({ message: "Failed to create pilot profile" });
    }
  });

  // Get pilot profile endpoint
  app.get('/api/auth/pilot-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getPilotProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Pilot profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching pilot profile:", error);
      res.status(500).json({ message: "Failed to fetch pilot profile" });
    }
  });

  // Handle all other requests with Next.js
  app.use((req, res) => {
    return handle(req, res);
  });

  return app;
}

export async function startServer(port: number = 5000) {
  const app = await createApp();
  const server = createServer(app);
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`ComplianceDrone server running on port ${port}`);
  });
  
  return server;
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}