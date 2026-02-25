#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "Pass 1: hover:bg variants..."
find . -name '*.tsx' -exec perl -pi -e 's/hover:bg-white\/\[0\.01\]/hover:bg-slate-50 dark:hover:bg-white\/[0.01]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!dark:)hover:bg-white\/\[0\.04\]/hover:bg-slate-100 dark:hover:bg-white\/[0.04]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!dark:)hover:bg-white\/\[0\.08\]/hover:bg-slate-200 dark:hover:bg-white\/[0.08]/g' {} +

echo "Pass 2: hover:border variants..."
find . -name '*.tsx' -exec perl -pi -e 's/(?<!dark:)hover:border-white\/\[0\.08\]/hover:border-slate-300 dark:hover:border-white\/[0.08]/g' {} +

echo "Pass 3: non-hover bg variants..."
find . -name '*.tsx' -exec perl -pi -e 's/(?<!hover:)(?<!dark:)bg-white\/\[0\.02\]/bg-white dark:bg-white\/[0.02]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!hover:)(?<!dark:)bg-white\/\[0\.03\]/bg-slate-100 dark:bg-white\/[0.03]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!hover:)(?<!dark:)bg-white\/\[0\.04\]/bg-slate-50 dark:bg-white\/[0.04]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!hover:)(?<!dark:)bg-white\/\[0\.08\]/bg-slate-200 dark:bg-white\/[0.08]/g' {} +

echo "Pass 4: non-hover border variants..."
find . -name '*.tsx' -exec perl -pi -e 's/(?<!hover:)(?<!dark:)border-white\/\[0\.04\]/border-slate-200\/60 dark:border-white\/[0.04]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!hover:)(?<!dark:)border-white\/\[0\.06\]/border-slate-200 dark:border-white\/[0.06]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!hover:)(?<!dark:)border-white\/\[0\.08\]/border-slate-200 dark:border-white\/[0.08]/g' {} +

echo "Pass 5: text-white opacity variants..."
find . -name '*.tsx' -exec perl -pi -e 's/(?<!dark:)text-white\/75/text-slate-500 dark:text-white\/75/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!dark:)text-white\/60/text-slate-400 dark:text-white\/60/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/(?<!dark:)text-white\/40/text-slate-400 dark:text-white\/40/g' {} +

echo "Pass 6: hardcoded dark hex backgrounds..."
find . -name '*.tsx' -exec perl -pi -e 's/bg-\[#0B1120\]/bg-white dark:bg-[#0B1120]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/bg-\[#0d1224\]/bg-white dark:bg-[#0d1224]/g' {} +
find . -name '*.tsx' -exec perl -pi -e 's/bg-\[#161d35\]/bg-white dark:bg-[#161d35]/g' {} +

echo "DONE: All background, border, and text opacity patterns replaced across $(find . -name '*.tsx' | wc -l) files"
