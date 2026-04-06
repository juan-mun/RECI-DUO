import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UrgencyBanner from "@/components/UrgencyBanner";
import HowItWorks from "@/components/HowItWorks";
import BenefitsSection from "@/components/BenefitsSection";
import TrustSection from "@/components/TrustSection";
import MetricsSection from "@/components/MetricsSection";
import FeaturedCompanies from "@/components/FeaturedCompanies";
import TestimonialSection from "@/components/TestimonialSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import GreenParticles from "@/components/GreenParticles";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050f07" }}>
      <GreenParticles />
      <Navbar />
      <HeroSection />
      <UrgencyBanner />
      <HowItWorks />
      <BenefitsSection />
      <TrustSection />
      <MetricsSection />
      <FeaturedCompanies />
      <TestimonialSection />
      <CTASection />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
};

export default Index;
