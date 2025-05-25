// filepath: c:\Users\juliu\ideaProjects\eldr-scrls-char-ai\src\app\pipes\paragraphs.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'paragraphs',
  standalone: true
})
export class ParagraphsPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    // Replace newlines with paragraph tags
    const paragraphs = value.split('\n\n').filter(p => p.trim().length > 0);
    const html = paragraphs.map(p => `<p>${p.replace('\n', '<br>')}</p>`).join('');
    
    // Sanitize the HTML to prevent XSS
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
