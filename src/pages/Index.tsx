import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedCompanies from "@/components/FeaturedCompanies";
import HowItWorks from "@/components/HowItWorks";
import UseCaseSection from "@/components/UseCaseSection";
import BenefitsSection from "@/components/BenefitsSection";
import TrustSection from "@/components/TrustSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturedCompanies />
      <HowItWorks />
      <UseCaseSection />
      <BenefitsSection />
      <TrustSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
