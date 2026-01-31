import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'highlight',
    standalone: true
})
export class HighlightPipe implements PipeTransform {

    constructor(private sanitizer: DomSanitizer) { }

    transform(text: string | null | undefined, search: string): string | SafeHtml {
        if (!text) return '';
        if (!search || !search.trim()) return text;

        const pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        const regex = new RegExp(pattern, 'gi');

        // Security: Escape HTML first to prevent XSS
        const safeText = this.escapeHtml(text);

        // Using inline style for "highlight" from global vars
        // Note: We are matching against the Safe Text now, so the regex pattern must match escaped content if necessary.
        // For simple text search this is fine.
        const match = safeText.replace(regex, (match) =>
            `<span class="highlight">${match}</span>`
        );

        return this.sanitizer.bypassSecurityTrustHtml(match);
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
