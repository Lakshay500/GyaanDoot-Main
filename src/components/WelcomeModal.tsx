import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, TrendingUp, Award, ArrowRight, ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tourSteps = [
  {
    icon: BookOpen,
    title: "Welcome to GyaanDoot!",
    description: "Your all-in-one platform for learning, teaching, and growing. Let's take a quick tour of what makes us special.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Learn from the Best",
    description: "Access thousands of courses created by expert teachers and industry mentors. From programming to design, business to personal development—we have it all.",
    gradient: "from-purple-500 to-pink-500",
    features: ["1000+ courses available", "Expert instructors", "Interactive quizzes", "Certificate of completion"],
  },
  {
    icon: TrendingUp,
    title: "Teach & Earn",
    description: "Share your knowledge and monetize your expertise. Create courses, offer mentorship, and build your reputation while earning money.",
    gradient: "from-orange-500 to-red-500",
    features: ["Create unlimited courses", "Flexible pricing", "Student analytics", "Monthly payouts"],
  },
  {
    icon: Award,
    title: "Gamified Learning",
    description: "Stay motivated with our XP system, leaderboards, and achievement badges. Compete with peers and track your progress in real-time.",
    gradient: "from-green-500 to-emerald-500",
    features: ["Earn XP points", "Climb leaderboards", "Unlock badges", "Track your growth"],
  },
];

export const WelcomeModal = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has seen the welcome modal
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      // Show modal after a short delay for better UX
      setTimeout(() => setOpen(true), 1000);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
      navigate("/auth");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const currentStepData = tourSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header with gradient background */}
        <div className={`bg-gradient-to-r ${currentStepData.gradient} p-8 text-white`}>
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-10 h-10" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl text-center text-white mb-2">
              {currentStepData.title}
            </DialogTitle>
            <DialogDescription className="text-lg text-center text-white/90">
              {currentStepData.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {currentStepData.features && (
            <div className="grid grid-cols-2 gap-4">
              {currentStepData.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 animate-in fade-in slide-in-from-bottom"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentStepData.gradient}`} />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress indicators */}
          <div className="flex justify-center gap-2">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between gap-4 pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              className={`flex-1 bg-gradient-to-r ${currentStepData.gradient} hover:opacity-90 transition-opacity text-white`}
            >
              {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
