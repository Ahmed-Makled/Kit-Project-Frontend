import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from '@app/core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],

  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly languageService = inject(LanguageService);

  ngOnInit(): void {
    this.languageService.init();
  }
}
