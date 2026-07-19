import { Hero } from "@/components/marketing/Hero";
import { AnswerLayer } from "@/components/marketing/AnswerLayer";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Footer } from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <AnswerLayer />
      <HowItWorks />
      <Pricing />
      <FinalCta />
      <Footer />
    </>
  );
}
