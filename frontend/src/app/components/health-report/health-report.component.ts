import {Component, OnInit} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatorService } from '../../services/translator.service';

@Component({
  selector: 'app-health-report',
  templateUrl: './health-report.component.html',
  styleUrls: ['./health-report.component.css']
})
export class HealthReportComponent implements OnInit {

  constructor(
    private titleService: Title,
    private translatorService: TranslatorService
  ) {
  }

  updateTitle() {
    this.titleService.setTitle(this.translatorService.translate('title_health'));
  }

  ngOnInit() {
    this.updateTitle();
    this.translatorService.onChange(() => {
      this.updateTitle();
    });
  }

}
