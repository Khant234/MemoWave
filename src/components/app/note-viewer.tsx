

"use client";

import * as React from "react";
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypePrism from 'rehype-prism-plus';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Edit, CheckSquare, Square, Music, Download, Clock, FileDown, Loader2, Share2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ChecklistCompleteMessage } from "./checklist-complete";
import { useClickSound } from "@/hooks/use-click-sound";
import { jsPDF } from "jspdf";
import Latex from 'react-latex-next';
import { ShareNoteDialog } from "./share-note-dialog";

type NoteViewerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onEdit: (note: Note) => void;
  onChecklistItemToggle: (noteId: string, checklistItemId: string) => void;
};

const formatTime = (time24: string | null | undefined): string => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// Helper component to render text with clickable links, LaTeX, and Markdown
const FormattedContent = ({ text }: { text: string }) => {
  return (
    <ReactMarkdown
        rehypePlugins={[rehypeRaw, [rehypePrism, { ignoreMissing: true }]]}
        remarkPlugins={[remarkGfm]}
        components={{
            a: ({node, ...props}) => <a {...props} className="text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary/80" target="_blank" rel="noopener noreferrer" />,
            p: ({node, ...props}) => <p {...props} className="mb-4 last:mb-0" />,
            h1: ({node, ...props}) => <h1 {...props} className="text-2xl font-bold mb-4 mt-6" />,
            h2: ({node, ...props}) => <h2 {...props} className="text-xl font-bold mb-3 mt-5" />,
            h3: ({node, ...props}) => <h3 {...props} className="text-lg font-bold mb-3 mt-4" />,
            ul: ({node, ...props}) => <ul {...props} className="list-disc pl-6 mb-4 space-y-2" />,
            ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-6 mb-4 space-y-2" />,
            code: ({node, inline, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '')
                if (!inline && match) {
                  return (
                    <div className="my-4 rounded-md overflow-hidden">
                       <pre {...props} className={cn(className, "not-prose")}>
                          <code className="not-prose">{children}</code>
                       </pre>
                    </div>
                  )
                }
                if (inline) {
                  return <code {...props} className="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm font-mono text-sm" />;
                }
                return <code {...props} className="block bg-muted text-muted-foreground p-3 rounded-md font-mono text-sm" />;
            },
            blockquote: ({node, ...props}) => <blockquote {...props} className="border-l-4 border-muted-foreground/20 pl-4 italic text-muted-foreground" />,
            table: ({node, ...props}) => <table {...props} className="w-full my-4 border-collapse border border-border" />,
            th: ({node, ...props}) => <th {...props} className="border border-border px-4 py-2 text-left font-semibold" />,
            td: ({node, ...props}) => <td {...props} className="border border-border px-4 py-2" />,
            hr: ({node, ...props}) => <hr {...props} className="my-6 border-border" />,
            // Custom LaTeX handling
            text: ({node, ...props}) => {
                const textContent = node.value;
                const parts = textContent.split(/(\$[^\$]+\$|\$\$[^\$]+\$\$)/g);
                return (
                    <>
                        {parts.map((part, index) => {
                            if (part.startsWith('$')) {
                                return <Latex key={index}>{part}</Latex>;
                            }
                            return <React.Fragment key={index}>{part}</React.Fragment>;
                        })}
                    </>
                );
            }
        }}
    >
      {text}
    </ReactMarkdown>
  );
};


