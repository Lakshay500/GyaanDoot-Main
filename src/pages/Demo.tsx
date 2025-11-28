import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, PlayCircle, BookOpen, Users, Award, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import { motion, useScroll, useTransform } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export default function Demo() {
  const [quizProgress, setQuizProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const { toast } = useToast();

  const demoQuestions = [
    {
      question: "What is the primary benefit of online learning platforms?",
      options: ["Flexibility", "Lower cost", "Access to experts", "All of the above"],
      correct: 3
    },
    {
      question: "How do mentors help students on GyaanDoot?",
      options: ["Only through messages", "Live sessions and guidance", "Pre-recorded videos only", "None of these"],
      correct: 1
    },
    {
      question: "What makes GyaanDoot unique?",
      options: ["Only courses", "Community-driven platform", "No quizzes", "Limited content"],
      correct: 1
    }
  ];

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === demoQuestions[currentQuestion].correct) {
      setScore(score + 1);
      toast({
        title: "Correct! 🎉",
        description: "Great job! Moving to the next question.",
      });
    } else {
      toast({
        title: "Not quite right",
        description: "Keep learning! Every mistake is a step forward.",
        variant: "destructive",
      });
    }

    const newProgress = ((currentQuestion + 1) / demoQuestions.length) * 100;
    setQuizProgress(newProgress);

    if (currentQuestion < demoQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setQuizProgress(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
  };

  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation(0.2);
  const { ref: tabsRef, isVisible: tabsVisible } = useScrollAnimation(0.1);
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation(0.2);
  
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  return (
    <PageTransition>
      <div ref={sectionRef} className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background with parallax */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" 
        style={{ 
          y: useTransform(scrollYProgress, [0, 1], [0, 100]),
          backgroundSize: '200% 200%' 
        }} 
      />
      <motion.div 
        className="absolute top-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
      />
      
      <Navbar />
      
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <motion.div 
              ref={heroRef}
              initial={{ opacity: 0, y: 30 }}
              animate={heroVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="max-w-4xl mx-auto text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={heroVisible ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground border-none" variant="secondary">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Interactive Demo
                </Badge>
              </motion.div>
              <motion.h1 
                className="text-5xl lg:text-6xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={heroVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
              >
                Experience{" "}
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  GyaanDoot
                </span>
              </motion.h1>
              <motion.p 
                className="text-xl text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={heroVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                Try our platform's key features without signing up. Explore courses, take quizzes, 
                and see how mentorship works in action.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Interactive Demo Tabs */}
        <section className="py-16 relative">
          <div className="container mx-auto px-4">
            <motion.div
              ref={tabsRef}
              initial={{ opacity: 0, y: 40 }}
              animate={tabsVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Tabs defaultValue="quiz" className="max-w-5xl mx-auto">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 h-auto">
                <TabsTrigger value="quiz" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground py-3 text-lg">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Quiz System
                </TabsTrigger>
                <TabsTrigger value="course" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-accent data-[state=active]:text-secondary-foreground py-3 text-lg">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Course Preview
                </TabsTrigger>
                <TabsTrigger value="mentorship" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary data-[state=active]:text-accent-foreground py-3 text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Mentorship
                </TabsTrigger>
              </TabsList>

              {/* Quiz System Demo */}
              <TabsContent value="quiz" className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                <Card className="overflow-hidden shadow-lg border-primary/20 hover:shadow-2xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-primary/20 via-secondary/10 to-accent/20">
                    <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Interactive Quiz Demo</CardTitle>
                    <CardDescription>
                      Experience our adaptive quiz system with instant feedback
                    </CardDescription>
                    <Progress value={quizProgress} className="mt-4" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!quizComplete ? (
                      <>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Question {currentQuestion + 1} of {demoQuestions.length}</span>
                            <span>Score: {score}/{demoQuestions.length}</span>
                          </div>
                          
                          <h3 className="text-xl font-semibold">
                            {demoQuestions[currentQuestion].question}
                          </h3>
                          
                          <div className="space-y-3">
                            {demoQuestions[currentQuestion].options.map((option, index) => (
                              <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                                  selectedAnswer === index
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              >
                                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={handleNextQuestion}
                          disabled={selectedAnswer === null}
                          className="w-full"
                          size="lg"
                        >
                          {currentQuestion < demoQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center space-y-6 py-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                          <Award className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-bold mb-2">Quiz Complete!</h3>
                          <p className="text-xl text-muted-foreground">
                            Your Score: {score} out of {demoQuestions.length}
                          </p>
                          <p className="text-lg text-muted-foreground mt-2">
                            {score === demoQuestions.length
                              ? "Perfect score! You're ready to excel!"
                              : score >= demoQuestions.length / 2
                              ? "Great job! Keep learning to improve further."
                              : "Good effort! Practice makes perfect."}
                          </p>
                        </div>
                        <div className="flex gap-4 justify-center">
                          <Button onClick={resetQuiz} variant="outline" size="lg">
                            Try Again
                          </Button>
                          <Button size="lg">
                            Start Learning
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Course Preview Demo */}
              <TabsContent value="course" className="space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">Sample Course: Web Development Basics</CardTitle>
                    <CardDescription>
                      See how our courses are structured with clear sections and progress tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      {[
                        { title: "Introduction to HTML", completed: true, duration: "15 min" },
                        { title: "CSS Fundamentals", completed: true, duration: "20 min" },
                        { title: "JavaScript Basics", completed: false, duration: "30 min" },
                        { title: "Building Your First Website", completed: false, duration: "45 min" },
                      ].map((section, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            section.completed
                              ? "border-primary/50 bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {section.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-primary" />
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-muted-foreground" />
                              )}
                              <div>
                                <h4 className="font-semibold">{section.title}</h4>
                                <p className="text-sm text-muted-foreground">{section.duration}</p>
                              </div>
                            </div>
                            <Button variant={section.completed ? "outline" : "default"} size="sm">
                              {section.completed ? "Review" : "Start"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Course Progress</span>
                        <span className="font-semibold">50%</span>
                      </div>
                      <Progress value={50} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mentorship Demo */}
              <TabsContent value="mentorship" className="space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">Connect with Expert Mentors</CardTitle>
                    <CardDescription>
                      Get personalized guidance from industry professionals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {[
                        {
                          name: "Dr. Sarah Johnson",
                          role: "Data Science Expert",
                          experience: "15 years",
                          sessions: "1,200+",
                          rating: "4.9",
                          topics: ["Machine Learning", "Python", "Statistics"],
                        },
                        {
                          name: "Michael Chen",
                          role: "Full Stack Developer",
                          experience: "10 years",
                          sessions: "850+",
                          rating: "4.8",
                          topics: ["React", "Node.js", "System Design"],
                        },
                      ].map((mentor, index) => (
                        <Card key={index} className="border">
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
                                {mentor.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg">{mentor.name}</CardTitle>
                                <CardDescription>{mentor.role}</CardDescription>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="secondary">{mentor.experience}</Badge>
                                  <Badge variant="outline">{mentor.rating}★</Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {mentor.sessions} mentorship sessions completed
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {mentor.topics.map((topic) => (
                                  <Badge key={topic} variant="secondary">
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button className="w-full">Book Session</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 relative">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 blur-3xl"
            style={{ y: useTransform(scrollYProgress, [0.8, 1], [-30, 30]) }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              ref={ctaRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={ctaVisible ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center space-y-6"
            >
              <motion.h2 
                className="text-4xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
              >
                Ready to Start Your Journey?
              </motion.h2>
              <motion.p 
                className="text-xl text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
              >
                Join thousands of learners and educators on GyaanDoot today.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  size="xl" 
                  variant="hero" 
                  className="hover:scale-105 transition-all"
                  onClick={() => window.location.href = '/auth'}
                >
                  Create Free Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </PageTransition>
  );
}
