/**
 * WS-P1-010: Reusable empty state for list pages
 * Wraps the existing Empty component with role-aware CTAs
 */
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { PackageOpen, Plus, Search, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface PageEmptyProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export default function PageEmpty({
  icon,
  title = "Nothing here yet",
  description = "Data will appear here once items are created.",
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
}: PageEmptyProps) {
  return (
    <Empty className="py-16 border-slate-700/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {icon || <PackageOpen size={24} className="text-slate-400" />}
        </EmptyMedia>
        <EmptyTitle className="text-white">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-3">
          {(actionLabel && (actionHref || onAction)) && (
            actionHref ? (
              <a
                href={actionHref}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-sm font-medium hover:from-[#1260DD] hover:to-[#A801DD] transition-colors"
              >
                <Plus size={14} />
                {actionLabel}
              </a>
            ) : (
              <button
                onClick={onAction}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-sm font-medium hover:from-[#1260DD] hover:to-[#A801DD] transition-colors"
              >
                <Plus size={14} />
                {actionLabel}
              </button>
            )
          )}
          {secondaryLabel && secondaryHref && (
            <a
              href={secondaryHref}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors"
            >
              {secondaryLabel}
              <ArrowRight size={14} />
            </a>
          )}
        </div>
      </EmptyContent>
    </Empty>
  );
}
