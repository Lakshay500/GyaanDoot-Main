import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Target, Users, Zap, Heart, TrendingUp, Globe } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { motion, useScroll, useTransform } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useRef } from "react";

const About = () => {
  const navigate = useNavigate();
  
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation(0.2);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation(0.1);
  const { ref: storyRef, isVisible: storyVisible } = useScrollAnimation(0.2);
  const { ref: valuesRef, isVisible: valuesVisible } = useScrollAnimation(0.1);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation(0.2);
  
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To democratize education by creating an accessible, community-driven platform where anyone can learn, teach, and grow.",
    },
    {
      icon: Users,
      title: "Community First",
      description: "Built by students, for students. Every feature is designed with the community's needs at the forefront.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Leveraging cutting-edge technology to deliver the best learning and teaching experience possible.",
    },
    {
      icon: Heart,
      title: "Inclusivity",
      description: "Creating a welcoming environment where learners from all backgrounds can thrive and succeed.",
    },
  ];

  const stats = [
    { number: "10,000+", label: "Active Students" },
    { number: "500+", label: "Expert Teachers" },
    { number: "1,000+", label: "Courses Available" },
    { number: "4.8/5", label: "Average Rating" },
  ];

  return (
    <PageTransition>
      <div ref={sectionRef} className="min-h-screen relative overflow-hidden">
      {/* Animated background with parallax */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 100]) }}
      />
      <motion.div 
        className="absolute top-40 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-80, 80]) }}
      />
      <motion.div 
        className="absolute bottom-40 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [60, -60]) }}
      />
      
      <Navbar />
      <main className="pt-24 pb-16 relative z-10">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div 
            ref={heroRef}
            initial={{ opacity: 0, y: 30 }}
            animate={heroVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-20 space-y-6"
          >
            <motion.h1 
              className="text-5xl lg:text-7xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              About{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                GyaanDoot
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              Empowering learners and educators worldwide through technology, 
              community, and a shared passion for knowledge.
            </motion.p>
          </motion.div>

          {/* Stats Section */}
          <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={statsVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
                  <CardHeader>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <CardTitle className="text-4xl lg:text-5xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {stat.number}
                      </CardTitle>
                    </motion.div>
                    <p className="text-muted-foreground mt-2 group-hover:text-primary transition-colors">{stat.label}</p>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Story Section */}
          <motion.div 
            ref={storyRef}
            initial={{ opacity: 0, y: 40 }}
            animate={storyVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="mb-20"
          >
            <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-primary/20 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-3xl mb-4">Our Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-lg leading-relaxed">
                <p>
                  GyaanDoot was born from a simple observation: traditional education platforms 
                  were either too complex, too expensive, or lacked the community aspect that 
                  makes learning truly engaging.
                </p>
                <p>
                  We set out to create something different—a platform where students could not 
                  only learn but also teach, where knowledge flows freely in all directions, 
                  and where everyone has the opportunity to grow.
                </p>
                <p>
                  Today, GyaanDoot serves thousands of learners and educators across the globe, 
                  facilitating meaningful connections and transformative learning experiences 
                  every single day.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Values Grid */}
          <div className="mb-20">
            <motion.h2 
              ref={valuesRef}
              initial={{ opacity: 0, y: 20 }}
              animate={valuesVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-center mb-12"
            >
              Our Core{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Values
              </span>
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={valuesVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                      <CardHeader>
                        <motion.div 
                          className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Icon className="w-6 h-6 text-primary" />
                        </motion.div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{value.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <motion.div 
            ref={ctaRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={ctaVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-br from-primary via-accent to-secondary text-white hover:shadow-2xl transition-all duration-300">
              <CardHeader className="space-y-6 p-12">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={ctaVisible ? { scale: 1, rotate: 0 } : {}}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <Globe className="w-16 h-16 mx-auto" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                >
                  <CardTitle className="text-4xl">Join Our Community</CardTitle>
                </motion.div>
                <motion.p 
                  className="text-xl text-white/90 max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  Be part of a global movement that's reshaping how we learn, teach, and grow together.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    variant="secondary"
                    className="mt-6 text-lg transition-transform"
                    onClick={() => navigate("/auth")}
                  >
                    Get Started Today
                  </Button>
                </motion.div>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default About;
