import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Save, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Fuse from 'fuse.js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdvancedSearchProps {
  data: any[];
  onFilteredData: (filtered: any[]) => void;
  searchKeys: string[];
}

interface SearchPreset {
  id: string;
  name: string;
  filters: {
    search: string;
    category: string;
    level: string;
    tags: string[];
  };
}

export const AdvancedSearch = ({ data, onFilteredData, searchKeys }: AdvancedSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [presets, setPresets] = useState<SearchPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  const fuse = new Fuse(data, {
    keys: searchKeys,
    threshold: 0.3,
    includeScore: true,
  });

  useEffect(() => {
    // Extract unique tags from data
    const tags = new Set<string>();
    data.forEach((item) => {
      if (item.tags) {
        item.tags.forEach((tag: string) => tags.add(tag));
      }
    });
    setAllTags(Array.from(tags));
  }, [data]);

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, category, level, selectedTags, data]);

  const loadPresets = async () => {
    const { data: presetsData, error } = await supabase
      .from('user_search_presets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading presets:', error);
      return;
    }

    setPresets((presetsData as any) || []);
  };

  const applyFilters = () => {
    let filtered = data;

    // Fuzzy search
    if (searchTerm) {
      const results = fuse.search(searchTerm);
      filtered = results.map(result => result.item);
    }

    // Category filter
    if (category !== 'all') {
      filtered = filtered.filter(item => item.category === category);
    }

    // Level filter
    if (level !== 'all') {
      filtered = filtered.filter(item => item.level === level);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags && selectedTags.every((tag: string) => item.tags.includes(tag))
      );
    }

    onFilteredData(filtered);
  };

  const savePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to save presets');
      return;
    }

    const { error } = await supabase
      .from('user_search_presets')
      .insert([{
        user_id: user.id,
        name: presetName,
        filters: {
          search: searchTerm,
          category,
          level,
          tags: selectedTags,
        } as any,
      }]);

    if (error) {
      toast.error('Failed to save preset');
      return;
    }

    toast.success('Filter preset saved!');
    setPresetName('');
    loadPresets();
  };

  const loadPreset = (preset: SearchPreset) => {
    setSearchTerm(preset.filters.search);
    setCategory(preset.filters.category);
    setLevel(preset.filters.level);
    setSelectedTags(preset.filters.tags);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setLevel('all');
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses (fuzzy search enabled)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Level</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {allTags.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={clearFilters} variant="outline" size="sm" className="flex-1">
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Save className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Save Current Filters</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Preset name..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <Button onClick={savePreset} size="sm">
                    Save
                  </Button>
                </div>
              </div>

              {presets.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Saved Presets</label>
                  <div className="space-y-2">
                    {presets.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => loadPreset(preset)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
