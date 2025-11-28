import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, DollarSign, Video, MessageSquare, TrendingUp, Users, Award, Shield } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const features = [
  {
    icon: BookOpen,
    title: "Learn & Teach",
    description: "Access thousands of courses or create your own to share knowledge with students worldwide.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: DollarSign,
    title: "Buy & Sell Services",
    description: "Monetize your expertise by offering tutoring, mentorship, and consulting services.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: Video,
    title: "Live Classes",
    description: "Host interactive live sessions with screen sharing, whiteboards, and real-time collaboration.",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "Connect with peers, form study groups, and get instant help from mentors.",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    description: "Track your learning progress, quiz scores, and achievement milestones over time.",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
  {
    icon: Users,
    title: "Community-Driven",
    description: "Built by students, for students. Join a thriving community of learners and educators.",
    gradient: "from-teal-500/20 to-green-500/20",
  },
  {
    icon: Award,
    title: "Leaderboards & XP",
    description: "Earn experience points, climb leaderboards, and unlock badges as you progress.",
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Industry-standard encryption and secure payment processing for all transactions.",
    gradient: "from-rose-500/20 to-pink-500/20",
  },
];

const Features = () => {
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
              Platform{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                Features
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to learn, teach, and grow in one comprehensive platform
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-primary/20 hover:border-primary/40 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Coming Soon Section */}
          <div className="mt-20 text-center">
            <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl">More Features Coming Soon!</CardTitle>
                <CardDescription className="text-lg mt-4">
                  We're constantly working on new features including advanced AI tutoring, 
                  collaborative whiteboards, mobile apps, and much more.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </PageTransition>
  );
};

export default Features;
