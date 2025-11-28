import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Path, PencilBrush } from "fabric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Square, Circle as CircleIcon, Eraser, Trash2, Download, Palette } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface CollaborativeWhiteboardProps {
  roomId: string;
  roomName: string;
}

type Tool = "select" | "draw" | "rectangle" | "circle" | "eraser";

export const CollaborativeWhiteboard = ({ roomId, roomName }: CollaborativeWhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("draw");
  const [activeColor, setActiveColor] = useState("#000000");
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = 2;

    setFabricCanvas(canvas);
    setupRealtimeSync(canvas);

    return () => {
      channelRef.current?.unsubscribe();
      canvas.dispose();
    };
  }, [roomId]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 2;
    }
  }, [activeTool, activeColor, fabricCanvas]);

  const setupRealtimeSync = (canvas: FabricCanvas) => {
    const channel = supabase.channel(`whiteboard-${roomId}`);

    // Listen for drawing events from other users
    channel
      .on('broadcast', { event: 'draw' }, ({ payload }) => {
        if (payload.type === 'path') {
          const path = new Path(payload.path);
          canvas.add(path);
        } else if (payload.type === 'rect') {
          const rect = new Rect(payload.data);
          canvas.add(rect);
        } else if (payload.type === 'circle') {
          const circle = new Circle(payload.data);
          canvas.add(circle);
        } else if (payload.type === 'clear') {
          canvas.clear();
          canvas.backgroundColor = "#ffffff";
          canvas.renderAll();
        }
      })
      .subscribe();

    channelRef.current = channel;

    // Broadcast local drawing events
    canvas.on('path:created', (e) => {
      const path = e.path;
      channel.send({
        type: 'broadcast',
        event: 'draw',
        payload: {
          type: 'path',
          path: path.toJSON()
        }
      });
    });
  };

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 100,
        height: 100,
      });
      fabricCanvas.add(rect);
      broadcastShape('rect', rect.toJSON());
    } else if (tool === "circle") {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: activeColor,
        radius: 50,
      });
      fabricCanvas.add(circle);
      broadcastShape('circle', circle.toJSON());
    } else if (tool === "eraser") {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.freeDrawingBrush.color = "#ffffff";
      fabricCanvas.freeDrawingBrush.width = 20;
    }
  };

  const broadcastShape = (type: string, data: any) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'draw',
      payload: { type, data }
    });
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    
    channelRef.current?.send({
      type: 'broadcast',
      event: 'draw',
      payload: { type: 'clear' }
    });
    
    toast.success("Whiteboard cleared!");
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({ 
      format: 'png', 
      quality: 1,
      multiplier: 1
    });
    const link = document.createElement('a');
    link.download = `whiteboard-${roomName}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success("Whiteboard downloaded!");
  };

  const colors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF", 
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500"
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Collaborative Whiteboard - {roomName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={activeTool === "select" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolClick("select")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button
              variant={activeTool === "draw" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolClick("draw")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button
              variant={activeTool === "rectangle" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolClick("rectangle")}
            >
              <Square className="h-4 w-4" />
            </Button>
            
            <Button
              variant={activeTool === "circle" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolClick("circle")}
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            
            <Button
              variant={activeTool === "eraser" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolClick("eraser")}
            >
              <Eraser className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-1 ml-4">
              {colors.map((color) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    activeColor === color ? "border-primary" : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={handleClear}
              className="ml-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="border border-border rounded-lg shadow-lg overflow-hidden">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
