import { useRef } from "react";
import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import TechStrip from "../components/home/TechStrip";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import AIInsights from "../components/home/AIInsights";
import CTA from "../components/home/CTA";
import Footer from "../components/home/Footer";
import useHomeEffects from "../hooks/useHomeEffects";
import "../styles/home.css";

export default function Home() {
  const rootRef = useRef(null);
  useHomeEffects(rootRef);

  return (
    <div className="home" ref={rootRef}>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="cursor-glow" aria-hidden="true" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <TechStrip />
        <Features />
        <HowItWorks />
        <AIInsights />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}