import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, DollarSign, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MentorBookingCalendarProps {
  mentorId: string;
  mentorName: string;
  hourlyRate: number;
  onClose: () => void;
}

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const TIME_ZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

export const MentorBookingCalendar = ({ 
  mentorId, 
  mentorName, 
  hourlyRate,
  onClose 
}: MentorBookingCalendarProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedDate, mentorId]);

  const fetchBookedSlots = async () => {
    if (!selectedDate) return;

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('session_bookings')
      .select('scheduled_at')
      .eq('mentor_id', mentorId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
      .in('status', ['pending', 'confirmed']);

    if (data) {
      const booked = data.map(b => format(new Date(b.scheduled_at), 'HH:mm'));
      setBookedSlots(booked);
    }
  };

  const handlePaymentAndBooking = async () => {
    if (!user || !selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }

    setPaymentLoading(true);
    try {
      // Create checkout session for payment
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-mentor-payment',
        {
          body: {
            mentorId,
            amount: hourlyRate,
            scheduledAt: `${format(selectedDate, 'yyyy-MM-dd')} ${selectedTime}`,
            timeZone: selectedTimeZone,
          }
        }
      );

      if (checkoutError) throw checkoutError;

      // Redirect to Stripe Checkout
      if (checkoutData?.url) {
        window.open(checkoutData.url, '_blank');
        toast.success("Redirecting to payment...");
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to process payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const isSlotAvailable = (time: string) => !bookedSlots.includes(time);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Session with {mentorName}</CardTitle>
        <CardDescription>
          Select date, time, and timezone for your mentoring session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Date</label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || date < new Date(Date.now() - 86400000)}
            className="rounded-md border"
          />
        </div>

        {selectedDate && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Select Time Zone</label>
              <Select value={selectedTimeZone} onValueChange={setSelectedTimeZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_ZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Available Time Slots</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map(time => {
                  const available = isSlotAvailable(time);
                  return (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      disabled={!available}
                      onClick={() => setSelectedTime(time)}
                      className="w-full"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {time}
                    </Button>
                  );
                })}
              </div>
            </div>

            {selectedTime && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Duration:</span>
                  <span>60 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {hourlyRate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date & Time:</span>
                  <span>{format(selectedDate, 'MMM dd, yyyy')} at {selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time Zone:</span>
                  <span className="text-sm">{TIME_ZONES.find(tz => tz.value === selectedTimeZone)?.label}</span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={paymentLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentAndBooking}
            disabled={!selectedDate || !selectedTime || paymentLoading}
            className="flex-1"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {paymentLoading ? "Processing..." : "Pay & Book Session"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
