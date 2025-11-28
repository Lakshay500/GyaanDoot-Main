import { BookOpen, Users, MessageSquare, TrendingUp, Award, DollarSign, Video, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion, useScroll, useTransform } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useRef } from "react";

const features = [
  {
    icon: BookOpen,
    title: "Learn & Teach",
    description: "Access thousands of courses or create your own. Share knowledge and earn from your expertise.",
    gradient: "from-primary/10 to-primary/5",
  },
  {
    icon: DollarSign,
    title: "Buy & Sell Services",
    description: "Marketplace for skills. From coding to design, tutoring to consulting—all in one place.",
    gradient: "from-secondary/10 to-secondary/5",
  },
  {
    icon: Video,
    title: "Live Classes",
    description: "Conduct real-time sessions with whiteboard, screen sharing, and interactive tools.",
    gradient: "from-accent/10 to-accent/5",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Connect instantly with students and teachers. File sharing, typing indicators, and more.",
    gradient: "from-primary/10 to-primary/5",
  },
  {
    icon: Award,
    title: "Badges & Levels",
    description: "Earn XP, unlock badges, and level up. Build reputation and stand out from the crowd.",
    gradient: "from-secondary/10 to-secondary/5",
  },
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    description: "Track your progress, earnings, and student feedback with powerful dashboards.",
    gradient: "from-accent/10 to-accent/5",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Global payments with Stripe and India-specific support via Razorpay. Your money is safe.",
    gradient: "from-primary/10 to-primary/5",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join a thriving community of learners, teachers, and mentors from around the world.",
    gradient: "from-secondary/10 to-secondary/5",
  },
];

export const Features = () => {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.2);
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation(0.1);
  
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  
  return (
    <section ref={sectionRef} className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Parallax background elements */}
      <motion.div 
        className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [50, -50]) }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl lg:text-5xl font-bold">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete platform combining the best of Fiverr, Chegg, Unacademy, and Discord
          </p>
        </motion.div>
        
        <div ref={gridRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={gridVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className={`p-6 h-full bg-gradient-to-br ${feature.gradient} border-border/50 cursor-pointer group`}
                >
                  <motion.div 
                    className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};