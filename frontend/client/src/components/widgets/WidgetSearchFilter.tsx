import React, { useState, useMemo } from 'react';
import { WidgetDefinition, WidgetCategory } from '@/lib/widgetLibrary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, X } from 'lucide-react';

interface WidgetSearchFilterProps {
  widgets: WidgetDefinition[];
  onFilteredWidgetsChange: (widgets: WidgetDefinition[]) => void;
  showPremiumOnly?: boolean;
  onPremiumFilterChange?: (showPremium: boolean) => void;
}

const WIDGET_CATEGORIES: { value: WidgetCategory; label: string }[] = [
  { value: 'analytics', label: 'Analytics' },
  { value: 'operations', label: 'Operations' },
  { value: 'financial', label: 'Financial' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'communication', label: 'Communication' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'safety', label: 'Safety' },
  { value: 'performance', label: 'Performance' },
  { value: 'planning', label: 'Planning' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'management', label: 'Management' },
];

/**
 * Widget Search and Filter Component
 * Allows users to search widgets by name/description and filter by category/premium status
 */
export const WidgetSearchFilter: React.FC<WidgetSearchFilterProps> = ({
  widgets,
  onFilteredWidgetsChange,
  showPremiumOnly = false,
  onPremiumFilterChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<WidgetCategory[]>([]);
  const [showPremium, setShowPremium] = useState(showPremiumOnly);

  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    return widgets.filter((widget) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        widget.name.toLowerCase().includes(searchLower) ||
        widget.description.toLowerCase().includes(searchLower) ||
        widget.category.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(widget.category)) {
        return false;
      }

      // Premium filter
      if (showPremium && !widget.premium) return false;

      return true;
    });
  }, [widgets, searchQuery, selectedCategories, showPremium]);

  const handleCategoryToggle = (category: WidgetCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handlePremiumToggle = (premium: boolean) => {
    setShowPremium(premium);
    onPremiumFilterChange?.(premium);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setShowPremium(false);
    onPremiumFilterChange?.(false);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || showPremium;

  // Update parent with filtered results
  React.useEffect(() => {
    onFilteredWidgetsChange(filteredWidgets);
  }, [filteredWidgets, onFilteredWidgetsChange]);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search widgets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2">
        {/* Category Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`bg-gray-800 border-gray-700 hover:bg-gray-700 gap-2 ${
                selectedCategories.length > 0 ? 'border-purple-500/50 bg-purple-500/10' : ''
              }`}
            >
              <Filter className="w-4 h-4" />
              Category
              {selectedCategories.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-500/30 text-xs">
                  {selectedCategories.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {WIDGET_CATEGORIES.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat.value}
                checked={selectedCategories.includes(cat.value)}
                onCheckedChange={() => handleCategoryToggle(cat.value)}
              >
                {cat.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Premium Filter */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePremiumToggle(!showPremium)}
          className={`bg-gray-800 border-gray-700 hover:bg-gray-700 gap-2 ${
            showPremium ? 'border-amber-500/50 bg-amber-500/10' : ''
          }`}
        >
          Premium
          {showPremium && <span className="text-xs text-amber-300">ON</span>}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-400 hover:text-gray-300"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-xs text-gray-400 px-1">
        Showing {filteredWidgets.length} of {widgets.length} widgets
        {hasActiveFilters && ' (filtered)'}
      </div>
    </div>
  );
};

export default WidgetSearchFilter;
