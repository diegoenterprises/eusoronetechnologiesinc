import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  gradient: string;
  onClick: () => void;
}

interface QuickActionsWidgetProps {
  actions: QuickAction[];
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ actions }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            onClick={action.onClick}
            className={`h-auto py-4 px-4 bg-gradient-to-br ${action.gradient} hover:opacity-90 transition-all hover:scale-105 border-0 shadow-lg`}
          >
            <div className="flex flex-col items-center gap-2">
              <Icon className="w-5 h-5" />
              <span className="text-sm font-semibold">{action.label}</span>
            </div>
          </Button>
        );
      })}
    </div>
  );
};

export default QuickActionsWidget;
