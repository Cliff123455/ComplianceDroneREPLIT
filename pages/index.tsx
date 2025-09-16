import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>ComplianceDrone - Professional Thermal Inspection Services</title>
        <meta name="description" content="Professional drone thermal inspection services for solar installations and electrical infrastructure. Automated anomaly detection and comprehensive PDF reports." />
        <meta name="keywords" content="thermal inspection, drone services, solar panel inspection, electrical inspection, thermal imaging" />
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
            <div className="hidden md:flex space-x-8">
              <a href="#services" className="hover:text-gray-200 transition-colors">Services</a>
              <a href="/upload" className="hover:text-gray-200 transition-colors">Upload</a>
              <a href="/dashboard" className="hover:text-gray-200 transition-colors">Dashboard</a>
              <a href="#about" className="hover:text-gray-200 transition-colors">About</a>
              <a href="#contact" className="hover:text-gray-200 transition-colors">Contact</a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-padding bg-white">
        <div className="cd-container">
          <div className="cd-grid cd-grid-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-gradient mb-6">
                Professional Thermal Inspection Services
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Transform 100+ thermal images into comprehensive PDF reports in under 5 minutes. 
                Our AI-powered system detects thermal anomalies in solar installations and electrical infrastructure with precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="btn-primary text-lg px-8 py-4">
                  Request Inspection
                </button>
                <button className="btn-secondary text-lg px-8 py-4">
                  Become a Pilot
                </button>
              </div>
            </div>
            <div>
              <Image 
                src="/images/large-solar-installation.jpg" 
                alt="Large Scale Solar Installation Aerial View" 
                width={600} 
                height={400}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                className="hero-image w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="section-padding bg-gray-50">
        <div className="cd-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gradient mb-4">
              Automated Thermal Anomaly Detection
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI model, trained on 4,000+ thermal images, identifies critical issues before they become costly problems.
            </p>
          </div>
          
          <div className="cd-grid cd-grid-3 gap-8">
            <div className="card text-center">
              <div className="mb-6">
                <Image 
                  src="/images/thermal-inspection-main.jpg" 
                  alt="Thermal Inspection of Electrical Infrastructure" 
                  width={300} 
                  height={200}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">Electrical Infrastructure</h3>
              <p className="text-gray-600">
                Detect overheating switches, transformers, and electrical connections before failure occurs.
              </p>
            </div>

            <div className="card text-center">
              <div className="mb-6">
                <Image 
                  src="/images/pv-field-aerial.jpg" 
                  alt="Solar Panel Field Aerial Inspection" 
                  width={300} 
                  height={200}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">Solar Panel Arrays</h3>
              <p className="text-gray-600">
                Identify hot spots, cell failures, and module defects across large-scale installations.
              </p>
            </div>

            <div className="card text-center">
              <div className="mb-6">
                <Image 
                  src="/images/thermal-anomaly-example.jpg" 
                  alt="Thermal Anomaly Detection Example" 
                  width={300} 
                  height={200}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">Anomaly Detection</h3>
              <p className="text-gray-600">
                Precise thermal mapping with GPS coordinates for easy maintenance scheduling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-white">
        <div className="cd-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gradient mb-4">
              Why Choose ComplianceDrone?
            </h2>
          </div>
          
          <div className="cd-grid cd-grid-2 gap-12">
            <div className="card">
              <h3 className="text-2xl font-semibold mb-4">Fast Processing</h3>
              <p className="text-gray-600 mb-4">
                Upload up to 500 thermal images and receive comprehensive PDF reports in under 5 minutes.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>• Automated anomaly detection</li>
                <li>• GPS coordinate mapping</li>
                <li>• Professional report formatting</li>
              </ul>
            </div>

            <div className="card">
              <h3 className="text-2xl font-semibold mb-4">Proven Accuracy</h3>
              <p className="text-gray-600 mb-4">
                Our AI model identifies multiple types of thermal anomalies with high precision.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li>• Hot spots and overheating</li>
                <li>• Module and cell failures</li>
                <li>• Electrical connection issues</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg text-white section-padding">
        <div className="cd-container text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our network of certified pilots or request a thermal inspection for your solar installation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-gray-800 hover:bg-gray-100 font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-300 shadow-lg">
              Request Quote
            </button>
            <button className="border-2 border-white bg-transparent hover:bg-white hover:text-gray-800 font-semibold text-lg px-8 py-4 rounded-lg transition-all duration-300">
              Join as Pilot
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="cd-container">
          <div className="cd-grid cd-grid-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image 
                  src="/logo.png" 
                  alt="ComplianceDrone Logo" 
                  width={40} 
                  height={40}
                  className="rounded-lg"
                />
                <h3 className="text-xl font-bold">ComplianceDrone</h3>
              </div>
              <p className="text-gray-400">
                Professional thermal inspection services powered by AI and delivered by certified pilots.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Thermal Inspections</li>
                <li>Solar Panel Analysis</li>
                <li>Electrical Infrastructure</li>
                <li>Anomaly Detection</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Pilot Network</li>
                <li>Contact</li>
                <li>Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ComplianceDrone. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;