import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Quote, Star } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Student",
    type: "Student",
    avatar: "PS",
    rating: 5,
    text: "GyaanDoot transformed my learning journey! The interactive quizzes and mentor support helped me land my dream job in tech. The platform's gamification kept me motivated throughout.",
    achievement: "Got placed at Google",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Rajesh Kumar",
    role: "Teacher",
    type: "Teacher",
    avatar: "RK",
    rating: 5,
    text: "As an educator, I've found GyaanDoot to be the perfect platform to share my knowledge. The analytics tools help me understand my students better, and I've already earned ₹2 lakhs teaching here!",
    achievement: "2,500+ students taught",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Dr. Anita Desai",
    role: "Mentor",
    type: "Mentor",
    avatar: "AD",
    rating: 5,
    text: "Mentoring on GyaanDoot allows me to give back to the community while staying connected with the industry. The platform makes scheduling and managing sessions incredibly easy.",
    achievement: "1,000+ mentorship hours",
    gradient: "from-orange-500 to-red-500",
  },
  {
    name: "Arjun Patel",
    role: "Student",
    type: "Student",
    avatar: "AP",
    rating: 5,
    text: "The community-driven approach makes learning so much more engaging! I've made connections with peers and mentors who've helped me grow beyond just technical skills.",
    achievement: "Top 10 on leaderboard",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Sneha Reddy",
    role: "Teacher",
    type: "Teacher",
    avatar: "SR",
    rating: 5,
    text: "Creating courses on GyaanDoot is intuitive and rewarding. The platform handles all the technical aspects, so I can focus on delivering quality content. My courses have reached students across India!",
    achievement: "50+ courses published",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    name: "Prof. Vikram Singh",
    role: "Mentor",
    type: "Mentor",
    avatar: "VS",
    rating: 5,
    text: "GyaanDoot bridges the gap between academic knowledge and industry requirements. I love guiding students through real-world challenges and seeing them succeed in their careers.",
    achievement: "Alumni mentorship leader",
    gradient: "from-indigo-500 to-purple-500",
  },
];

export const TestimonialsCarousel = () => {
  const sectionRef = useRef(null);
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation(0.2);
  const { ref: carouselRef, isVisible: carouselVisible } = useScrollAnimation(0.1);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const yBg = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      <motion.div 
        className="absolute inset-0 bg-grid-pattern opacity-5"
        style={{ y: yBg }}
      />
      <motion.div 
        className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-80, 80]) }}
      />
      <motion.div 
        className="absolute bottom-20 left-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl"
        style={{ y: useTransform(scrollYProgress, [0, 1], [80, -80]) }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 space-y-4"
        >
          <Badge className="mb-4" variant="secondary">
            <Star className="w-4 h-4 mr-2 fill-current" />
            Success Stories
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Thousands
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hear from our community of learners, educators, and mentors who are achieving their goals on GyaanDoot
          </p>
        </motion.div>

        <motion.div
          ref={carouselRef}
          initial={{ opacity: 0, y: 40 }}
          animate={carouselVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <motion.div 
                  className="p-1 h-full"
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="h-full border-2 hover:border-primary/50 transition-all hover:shadow-xl">
                    <CardContent className="p-6 space-y-4">
                      {/* Quote Icon */}
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient}`}>
                        <Quote className="w-6 h-6 text-white" />
                      </div>

                      {/* Rating */}
                      <div className="flex gap-1">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                        ))}
                      </div>

                      {/* Testimonial Text */}
                      <p className="text-muted-foreground leading-relaxed">
                        "{testimonial.text}"
                      </p>

                      {/* Achievement Badge */}
                      <Badge variant="secondary" className="w-fit">
                        {testimonial.achievement}
                      </Badge>

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-4 border-t">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className={`bg-gradient-to-br ${testimonial.gradient} text-white font-semibold`}>
                            {testimonial.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
        </motion.div>
      </div>
    </section>
  );
};