export function NoteViewer({ isOpen, setIsOpen, note, onEdit, onChecklistItemToggle }: NoteViewerProps) {
  const [formattedUpdateDate, setFormattedUpdateDate] = React.useState('');
  const [isExporting, setIsExporting] = React.useState(false);
  const playClickSound = useClickSound();
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  
  const audioFileExtension = React.useMemo(() => {
    if (!note?.audioUrl) return 'wav';
    return note.audioUrl.match(/data:audio\/(.*?);/)?.[1] || 'wav';
  }, [note?.audioUrl]);
  
  React.useEffect(() => {
    if (note) {
      setFormattedUpdateDate(
        new Date(note.updatedAt).toLocaleString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    }
  }, [note]);

  if (!note) return null;

  const handleExportPDF = () => {
    if (!note) return;

    setIsExporting(true);
    
    // Use a timeout to allow UI to update before blocking with PDF generation
    setTimeout(() => {
      const doc = new jsPDF();
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 15;
      const rightMargin = 15;
      const usableWidth = doc.internal.pageSize.getWidth() - leftMargin - rightMargin;

      const addPageIfNeeded = (spaceNeeded: number) => {
          if (yPos + spaceNeeded > pageHeight - 20) { // 20 for bottom margin
              doc.addPage();
              yPos = 20;
          }
      }

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      const titleLines = doc.splitTextToSize(note.title || 'Untitled Note', usableWidth);
      addPageIfNeeded(titleLines.length * 10);
      doc.text(titleLines, leftMargin, yPos);
      yPos += titleLines.length * 10;
      
      // Subtitle (date)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(150);
      yPos += 2;
      addPageIfNeeded(5);
      doc.text(`Last updated on ${formattedUpdateDate}`, leftMargin, yPos);
      yPos += 10;
      doc.setTextColor(0);

      // Content
      doc.setFontSize(12);
      const contentLines = doc.splitTextToSize(note.content, usableWidth);
      addPageIfNeeded(contentLines.length * 7);
      doc.text(contentLines, leftMargin, yPos);
      yPos += contentLines.length * 7;

      // Checklist
      if (note.checklist && note.checklist.length > 0) {
        yPos += 10;
        addPageIfNeeded(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Checklist", leftMargin, yPos);
        yPos += 8;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        note.checklist.forEach(item => {
            const itemText = `${item.completed ? '[x]' : '[ ]'} ${item.text}`;
            const itemLines = doc.splitTextToSize(itemText, usableWidth - 5);
            addPageIfNeeded(itemLines.length * 7);
            doc.text(itemLines, leftMargin + 5, yPos);
            yPos += itemLines.length * 7 + 2;
        });
      }

      doc.save(`${note.title.replace(/\s/g, '_') || 'note'}.pdf`);
      setIsExporting(false);
    }, 100);
  };


  const handleEditClick = () => {
    playClickSound();
    onEdit(note);
  };
  
  const handleChecklistToggle = (itemId: string) => {
    playClickSound();
    onChecklistItemToggle(note.id, itemId);
  };

  const checklistExists = note.checklist && note.checklist.length > 0;
  
  const sortedChecklist = checklistExists
    ? [...note.checklist].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      })
    : [];

  const completedItems = checklistExists
    ? note.checklist.filter((item) => item.completed).length
    : 0;
  const totalItems = checklistExists ? note.checklist.length : 0;
  const checklistProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const allItemsComplete = checklistExists && totalItems > 0 && completedItems === totalItems;


  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="font-headline text-2xl">{note.title || 'Untitled Note'}</SheetTitle>
            <SheetDescription className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <span>Last updated on {formattedUpdateDate}</span>
              {note.startTime && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Scheduled: {formatTime(note.startTime)}{note.endTime ? ` - ${formatTime(note.endTime)}` : ''}
                </span>
              )}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow px-6">
            <div className="space-y-6 pb-6">
              {note.imageUrl && (
                <div className="relative">
                  <Image width={600} height={400} src={note.imageUrl} alt="Note attachment" className="rounded-lg w-full h-auto object-cover" />
                </div>
              )}
              
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <FormattedContent text={note.content} />
              </div>

              {note.audioUrl && (
                  <div className="space-y-2 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                              <Music className="h-4 w-4" />
                              <span>Attached Audio</span>
                          </div>
                          <a href={note.audioUrl} download={`note-audio-${note.id}.${audioFileExtension}`}>
                              <Button variant="ghost" size="icon">
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Download audio</span>
                              </Button>
                          </a>
                      </div>
                      <audio controls src={note.audioUrl} className="w-full" />
                  </div>
              )}

              {checklistExists && (
                <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Checklist</h3>
                      <span className="text-xs text-muted-foreground">
                        {completedItems}/{totalItems} completed
                      </span>
                    </div>
                    <Progress value={checklistProgress} className="h-2" />
                    <div className="space-y-2">
                        {sortedChecklist.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleChecklistToggle(item.id)}
                              className="flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-secondary"
                            >
                              {item.completed ? <CheckSquare className="h-4 w-4 flex-shrink-0 text-primary" /> : <Square className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                              <span className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>{item.text}</span>
                            </button>
                        ))}
                    </div>
                    {allItemsComplete && <ChecklistCompleteMessage />}
                </div>
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="p-6 bg-background border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                  {note.isDraft && <Badge variant="outline">Draft</Badge>}
                  {note.isPinned && <Badge variant="default">Pinned</Badge>}
                  {note.isArchived && <Badge variant="secondary">Archived</Badge>}
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsShareOpen(true)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4"/>}
                      {isExporting ? 'Exporting...' : 'Export PDF'}
                  </Button>
                  <SheetClose asChild>
                      <Button variant="outline" onClick={playClickSound}>Close</Button>
                  </SheetClose>
                  <Button onClick={handleEditClick}>
                      <Edit className="mr-2 h-4 w-4"/>
                      Edit
                  </Button>
              </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <ShareNoteDialog open={isShareOpen} setOpen={setIsShareOpen} note={note} />
    </>
  );
}
