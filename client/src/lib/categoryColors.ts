export const categoryConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  "Hitting": {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
    label: "Hitting"
  },
  "Throwing": {
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900",
    label: "Throwing"
  },
  "Fielding": {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
    label: "Fielding"
  },
  "Baserunning": {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900",
    label: "Baserunning"
  },
  "Infield": {
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
    label: "Infield"
  },
  "Outfield": {
    color: "text-lime-600 dark:text-lime-400",
    bgColor: "bg-lime-50 dark:bg-lime-950/30 border-lime-200 dark:border-lime-900",
    label: "Outfield"
  },
  "Catching": {
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
    label: "Catching"
  },
};

export const getCategoryConfig = (category: string) => {
  return categoryConfig[category] || {
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900",
    label: category
  };
};
