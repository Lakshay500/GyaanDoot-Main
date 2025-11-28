import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Users, ArrowRight, Star, TrendingUp, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useRef } from "react";

const roles = [
  {
    icon: GraduationCap,
    title: "For Students",
    description: "Unlock your potential with personalized learning paths, interactive courses, and a supportive community of peers and mentors.",
    detailedDescription: "Access world-class education from industry experts. Complete courses at your own pace, earn certificates, and build a portfolio that showcases your skills. Connect with mentors who can guide you through your learning journey and help you achieve your career goals.",
    benefits: [
      "Access to 1000+ premium courses",
      "Interactive quizzes and assessments",
      "Real-time doubt solving with teachers",
      "Earn certificates and build portfolio",
      "Connect with mentors for guidance",
      "Join study groups and forums",
      "Track progress with analytics",
      "Earn XP, badges, and rewards",
    ],
    cta: "Start Learning",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    stats: [
      { label: "Active Students", value: "50,000+" },
      { label: "Completion Rate", value: "92%" },
      { label: "Avg. Satisfaction", value: "4.8/5" },
    ],
    testimonial: {
      name: "Priya Sharma",
      role: "Computer Science Student",
      content: "GyaanDoot transformed my learning experience. The interactive courses and supportive mentors helped me land my dream internship at a top tech company!",
      rating: 5,
      avatar: "PS",
    },
    successStory: {
      title: "From Student to Software Engineer",
      description: "Completed 15 courses in 6 months, built 8 projects, and secured a job at a Fortune 500 company.",
    },
  },
  {
    icon: BookOpen,
    title: "For Teachers",
    description: "Share your expertise with eager learners worldwide. Create engaging courses, host live sessions, and build a thriving teaching business.",
    detailedDescription: "Transform your knowledge into income. Our platform provides all the tools you need to create professional courses, manage students, and track your success. With comprehensive analytics and marketing support, you can focus on what you do best—teaching.",
    benefits: [
      "Create unlimited courses with ease",
      "Host live interactive classes",
      "Advanced course builder with templates",
      "Student management dashboard",
      "Detailed analytics and insights",
      "Flexible pricing and promotions",
      "0% commission for first 60 days",
      "Instant payouts and earnings reports",
    ],
    cta: "Start Teaching",
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    stats: [
      { label: "Active Teachers", value: "5,000+" },
      { label: "Avg. Monthly Earning", value: "₹45,000" },
      { label: "Student Satisfaction", value: "4.9/5" },
    ],
    testimonial: {
      name: "Rajesh Kumar",
      role: "Web Development Instructor",
      content: "I've taught over 10,000 students on GyaanDoot and built a six-figure teaching business. The platform's tools and support make it incredibly easy to focus on creating quality content.",
      rating: 5,
      avatar: "RK",
    },
    successStory: {
      title: "Built a Teaching Empire",
      description: "Created 25 courses, taught 12,000+ students, and now earns ₹2.5L+ monthly while working from home.",
    },
  },
  {
    icon: Users,
    title: "For Mentors & Alumni",
    description: "Guide the next generation with your industry experience. Offer personalized mentorship, career counseling, and help shape future leaders.",
    detailedDescription: "Your real-world experience is invaluable. Connect with ambitious students and professionals seeking guidance. Conduct one-on-one sessions, review resumes, prepare candidates for interviews, and help them navigate their career paths while building your personal brand.",
    benefits: [
      "One-on-one mentorship sessions",
      "Flexible scheduling system",
      "Career counseling and guidance",
      "Resume and portfolio reviews",
      "Mock interviews and prep",
      "Industry insights sharing",
      "Premium profile badge",
      "Higher revenue share (85%)",
    ],
    cta: "Become a Mentor",
    gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
    stats: [
      { label: "Active Mentors", value: "2,500+" },
      { label: "Mentorship Sessions", value: "50,000+" },
      { label: "Success Rate", value: "96%" },
    ],
    testimonial: {
      name: "Dr. Anita Desai",
      role: "Senior Software Architect",
      content: "Mentoring on GyaanDoot allows me to give back to the community while building meaningful connections. I've helped 200+ students transition into tech careers successfully.",
      rating: 5,
      avatar: "AD",
    },
    successStory: {
      title: "Mentored 500+ Future Leaders",
      description: "Helped students from 15+ countries secure jobs at Google, Microsoft, Amazon, and top startups.",
    },
  },
];

export const UserRoles = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.2);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const yBg1 = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const yBg2 = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={sectionRef} id="roles" className="py-24 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Parallax decorative elements */}
      <motion.div 
        className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        style={{ y: yBg1 }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
        style={{ y: yBg2 }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-20 space-y-4"
        >
          <Badge variant="outline" className="text-sm px-4 py-2 border-primary/30 bg-primary/5">
            <Users className="w-3 h-3 mr-2 inline" />
            Join Our Community
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-bold">
            Built for{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Everyone
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Whether you want to learn, teach, or mentor—discover how GyaanDoot can help you achieve your goals
          </p>
        </motion.div>
        
        <div className="space-y-16">
          {roles.map((role, index) => {
            const Icon = role.icon;
            const isReversed = index % 2 !== 0;
            const { ref: cardRef, isVisible: cardVisible } = useScrollAnimation(0.15);
            
            return (
              <motion.div
                key={index}
                ref={cardRef}
                initial={{ opacity: 0, x: isReversed ? 100 : -100, y: 20 }}
                animate={cardVisible ? { opacity: 1, x: 0, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                className={`grid lg:grid-cols-2 gap-12 items-start`}
              >
                {/* Main Content Card */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={`p-8 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${role.gradient} border-2 hover:border-primary/30 ${isReversed ? 'lg:order-2' : ''}`}>
                  <CardHeader className="p-0 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {role.stats[0].value} Users
                      </Badge>
                    </div>
                    <CardTitle className="text-3xl mb-3">{role.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {role.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-0 space-y-6">
                    {/* Detailed Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {role.detailedDescription}
                    </p>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {role.benefits.map((benefit, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span className="text-xs leading-tight">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                      {role.stats.map((stat, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full mt-6 hover:scale-105 transition-all shadow-md hover:shadow-xl"
                      size="lg"
                      onClick={() => navigate("/auth")}
                    >
                      {role.cta}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
                </motion.div>

                {/* Testimonial & Success Story */}
                <div className={`space-y-6 ${isReversed ? 'lg:order-1' : ''}`}>
                  {/* Testimonial Card */}
                  <motion.div
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-12 h-12 border-2 border-primary">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                          {role.testimonial.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold">{role.testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{role.testimonial.role}</div>
                        <div className="flex gap-1 mt-1">
                          {[...Array(role.testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                      "{role.testimonial.content}"
                    </p>
                  </Card>
                  </motion.div>

                  {/* Success Story Card */}
                  <motion.div
                    whileHover={{ scale: 1.03, y: -3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{role.successStory.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {role.successStory.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-sm text-primary">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">Real Success Story</span>
                    </div>
                  </Card>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-2 border-primary/20">
              <h3 className="text-2xl font-bold mb-3">Ready to Start Your Journey?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of students, teachers, and mentors who are already transforming their lives on GyaanDoot.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg"
                  onClick={() => navigate("/auth")}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};