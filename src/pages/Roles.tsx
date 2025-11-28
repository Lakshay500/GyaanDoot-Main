import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Award, Shield } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const roles = [
  {
    icon: GraduationCap,
    title: "Students",
    level: "Level 1",
    description: "Start your learning journey with access to thousands of courses and resources.",
    benefits: [
      "Access to all published courses",
      "Interactive quizzes and assessments",
      "Progress tracking and analytics",
      "Community forum access",
      "Certificate of completion",
      "Peer-to-peer chat",
    ],
    gradient: "from-blue-500 to-cyan-500",
    action: "Start Learning",
  },
  {
    icon: BookOpen,
    title: "Teachers",
    level: "Level 2",
    description: "Share your knowledge by creating and managing comprehensive courses.",
    benefits: [
      "All student benefits",
      "Create unlimited courses",
      "Course analytics dashboard",
      "Student progress tracking",
      "Monetization options",
      "Priority support",
    ],
    gradient: "from-purple-500 to-pink-500",
    action: "Start Teaching",
  },
  {
    icon: Award,
    title: "Mentors & Alumni",
    level: "Level 3",
    description: "Guide the next generation with your expertise and real-world experience.",
    benefits: [
      "All teacher benefits",
      "1-on-1 mentorship sessions",
      "Career guidance tools",
      "Premium profile badge",
      "Advanced analytics",
      "Higher revenue share",
    ],
    gradient: "from-orange-500 to-red-500",
    action: "Become a Mentor",
  },
  {
    icon: Shield,
    title: "Administrators",
    level: "Level 4",
    description: "Manage the platform, moderate content, and ensure quality standards.",
    benefits: [
      "All mentor benefits",
      "Platform management tools",
      "Content moderation",
      "User management",
      "System analytics",
      "Platform configuration",
    ],
    gradient: "from-green-500 to-emerald-500",
    action: "Admin Access",
  },
];

const Roles = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 animate-gradient" style={{ backgroundSize: '200% 200%' }} />
      
      <Navbar />
      <main className="pt-24 pb-16 relative">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom duration-700">
            <h1 className="text-5xl lg:text-6xl font-bold">
              User{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                Hierarchy
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A structured progression system designed to grow with you from student to administrator
            </p>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {roles.map((role, index) => {
              const Icon = role.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-primary/20 hover:border-primary/40 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {role.level}
                      </span>
                    </div>
                    <CardTitle className="text-2xl mb-2">{role.title}</CardTitle>
                    <CardDescription className="text-base">{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Benefits & Privileges
                      </h4>
                      <ul className="space-y-2">
                        {role.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      className={`w-full bg-gradient-to-r ${role.gradient} hover:opacity-90 transition-opacity text-white`}
                      onClick={() => navigate("/auth")}
                    >
                      {role.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Progression Path */}
          <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Your Growth Path</CardTitle>
              <CardDescription className="text-lg text-center mt-4">
                Start as a student and unlock new privileges as you contribute to the community. 
                Gain XP through learning, teaching, and helping others to advance through the ranks.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Roles;
