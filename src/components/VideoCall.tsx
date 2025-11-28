import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, Phone } from "lucide-react";
import { toast } from "sonner";

interface VideoCallProps {
  sessionId: string;
  sessionName: string;
  onEnd?: () => void;
}

export const VideoCall = ({ sessionId, sessionName, onEnd }: VideoCallProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [roomUrl, setRoomUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    createVideoRoom();
  }, [sessionId]);

  const createVideoRoom = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { sessionId, sessionName }
      });

      if (error) throw error;

      setRoomUrl(data.roomUrl);
      setLoading(false);
      
      toast.success("Video room created successfully");
    } catch (error) {
      console.error("Error creating video room:", error);
      toast.error("Failed to create video room");
      setLoading(false);
    }
  };

  const toggleVideo = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        action: 'toggle-video'
      }, '*');
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        action: 'toggle-audio'
      }, '*');
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleScreenShare = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        action: 'toggle-screen-share'
      }, '*');
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const endCall = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        action: 'leave-call'
      }, '*');
    }
    onEnd?.();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading video call...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {sessionName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
            {roomUrl && (
              <iframe
                ref={iframeRef}
                src={roomUrl}
                className="w-full h-full"
                allow="camera; microphone; fullscreen; display-capture"
              />
            )}
          </div>
          
          <div className="flex justify-center gap-2">
            <Button
              variant={isVideoOn ? "default" : "destructive"}
              size="icon"
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant={isAudioOn ? "default" : "destructive"}
              size="icon"
              onClick={toggleAudio}
            >
              {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant={isScreenSharing ? "secondary" : "outline"}
              size="icon"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? <Monitor className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={endCall}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
