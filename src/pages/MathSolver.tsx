import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, Loader2, ArrowLeft, Copy, Check, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const EXAMPLE_PROBLEMS = [
  { label: "Linear Equation", problem: "Solve for x: 2x + 5 = 15", difficulty: "basic" },
  { label: "Quadratic", problem: "Solve: x² - 5x + 6 = 0", difficulty: "medium" },
  { label: "Calculus", problem: "Find the derivative of f(x) = 3x² + 2x - 1", difficulty: "advanced" },
  { label: "Trigonometry", problem: "Solve: sin(x) = 0.5 for 0 ≤ x ≤ 2π", difficulty: "advanced" },
];

const MathSolver = () => {
  const [problem, setProblem] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSolve = async () => {
    if (!problem.trim()) {
      toast.error("Please enter a math problem");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('math-solver', {
        body: { problem, difficulty }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSolution(data.solution);
      toast.success("Problem solved!");
    } catch (error: any) {
      console.error('Error solving math problem:', error);
      toast.error("Failed to solve problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example: typeof EXAMPLE_PROBLEMS[0]) => {
    setProblem(example.problem);
    setDifficulty(example.difficulty);
    toast.info("Example loaded");
  };

  const copySolution = () => {
    navigator.clipboard.writeText(solution);
    setCopied(true);
    toast.success("Solution copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link to="/ai-tools">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to AI Tools
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Math Solver</h1>
              <p className="text-muted-foreground">Solve math problems with step-by-step explanations</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Math Problem</CardTitle>
              <CardDescription>Enter your problem or try an example</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Try an Example</label>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROBLEMS.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => loadExample(example)}
                      className="text-xs"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      {example.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Basic</Badge>
                      Arithmetic, simple algebra
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Intermediate</Badge>
                      Equations, inequalities
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Advanced</Badge>
                      Calculus, trigonometry
                    </div>
                  </SelectItem>
                  <SelectItem value="expert">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Expert</Badge>
                      Complex analysis, proofs
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Enter your math problem here...&#10;&#10;Examples:&#10;• Solve for x: 2x + 5 = 15&#10;• Find the derivative of f(x) = 3x² + 2x - 1&#10;• Solve the integral: ∫(x² + 2x) dx&#10;• Factor: x² - 5x + 6"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="min-h-[320px] font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button 
                  onClick={handleSolve} 
                  disabled={loading}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Solving...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Solve Problem
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setProblem("");
                    setSolution("");
                  }}
                  disabled={loading}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Solution</CardTitle>
                  <CardDescription>Step-by-step explanation with concepts</CardDescription>
                </div>
                {solution && (
                  <Button variant="outline" size="icon" onClick={copySolution}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {solution ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{solution}</div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <Calculator className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="mb-2">Step-by-step solution will appear here</p>
                  <p className="text-xs">Try selecting an example above to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MathSolver;
