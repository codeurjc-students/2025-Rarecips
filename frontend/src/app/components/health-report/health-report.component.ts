import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslatorService } from '../../services/translator.service';
import { HealthReportService } from '../../services/health-report.service';
import { HealthReport } from '../../models/health-report.model';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-health-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './health-report.component.html',
  styleUrls: ['./health-report.component.css']
})
export class HealthReportComponent implements OnInit {
  reports: HealthReport[] = [];
  latestReport: HealthReport | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  activeTab: 'history' | 'analysis' | 'overview' = 'overview';
  remainingGenerations: number = 5;

  constructor(
    private titleService: Title,
    private translatorService: TranslatorService,
    private healthReportService: HealthReportService
  ) { }

  updateTitle() {
    this.titleService.setTitle(this.translatorService.translate('title_health') || 'Health Report');
  }

  ngOnInit() {
    this.updateTitle();
    this.translatorService.onChange(() => {
      this.updateTitle();
    });
    this.loadReports();
  }

  calculateRemainingGenerations() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const reportsThisMonth = this.reports.filter(r => {
      const d = new Date(r.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    this.remainingGenerations = Math.max(0, 5 - reportsThisMonth);
  }

  t(key: string): string {
    return this.translatorService.translate(key);
  }

  loadReports() {
    this.isLoading = true;
    this.healthReportService.getUserReports().subscribe(
      (data) => {
        this.reports = data;
        if (this.reports.length > 0) {
          this.latestReport = this.reports[0];
        }
        this.calculateRemainingGenerations();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching reports', error);
        this.error = this.t('health_repo_error_fetch') + error;
        this.isLoading = false;
      }
    );
  }

  generateNewReport() {
    this.isLoading = true;
    this.error = null;
    const lang = localStorage.getItem('lang') || 'es';
    this.healthReportService.generateReport(lang).subscribe(
      (data) => {
        this.latestReport = data;
        this.reports.unshift(data);
        this.activeTab = 'analysis';
        this.calculateRemainingGenerations();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error generating report', error);
        if (error.status === 429) {
          this.error = this.t('health_repo_limit_reached');
        } else {
          this.error = this.t('health_repo_generation_failed') + error.message;
        }
        this.isLoading = false;
      }
    );
  }

  setTab(tab: 'history' | 'analysis' | 'overview') {
    this.activeTab = tab;
  }
}
