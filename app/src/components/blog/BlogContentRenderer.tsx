import { CheckCircle2, ArrowUpRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type BlogContentBlock } from '@/lib/api/blog';

function toneClasses(tone?: string) {
  switch (tone) {
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-900';
    case 'note':
      return 'border-slate-200 bg-slate-50 text-slate-900';
    case 'gentle':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    case 'info':
    default:
      return 'border-sky-200 bg-sky-50 text-sky-900';
  }
}

export function BlogContentRenderer({ blocks }: { blocks: BlogContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const level = block.level ?? 2;
            const headingClass = level === 2
              ? 'text-2xl font-semibold text-neutral-900'
              : level === 3
                ? 'text-xl font-semibold text-neutral-900'
                : 'text-lg font-semibold text-neutral-900';
            const Tag = level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
            return (
              <Tag key={index} className={headingClass}>
                {block.text}
              </Tag>
            );
          }
          case 'paragraph':
            return (
              <p key={index} className="text-neutral-700 leading-relaxed">
                {block.text}
              </p>
            );
          case 'list': {
            const items = block.items ?? [];
            return block.style === 'number' ? (
              <ol key={index} className="list-decimal pl-6 space-y-2 text-neutral-700">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item.text}</li>
                ))}
              </ol>
            ) : (
              <ul key={index} className="list-disc pl-6 space-y-2 text-neutral-700">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item.text}</li>
                ))}
              </ul>
            );
          }
          case 'quote':
            return (
              <Card key={index} className="border-neutral-200 bg-neutral-50">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <Quote className="w-4 h-4" />
                    Community quote
                  </div>
                  <p className="text-lg text-neutral-800">{block.text}</p>
                  {block.author && (
                    <p className="text-sm text-neutral-500">{block.author}</p>
                  )}
                </CardContent>
              </Card>
            );
          case 'callout':
            return (
              <Card key={index} className={cn('border', toneClasses(block.tone))}>
                <CardContent className="p-5 space-y-2">
                  {block.title && (
                    <div className="text-sm font-semibold uppercase tracking-wide">
                      {block.title}
                    </div>
                  )}
                  {block.text && <p className="text-sm leading-relaxed">{block.text}</p>}
                  {block.body && <p className="text-sm leading-relaxed">{block.body}</p>}
                </CardContent>
              </Card>
            );
          case 'statGrid': {
            const items = block.items ?? [];
            return (
              <div key={index} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, itemIndex) => (
                  <Card key={itemIndex} className="border-neutral-200">
                    <CardContent className="p-5 space-y-1">
                      <div className="text-sm text-neutral-500">{item.label}</div>
                      <div className="text-2xl font-semibold text-neutral-900">{item.value}</div>
                      {item.note && (
                        <div className="text-xs text-neutral-500">{item.note}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          }
          case 'steps': {
            const steps = block.steps ?? [];
            return (
              <div key={index} className="space-y-3">
                {steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                      {stepIndex + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-neutral-900">{step.title}</div>
                      {step.body && <p className="text-sm text-neutral-600">{step.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            );
          }
          case 'checklist': {
            const items = block.items ?? [];
            return (
              <div key={index} className="space-y-2">
                {items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-2 text-neutral-700">
                    <CheckCircle2 className={cn('h-4 w-4', item.checked ? 'text-emerald-500' : 'text-neutral-300')} />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            );
          }
          case 'image':
            return (
              <figure key={index} className="space-y-2">
                <img src={block.src} alt={block.alt} className="rounded-2xl border border-neutral-200" />
                {block.caption && (
                  <figcaption className="text-xs text-neutral-500">{block.caption}</figcaption>
                )}
              </figure>
            );
          case 'divider':
            return <hr key={index} className="border-neutral-200" />;
          case 'cta':
            return (
              <Card key={index} className="border-primary/30 bg-primary/10">
                <CardContent className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{block.title}</h3>
                    <p className="text-sm text-neutral-600">{block.body}</p>
                  </div>
                  <Button asChild className="bg-primary hover:bg-primary-600">
                    <a href={block.buttonHref}>{block.buttonLabel}</a>
                  </Button>
                </CardContent>
              </Card>
            );
          case 'resourceGrid': {
            const items = block.items ?? [];
            return (
              <div key={index} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item, itemIndex) => (
                  <Card key={itemIndex} className="border-neutral-200">
                    <CardContent className="p-5 space-y-2">
                      <div className="text-base font-semibold text-neutral-900">{item.title}</div>
                      <p className="text-sm text-neutral-600">{item.description}</p>
                      <Button variant="outline" asChild className="gap-2">
                        <a href={item.href}>
                          Explore
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
