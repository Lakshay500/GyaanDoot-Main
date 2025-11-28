import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reviewSchema } from "@/lib/validations";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface ReviewSectionProps {
  courseId: string;
  isEnrolled: boolean;
}

export const ReviewSection = ({ courseId, isEnrolled }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [courseId, user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profile data for each review
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", review.user_id)
            .single();

          return {
            ...review,
            profiles: profile,
          };
        })
      );

      setReviews(reviewsWithProfiles);
      setTotalReviews(reviewsWithProfiles.length);

      if (reviewsWithProfiles.length > 0) {
        const avg = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0) / reviewsWithProfiles.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }

      if (user) {
        const userRev = reviewsWithProfiles.find((r) => r.user_id === user.id);
        if (userRev) {
          setUserReview(userRev);
          setRating(userRev.rating);
          setReviewText(userRev.review_text || "");
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to leave a review.",
        variant: "destructive",
      });
      return;
    }

    const validation = reviewSchema.safeParse({
      rating,
      review_text: reviewText,
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from("course_reviews")
          .update({
            rating,
            review_text: reviewText || null,
          })
          .eq("id", userReview.id);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Your review has been updated.",
        });
      } else {
        // Create new review
        const { error } = await supabase.from("course_reviews").insert({
          course_id: courseId,
          user_id: user.id,
          rating,
          review_text: reviewText || null,
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Your review has been submitted.",
        });
      }

      setShowForm(false);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      const { error } = await supabase
        .from("course_reviews")
        .delete()
        .eq("id", userReview.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your review has been deleted.",
      });

      setUserReview(null);
      setRating(5);
      setReviewText("");
      setShowForm(false);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= (interactive ? hoveredStar || rating : count)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer transition-all" : ""}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              Reviews & Ratings
            </CardTitle>
            <CardDescription>
              {totalReviews > 0
                ? `${averageRating.toFixed(1)} average rating from ${totalReviews} review${totalReviews !== 1 ? "s" : ""}`
                : "No reviews yet"}
            </CardDescription>
          </div>
          {isEnrolled && user && !showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              {userReview ? (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Review
                </>
              ) : (
                "Write Review"
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Form */}
        {showForm && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              {renderStars(rating, true)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Review (Optional)</label>
              <Textarea
                placeholder="Share your experience with this course..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {reviewText.length}/2000 characters
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} disabled={loading}>
                {loading ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  if (userReview) {
                    setRating(userReview.rating);
                    setReviewText(userReview.review_text || "");
                  }
                }}
              >
                Cancel
              </Button>
              {userReview && (
                <Button variant="destructive" onClick={handleDeleteReview}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to review this course!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div key={review.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {review.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.profiles?.full_name || "Anonymous"}</p>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {user?.id === review.user_id && (
                      <Badge variant="secondary">Your Review</Badge>
                    )}
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-muted-foreground pl-12">
                      {review.review_text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
