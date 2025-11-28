import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Code2, Calculator, BookOpen, Sparkles } from "lucide-react";

const AITools = () => {
  const tools = [
    {
      title: "Essay Checker",
      description: "Get AI-powered feedback on grammar, structure, style, and plagiarism detection",
      icon: FileText,
      path: "/ai-tools/essay-checker",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Code Tutor",
      description: "Explain code, debug errors, and learn programming concepts with AI assistance",
      icon: Code2,
      path: "/ai-tools/code-tutor",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Math Solver",
      description: "Solve math problems step-by-step with detailed explanations and concepts",
      icon: Calculator,
      path: "/ai-tools/math-solver",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Flashcard Generator",
      description: "Automatically generate study flashcards from any content or notes",
      icon: BookOpen,
      path: "/ai-tools/flashcard-generator",
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 text-primary">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-bold">AI Tools Suite</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful AI-powered tools to enhance your learning experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={tool.path}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {tool.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-primary font-medium group-hover:underline">
                      Launch Tool →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AITools;
