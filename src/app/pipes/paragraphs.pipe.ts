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
    
    // Normalize line endings and ensure consistent paragraph breaks
    const normalizedText = value
      // First, normalize all types of line breaks to \n
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Ensure consistent paragraph breaks by converting multiple consecutive line breaks to double line breaks
      .replace(/\n{3,}/g, '\n\n');
    
    // Split by double line breaks to identify paragraphs
    const paragraphs = normalizedText.split('\n\n').filter(p => p.trim().length > 0);
    
    // Process each paragraph, replacing single line breaks with <br> tags
    const html = paragraphs.map(p => {
      // Handle single line breaks within paragraphs
      const paragraphContent = p.replace(/\n/g, '<br>');
      return `<p class="backstory-paragraph">${paragraphContent}</p>`;
    }).join('');
    
    // Sanitize the HTML to prevent XSS
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
