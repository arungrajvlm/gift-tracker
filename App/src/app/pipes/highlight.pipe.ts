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

        // Using inline style for "highlight" from global vars
        const match = text.replace(regex, (match) =>
            `<span class="highlight">${match}</span>`
        );

        return this.sanitizer.bypassSecurityTrustHtml(match);
    }
}
