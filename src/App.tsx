import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TopLoadingBar } from "@/components/TopLoadingBar";
import { CommandPalette } from "@/components/CommandPalette";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AnimatePresence } from "framer-motion";
import "./App.css";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import QuizInterface from "./pages/QuizInterface";
import CreateCourse from "./pages/CreateCourse";
import EditCourse from "./pages/EditCourse";
import MyCourses from "./pages/MyCourses";
import StudentDashboard from "./pages/StudentDashboard";
import CourseAnalytics from "./pages/CourseAnalytics";
import Features from "./pages/Features";
import Roles from "./pages/Roles";
import About from "./pages/About";
import Demo from "./pages/Demo";
import Leaderboard from "./pages/Leaderboard";
import MentorSessions from "./pages/MentorSessions";
import MentorMarketplace from "./pages/MentorMarketplace";
import MentorProfile from "./pages/MentorProfile";
import AITools from "./pages/AITools";
import EssayChecker from "./pages/EssayChecker";
import CodeTutor from "./pages/CodeTutor";
import MathSolver from "./pages/MathSolver";
import FlashcardGenerator from "./pages/FlashcardGenerator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  useKeyboardShortcuts();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/new" element={<CreateCourse />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:id/edit" element={<EditCourse />} />
        <Route path="/courses/:id/analytics" element={<CourseAnalytics />} />
        <Route path="/courses/:id/quiz" element={<QuizInterface />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/mentor-sessions" element={<MentorSessions />} />
        <Route path="/mentors" element={<MentorMarketplace />} />
        <Route path="/mentor/:mentorId" element={<MentorProfile />} />
        <Route path="/features" element={<Features />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/about" element={<About />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/ai-tools" element={<AITools />} />
        <Route path="/ai-tools/essay-checker" element={<EssayChecker />} />
        <Route path="/ai-tools/code-tutor" element={<CodeTutor />} />
        <Route path="/ai-tools/math-solver" element={<MathSolver />} />
        <Route path="/ai-tools/flashcard-generator" element={<FlashcardGenerator />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TopLoadingBar />
        <CommandPalette />
        <InstallPrompt />
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
