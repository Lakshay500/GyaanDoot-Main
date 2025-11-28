import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Home, BookOpen, LayoutDashboard, Library, Trophy, Users, Search } from "lucide-react";

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    
    window.addEventListener('openCommandPalette', handleOpen);
    window.addEventListener('closeModal', handleClose);
    
    return () => {
      window.removeEventListener('openCommandPalette', handleOpen);
      window.removeEventListener('closeModal', handleClose);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
            <kbd className="ml-auto text-xs">Cmd+H</kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/courses'))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Courses</span>
            <kbd className="ml-auto text-xs">Cmd+C</kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <kbd className="ml-auto text-xs">Cmd+D</kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/my-courses'))}>
            <Library className="mr-2 h-4 w-4" />
            <span>My Courses</span>
            <kbd className="ml-auto text-xs">Cmd+M</kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/leaderboard'))}>
            <Trophy className="mr-2 h-4 w-4" />
            <span>Leaderboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/mentor-sessions'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Mentor Sessions</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
