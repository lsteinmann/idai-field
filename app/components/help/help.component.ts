import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Http} from '@angular/http';
import {Chapter, HelpLoader} from './help-loader';
import {SettingsService} from '../../core/settings/settings-service';


@Component({
    moduleId: module.id,
    selector: 'help',
    templateUrl: './help.html'
})
/**
 * @author Thomas Kleinke
 */
export class HelpComponent implements OnInit {

    public html: SafeHtml;
    public chapters: Array<Chapter> = [];
    public activeChapter: Chapter;

    @ViewChild('help') rootElement: ElementRef;

    private static scrollOffset: number = -15;
    private static headerTopOffset: number = -62;


    constructor(private domSanitizer: DomSanitizer,
                private http: Http,
                private settingsService: SettingsService) {}


    async ngOnInit() {

        const {html, chapters} = await HelpLoader.load(
            HelpComponent.getFilePath(this.settingsService.getSettings().locale),
            this.http,
            this.domSanitizer
        );

        this.html = html;
        this.chapters = chapters;
        if (this.chapters.length > 0) this.activeChapter = this.chapters[0];
    }


    public scrollToChapter(chapter: Chapter) {

        const element: HTMLElement|null = document.getElementById(chapter.id);
        if (!element) return;

        element.scrollIntoView(true);
        this.rootElement.nativeElement.scrollTop += HelpComponent.scrollOffset;
    }


    public updateActiveChapter() {

        let activeElementTop: number = 1;

        this.chapters.forEach(chapter => {
            const top: number = HelpComponent.getHeaderTop(chapter);
            if (top <= 0 && (top > activeElementTop || activeElementTop === 1)) {
                activeElementTop = top;
                this.activeChapter = chapter;
            }
        });
    }


    private static getFilePath(locale: string): string {

        return 'manual/manual.' + locale + '.md';
    }


    private static getHeaderTop(chapter: Chapter): number {

        const element: HTMLElement|null = document.getElementById(chapter.id);
        if (!element) return 1;

        return element.getBoundingClientRect().top
            + HelpComponent.headerTopOffset
            + HelpComponent.scrollOffset;
    }
}