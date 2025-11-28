import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { MentorMarketplace as MarketplaceComponent } from "@/components/MentorMarketplace";
import { motion } from "framer-motion";

const MentorMarketplace = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Mentor Marketplace
              </h1>
              <p className="text-muted-foreground mb-8">
                Connect with experienced mentors for 1-on-1 guidance
              </p>
              <MarketplaceComponent />
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default MentorMarketplace;
