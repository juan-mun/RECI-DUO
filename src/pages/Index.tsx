import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import BenefitsSection from "@/components/BenefitsSection";
import TrustSection from "@/components/TrustSection";
import FeaturedCompanies from "@/components/FeaturedCompanies";
import TestimonialSection from "@/components/TestimonialSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import StickyMobileCTA from "@/components/StickyMobileCTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <BenefitsSection />
      <TrustSection />
      <FeaturedCompanies />
      <TestimonialSection />
      <CTASection />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
};

export default Index;
