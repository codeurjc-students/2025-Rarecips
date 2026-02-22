import {Component, OnInit} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatorService } from '../../services/translator.service';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {

  constructor(
    private titleService: Title,
    private translatorService: TranslatorService
  ) {
  }

  updateTitle() {
    this.titleService.setTitle(this.translatorService.translate('title_admin'));
  }

  ngOnInit() {
    this.updateTitle();
    this.translatorService.onChange(() => {
      this.updateTitle();
    });
  }

}
