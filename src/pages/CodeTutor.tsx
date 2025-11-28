import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Loader2, ArrowLeft, Bug, Lightbulb, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const CodeTutor = () => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"explain" | "debug" | "improve">("explain");
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code");
      return;
    }

    setLoading(true);
    try {
      let enhancedQuestion = question;
      
      if (mode === "debug") {
        enhancedQuestion = `Debug this code and identify potential bugs or errors: ${question}`;
      } else if (mode === "improve") {
        enhancedQuestion = `Suggest improvements and optimizations for this code: ${question}`;
      }

      const { data, error } = await supabase.functions.invoke('code-tutor', {
        body: { code, language, question: enhancedQuestion }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setExplanation(data.explanation);
      toast.success("Code analysis complete!");
    } catch (error: any) {
      console.error('Error analyzing code:', error);
      toast.error("Failed to analyze code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      javascript: "text-yellow-500",
      python: "text-blue-500",
      java: "text-red-500",
      cpp: "text-purple-500",
      csharp: "text-green-500",
      ruby: "text-rose-500",
      go: "text-cyan-500",
      rust: "text-orange-500",
      typescript: "text-blue-600",
    };
    return colors[lang] || "text-gray-500";
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Code Tutor</h1>
              <p className="text-muted-foreground">Learn programming with AI-powered explanations</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Code</CardTitle>
                  <CardDescription>Paste code and select analysis mode</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("javascript")}`} />
                        JavaScript
                      </div>
                    </SelectItem>
                    <SelectItem value="python">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("python")}`} />
                        Python
                      </div>
                    </SelectItem>
                    <SelectItem value="java">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("java")}`} />
                        Java
                      </div>
                    </SelectItem>
                    <SelectItem value="cpp">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("cpp")}`} />
                        C++
                      </div>
                    </SelectItem>
                    <SelectItem value="csharp">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("csharp")}`} />
                        C#
                      </div>
                    </SelectItem>
                    <SelectItem value="ruby">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("ruby")}`} />
                        Ruby
                      </div>
                    </SelectItem>
                    <SelectItem value="go">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("go")}`} />
                        Go
                      </div>
                    </SelectItem>
                    <SelectItem value="rust">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("rust")}`} />
                        Rust
                      </div>
                    </SelectItem>
                    <SelectItem value="typescript">
                      <div className="flex items-center gap-2">
                        <Code2 className={`h-4 w-4 ${getLanguageColor("typescript")}`} />
                        TypeScript
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="flex-1">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="explain" className="text-xs">
                      <Code2 className="h-3 w-3 mr-1" />
                      Explain
                    </TabsTrigger>
                    <TabsTrigger value="debug" className="text-xs">
                      <Bug className="h-3 w-3 mr-1" />
                      Debug
                    </TabsTrigger>
                    <TabsTrigger value="improve" className="text-xs">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Improve
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Input
                placeholder={
                  mode === "explain" ? "Ask a question about the code (optional)" :
                  mode === "debug" ? "Describe the error or issue (optional)" :
                  "What aspect should we improve? (optional)"
                }
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              <div className="relative">
                <Textarea
                  placeholder="Paste your code here..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="min-h-[350px] font-mono text-sm bg-muted/30"
                  spellCheck={false}
                />
                <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  {code.split('\n').length} lines
                </div>
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : mode === "explain" ? (
                  "Explain Code"
                ) : mode === "debug" ? (
                  "Find Bugs"
                ) : (
                  "Suggest Improvements"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {mode === "explain" ? "AI Explanation" :
                 mode === "debug" ? "Bug Analysis" :
                 "Improvement Suggestions"}
              </CardTitle>
              <CardDescription>
                {mode === "explain" ? "Detailed code analysis and concepts" :
                 mode === "debug" ? "Potential bugs and fixes" :
                 "Optimization and best practices"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {explanation ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{explanation}</div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  {mode === "explain" ? (
                    <Code2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  ) : mode === "debug" ? (
                    <Bug className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  ) : (
                    <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  )}
                  <p>
                    {mode === "explain" ? "Code explanation will appear here" :
                     mode === "debug" ? "Bug analysis will appear here" :
                     "Improvement suggestions will appear here"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CodeTutor;
