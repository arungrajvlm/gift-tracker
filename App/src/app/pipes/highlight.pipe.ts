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

        // Split search into words, filter out empty
        const tokens = search.trim().split(/\s+/).filter(t => t.length > 0);
        if (tokens.length === 0) return text;

        // Escape matches for regex safety
        const patterns = tokens.map(token => token.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));

        // Create One Big OR Regex: (Token1|Token2|Token3)
        const patternString = `(${patterns.join('|')})`;
        const regex = new RegExp(patternString, 'gi');

        // Security: Escape HTML first to prevent XSS
        const safeText = this.escapeHtml(text);

        // Replace any matching token
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
