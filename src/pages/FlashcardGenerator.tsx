import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Flashcard {
  question: string;
  answer: string;
  category: string;
}

const FlashcardGenerator = () => {
  const [content, setContent] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('flashcard-generator', {
        body: { content, count, difficulty }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setFlashcards(data.flashcards);
      setFlippedCards(new Set());
      toast.success(`Generated ${data.flashcards.length} flashcards!`);
    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      toast.error("Failed to generate flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (index: number) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };

  const exportFlashcards = () => {
    const csvContent = [
      "Question,Answer,Category",
      ...flashcards.map(card => 
        `"${card.question.replace(/"/g, '""')}","${card.answer.replace(/"/g, '""')}","${card.category}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Flashcards exported!");
  };

  const startPractice = () => {
    setPracticeMode(true);
    setCurrentCardIndex(0);
    setFlippedCards(new Set());
    setMasteredCards(new Set());
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setFlippedCards(new Set());
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setFlippedCards(new Set());
    }
  };

  const markAsMastered = () => {
    setMasteredCards(prev => new Set([...prev, currentCardIndex]));
    nextCard();
  };

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentCardIndex(0);
    toast.success("Cards shuffled!");
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Flashcard Generator</h1>
              <p className="text-muted-foreground">Create study flashcards from any content</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Content Input</CardTitle>
              <CardDescription>Paste your study material</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Number of Cards</label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Textarea
                placeholder="Paste your notes, textbook content, or any study material here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] text-sm"
              />

              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Flashcards"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {practiceMode ? "Practice Mode" : "Generated Flashcards"}
                  </CardTitle>
                  <CardDescription>
                    {practiceMode 
                      ? `Card ${currentCardIndex + 1} of ${flashcards.length} • ${masteredCards.size} mastered`
                      : "Click cards to flip them or start practice mode"
                    }
                  </CardDescription>
                </div>
                {flashcards.length > 0 && !practiceMode && (
                  <div className="flex gap-2">
                    <Button onClick={startPractice} variant="default" size="sm">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Practice
                    </Button>
                    <Button onClick={shuffleCards} variant="outline" size="sm">
                      Shuffle
                    </Button>
                    <Button onClick={exportFlashcards} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                )}
                {practiceMode && (
                  <Button onClick={() => setPracticeMode(false)} variant="outline" size="sm">
                    Exit Practice
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {flashcards.length > 0 ? (
                practiceMode ? (
                  <div className="space-y-6">
                    <Card 
                      className="cursor-pointer hover:shadow-xl transition-all min-h-[400px] flex flex-col bg-gradient-to-br from-primary/5 to-accent/5"
                      onClick={() => toggleCard(currentCardIndex)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant={masteredCards.has(currentCardIndex) ? "default" : "secondary"}>
                            {flashcards[currentCardIndex].category}
                          </Badge>
                          {masteredCards.has(currentCardIndex) && (
                            <Badge className="bg-green-500">Mastered</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex items-center justify-center text-center p-12">
                        <p className="text-2xl leading-relaxed">
                          {flippedCards.has(currentCardIndex) 
                            ? flashcards[currentCardIndex].answer 
                            : flashcards[currentCardIndex].question
                          }
                        </p>
                      </CardContent>
                      <div className="px-6 pb-6 text-center text-muted-foreground">
                        {flippedCards.has(currentCardIndex) 
                          ? "Click to see question" 
                          : "Click to reveal answer"
                        }
                      </div>
                    </Card>

                    <div className="flex items-center justify-between gap-4">
                      <Button
                        onClick={previousCard}
                        disabled={currentCardIndex === 0}
                        variant="outline"
                        className="flex-1"
                      >
                        Previous
                      </Button>
                      
                      {flippedCards.has(currentCardIndex) && !masteredCards.has(currentCardIndex) && (
                        <Button
                          onClick={markAsMastered}
                          variant="default"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Mark as Mastered
                        </Button>
                      )}

                      <Button
                        onClick={nextCard}
                        disabled={currentCardIndex === flashcards.length - 1}
                        variant="outline"
                        className="flex-1"
                      >
                        Next
                      </Button>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {flashcards.map((card, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className="cursor-pointer hover:shadow-lg transition-all min-h-[180px] flex flex-col"
                          onClick={() => toggleCard(index)}
                        >
                          <CardHeader className="pb-2">
                            <Badge variant="outline" className="text-xs w-fit">
                              {card.category}
                            </Badge>
                          </CardHeader>
                          <CardContent className="flex-1 flex items-center justify-center text-center p-4">
                            <p className="text-sm leading-relaxed line-clamp-4">
                              {flippedCards.has(index) ? card.answer : card.question}
                            </p>
                          </CardContent>
                          <div className="px-4 pb-3 text-xs text-muted-foreground text-center">
                            {flippedCards.has(index) ? "Question" : "Answer"}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Your flashcards will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlashcardGenerator;
