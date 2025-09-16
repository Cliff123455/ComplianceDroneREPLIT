import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

const Home: NextPage = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <>
      <Head>
        <title>ComplianceDrone - Aerial Construction Management Platform</title>
        <meta name="description" content="Our aerial construction management platform has saved companies millions in avoided catastrophes. We know how to find issues impacting your plants performance." />
        <meta name="keywords" content="aerial construction management, thermal inspection, drone services, solar panel inspection, electrical inspection, thermal imaging" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Full Page Gradient Background */}
      <div className="landing-gradient min-h-screen">
        
        {/* Minimal Header */}
        <header className="relative z-10">
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
                <h1 className="text-2xl font-bold text-white">ComplianceDrone</h1>
              </div>
              <div className="flex items-center space-x-8">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="text-white hover:text-gray-200 transition-colors">Dashboard</Link>
                    <div className="flex items-center space-x-3">
                      <span className="text-white text-sm">
                        {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                      </span>
                      <button onClick={logout} className="text-white text-sm hover:text-gray-200 transition-colors">
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <button onClick={login} className="text-white hover:text-gray-200 transition-colors">Login</button>
                )}
              </div>
            </nav>
          </div>
        </header>

        {/* Main Message Card */}
        <section className="relative z-10 flex items-center justify-center px-4" style={{minHeight: 'calc(100vh - 200px)'}}>
          <div className="message-card max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mb-8">
                <Image 
                  src="/compliance-drone-shield-logo.png" 
                  alt="ComplianceDrone Shield Logo" 
                  width={120} 
                  height={120}
                  priority
                  className="mx-auto mb-6"
                />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Our aerial construction management platform has saved companies millions in avoided catastrophes
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
                We know how to find issues impacting your plants performance
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/register" className="btn-primary-large">
                  Apply to be a Pilot
                </Link>
                <Link href="/contact" className="btn-secondary-large">
                  Request a Quote
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary Pilot Recruitment Section */}
        <section className="relative z-10 pb-16">
          <div className="cd-container max-w-2xl mx-auto text-center">
            <div className="recruitment-card">
              <p className="text-lg text-gray-600 mb-6">
                Fill out our registration form in 5 minutes and receive follow-up to join our team
              </p>
              <Link href="/register" className="btn-secondary">
                Apply to Fly
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Home;