import { useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePresence } from '@/hooks/usePresence';
import { motion, AnimatePresence } from 'framer-motion';

interface LivePresenceProps {
  roomId: string;
  showCursors?: boolean;
}

export const LivePresence = ({ roomId, showCursors = false }: LivePresenceProps) => {
  const { presenceStates, updateCursor } = usePresence(roomId);

  useEffect(() => {
    if (!showCursors) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateCursor(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showCursors, updateCursor]);

  const users = Object.values(presenceStates).flat();

  return (
    <>
      {/* Presence Indicators */}
      <div className="fixed top-20 right-4 z-40 flex items-center gap-2">
        <AnimatePresence>
          {users.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 bg-card/95 backdrop-blur-sm border rounded-full px-3 py-2 shadow-lg"
            >
              <div className="flex -space-x-2">
                {users.slice(0, 3).map((user: any, index: number) => (
                  <Avatar
                    key={user.user_id}
                    className="border-2 border-background h-8 w-8"
                    style={{ borderColor: user.color }}
                  >
                    <AvatarFallback style={{ backgroundColor: user.color + '20', color: user.color }}>
                      {user.username?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Badge variant="secondary" className="text-xs">
                {users.length} online
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Cursors */}
      {showCursors && (
        <AnimatePresence>
          {users.map((user: any) => {
            if (!user.cursor) return null;
            
            return (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                style={{
                  position: 'fixed',
                  left: user.cursor.x,
                  top: user.cursor.y,
                  pointerEvents: 'none',
                  zIndex: 9999,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={user.color}
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                >
                  <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z" />
                </svg>
                <div
                  className="absolute top-6 left-6 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
                  style={{ backgroundColor: user.color }}
                >
                  {user.username}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </>
  );
};
