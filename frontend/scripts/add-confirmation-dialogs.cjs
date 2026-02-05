/**
 * Script to add confirmation dialogs to screens with delete/remove mutations
 * Handles various onClick patterns
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../client/src/pages');

// Get all tsx files with deleteMutation or removeMutation that have direct onClick calls
const files = fs.readdirSync(pagesDir)
  .filter(f => f.endsWith('.tsx'))
  .map(f => path.join(pagesDir, f))
  .filter(f => {
    const content = fs.readFileSync(f, 'utf-8');
    // Must have mutation and onClick calling it directly
    const hasMutation = content.includes('deleteMutation') || content.includes('removeMutation');
    const hasDirectCall = /onClick=\{?\(\)\s*=>\s*(delete|remove)Mutation\.mutate/.test(content);
    const noDialog = !content.includes('ConfirmationDialog');
    return hasMutation && hasDirectCall && noDialog;
  });

console.log(`Found ${files.length} files to update`);

let updated = 0;

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Add import after toast import or lucide import
    if (!content.includes('DeleteConfirmationDialog')) {
      if (content.includes('import { toast }')) {
        content = content.replace(
          'import { toast } from "sonner";',
          'import { toast } from "sonner";\nimport { DeleteConfirmationDialog } from "@/components/ConfirmationDialog";'
        );
      } else {
        const lucideMatch = content.match(/from "lucide-react";/);
        if (lucideMatch) {
          content = content.replace(
            'from "lucide-react";',
            'from "lucide-react";\nimport { DeleteConfirmationDialog } from "@/components/ConfirmationDialog";'
          );
        }
      }
    }

    // Add deleteId state if not present
    if (!content.includes('[deleteId, setDeleteId]')) {
      const exportMatch = content.match(/export default function \w+\(\)\s*\{/);
      if (exportMatch) {
        const insertPos = content.indexOf(exportMatch[0]) + exportMatch[0].length;
        content = content.slice(0, insertPos) + 
          '\n  const [deleteId, setDeleteId] = useState<string | null>(null);' +
          content.slice(insertPos);
      }
    }

    // Replace various onClick patterns - handle different property names
    // Pattern: onClick={() => deleteMutation.mutate({ id: item.id })}
    content = content.replace(
      /onClick=\{\(\)\s*=>\s*deleteMutation\.mutate\(\{\s*id:\s*(\w+)\.id\s*\}\)\}/g,
      'onClick={() => setDeleteId($1.id)}'
    );
    
    // Pattern: onClick={() => deleteMutation.mutate({ documentId: doc.id })}
    content = content.replace(
      /onClick=\{\(\)\s*=>\s*deleteMutation\.mutate\(\{\s*\w+Id:\s*(\w+)\.id\s*\}\)\}/g,
      'onClick={() => setDeleteId($1.id)}'
    );
    
    // Pattern: onClick={() => removeMutation.mutate({ id: item.id })}
    content = content.replace(
      /onClick=\{\(\)\s*=>\s*removeMutation\.mutate\(\{\s*id:\s*(\w+)\.id\s*\}\)\}/g,
      'onClick={() => setDeleteId($1.id)}'
    );
    
    // Pattern: onClick={() => removeMutation.mutate({ reportId: report.id })}
    content = content.replace(
      /onClick=\{\(\)\s*=>\s*removeMutation\.mutate\(\{\s*\w+Id:\s*(\w+)\.id\s*\}\)\}/g,
      'onClick={() => setDeleteId($1.id)}'
    );

    // Determine which mutation to use in the dialog
    const usesRemove = content.includes('removeMutation') && !content.includes('deleteMutation');
    const mutationName = usesRemove ? 'removeMutation' : 'deleteMutation';

    // Add DeleteConfirmationDialog before the last closing </div>
    if (!content.includes('<DeleteConfirmationDialog')) {
      const lastReturn = content.lastIndexOf('  );');
      if (lastReturn > -1) {
        const dialogCode = `
      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        itemName="this item"
        onConfirm={() => { if (deleteId) ${mutationName}.mutate({ id: deleteId }); setDeleteId(null); }}
        isLoading={${mutationName}?.isPending}
      />
    </div>`;
        
        // Find the last </div> before );
        const searchArea = content.slice(0, lastReturn);
        const lastDivEnd = searchArea.lastIndexOf('</div>');
        if (lastDivEnd > -1) {
          content = content.slice(0, lastDivEnd) + dialogCode + content.slice(lastDivEnd + 6);
        }
      }
    }

    fs.writeFileSync(filePath, content);
    updated++;
    console.log(`Updated: ${fileName}`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
});

console.log(`\nDone! Updated ${updated} files`);
