import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { UserRoles } from "@/components/UserRoles";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { WelcomeModal } from "@/components/WelcomeModal";
import { PageTransition } from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <WelcomeModal />
        <Navbar />
        <Hero />
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Features />
          </motion.div>
        </AnimatePresence>
        <UserRoles />
        <TestimonialsCarousel />
        <CTA />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Footer />
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Index;