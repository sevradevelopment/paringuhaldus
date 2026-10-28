import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { WhyChoose } from "@/components/marketing/why-choose";

export default function HomePage() {
  return (
    <>
      <Hero />
      <WhyChoose />
      <HowItWorks />
      <Pricing />
      <FinalCta />
    </>
  );
}
