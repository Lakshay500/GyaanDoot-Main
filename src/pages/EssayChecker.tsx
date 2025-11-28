import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, ArrowLeft, Upload, Download, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryItem {
  essay: string;
  feedback: string;
  checkType: string;
  timestamp: Date;
}

const EssayChecker = () => {
  const [essay, setEssay] = useState("");
  const [checkType, setCheckType] = useState("comprehensive");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheck = async () => {
    if (!essay.trim()) {
      toast.error("Please enter your essay text");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('essay-checker', {
        body: { essay, checkType }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setFeedback(data.feedback);
      setHistory(prev => [{
        essay,
        feedback: data.feedback,
        checkType,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
      toast.success("Essay analysis complete!");
    } catch (error: any) {
      console.error('Error checking essay:', error);
      toast.error("Failed to analyze essay. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      toast.error("Please upload a .txt file");
      return;
    }

    try {
      const text = await file.text();
      setEssay(text);
      setWordCount(text.trim().split(/\s+/).length);
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Failed to read file");
    }
  };

  const handleEssayChange = (value: string) => {
    setEssay(value);
    setWordCount(value.trim().split(/\s+/).filter(w => w.length > 0).length);
  };

  const exportFeedback = () => {
    const content = `Essay:\n${essay}\n\nFeedback:\n${feedback}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'essay-feedback.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Feedback exported!");
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Essay Checker</h1>
              <p className="text-muted-foreground">Get AI-powered feedback on your writing</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Essay</CardTitle>
                      <CardDescription>Paste or upload your essay</CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {wordCount} words
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={checkType} onValueChange={setCheckType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive">Comprehensive Review</SelectItem>
                      <SelectItem value="grammar">Grammar & Spelling</SelectItem>
                      <SelectItem value="structure">Structure & Organization</SelectItem>
                      <SelectItem value="style">Style & Clarity</SelectItem>
                      <SelectItem value="plagiarism">Plagiarism Check</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEssay("");
                        setFeedback("");
                        setWordCount(0);
                      }}
                      className="flex-1"
                    >
                      Clear
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Paste your essay here..."
                    value={essay}
                    onChange={(e) => handleEssayChange(e.target.value)}
                    className="min-h-[350px] font-mono text-sm"
                  />

                  <Button 
                    onClick={handleCheck} 
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Check Essay"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>AI Feedback</CardTitle>
                      <CardDescription>Detailed analysis and suggestions</CardDescription>
                    </div>
                    {feedback && (
                      <Button variant="outline" size="sm" onClick={exportFeedback}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {feedback ? (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap">{feedback}</div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>Your feedback will appear here after analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Analysis History</CardTitle>
                <CardDescription>View your previous essay analyses</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4 pr-4">
                      {history.map((item, index) => (
                        <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setEssay(item.essay);
                            setFeedback(item.feedback);
                            setCheckType(item.checkType);
                          }}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base capitalize">{item.checkType} Check</CardTitle>
                              <span className="text-xs text-muted-foreground">
                                {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.essay.substring(0, 150)}...
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No history yet. Start analyzing essays to build your history.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EssayChecker;
