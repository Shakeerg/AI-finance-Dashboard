import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import TechStrip from "../components/home/TechStrip";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import AIInsights from "../components/home/AIInsights";
import CTA from "../components/home/CTA";
import Footer from "../components/home/Footer";
import "../styles/home.css";

export default function Home() {
  return (
    <>
  <Navbar />
  <Hero />
  <TechStrip />
  <Features />
  <HowItWorks />
  <AIInsights />
  <CTA />
  <Footer />
</>
  );
}