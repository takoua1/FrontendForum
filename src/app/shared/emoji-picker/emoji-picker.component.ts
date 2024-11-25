import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import twemoji from 'twemoji';
@Component({
    selector: 'app-emoji-picker',
    templateUrl: './emoji-picker.component.html',
    styleUrl: './emoji-picker.component.css',
    standalone: false
})
export class EmojiPickerComponent implements OnInit {
  emojis: any = {};
  filteredEmojis: any = {};
  categories: string[] = [];
  searchTerm: string = '';

  @Output() emojiSelect = new EventEmitter<string>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadEmojis();
  }

  loadEmojis(): void {
    this.http.get('/assets/emoji-data.json').subscribe((data: any) => {
      this.emojis = data;
      this.filteredEmojis = { ...data };
      this.categories = Object.keys(this.emojis);
      this.renderTwemoji();
    });
  }

  filterEmojis(): void {
    if (!this.searchTerm) {
      this.filteredEmojis = { ...this.emojis };
      this.renderTwemoji();
      return;
    }
    this.filteredEmojis = {};
    for (const category of this.categories) {
      this.filteredEmojis[category] = this.emojis[category].filter((emoji: any) =>
        emoji.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.renderTwemoji();
  }

  selectEmoji(emoji: string): void {
    console.log('Emoji sélectionné:', emoji);
    this.emojiSelect.emit(emoji);
  }

  renderTwemoji(): void {
    this.categories.forEach(category => {
      const elementId = `emoji-list-${category}`;
      const element = document.getElementById(elementId);
      if (element) {
        twemoji.parse(element, {
          folder: 'svg',  // Vérifiez que ce dossier contient les fichiers SVG des drapeaux
          ext: '.svg',
          callback: (icon: string, options: any) => {
            // Utiliser le chemin approprié pour les fichiers SVG
            if (icon.includes('flag')) {
              return `https://twemoji.maxcdn.com/2/svg/${options.url}`;
            }
            return `https://twemoji.maxcdn.com/2/svg/${icon}`;
          }
        });
      }
    });
  }
}