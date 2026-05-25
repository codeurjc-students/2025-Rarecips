import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslatorService } from '../../services/translator.service';
import { HealthReportService } from '../../services/health-report.service';
import { ThemeService } from '../../services/theme.service';
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
  aggregateReport: HealthReport | null = null;
  isLoading: boolean = false;
  logos: Map<string, string> = new Map();
  errorKey: string | null = null;
  errorDetail: string | null = null;
  activeTab: 'history' | 'analysis' | 'overview' = 'overview';
  remainingGenerations: number = 5;

  constructor(
    private titleService: Title,
    private translatorService: TranslatorService,
    private healthReportService: HealthReportService,
    private themeService: ThemeService,
    private router: Router
  ) { }

  private navigateToError(error: any) {
    this.router.navigate(['/error'], { state: { status: error?.status, reason: error?.message } });
  }

  updateTitle() {
    this.titleService.setTitle(this.translatorService.translate('title_health') || 'Health Report');
  }

  ngOnInit() {
    this.logos = this.themeService.getLogos();
    this.updateTitle();
    this.translatorService.onChange(() => {
      this.updateTitle();
    });
    this.loadAggregateReport();
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

  get errorMessage(): string | null {
    if (!this.errorKey) return null;
    const base = this.t(this.errorKey);
    return this.errorDetail ? `${base} ${this.errorDetail}` : base;
  }

  setError(key: string | null, detail: string | null = null) {
    this.errorKey = key;
    this.errorDetail = detail;
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
        if (error?.status === 401 || error?.status === 403) {
          this.navigateToError(error);
          this.isLoading = false;
          return;
        }
        this.setError('health_repo_error_fetch', String(error));
        this.isLoading = false;
      }
    );
  }

  loadAggregateReport() {
    this.healthReportService.getSummary().subscribe(
      (data) => {
        this.aggregateReport = data;
      },
      (err) => {
        console.warn('Could not load aggregate summary', err);
        if (err?.status === 401 || err?.status === 403) {
          this.navigateToError(err);
          return;
        }
        this.aggregateReport = null;
      }
    );
  }

  generateNewReport() {
    this.isLoading = true;
    this.setError(null);
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
         if (error?.status === 401 || error?.status === 403) {
           this.navigateToError(error);
           this.isLoading = false;
           return;
         }
         if (error.status === 429) {
              const errorCode = error?.error?.errorCode || 'health_report_limit_reached';
           this.setError(errorCode);
         } else {
           this.setError('health_repo_generation_failed', error?.message ? String(error.message) : null);
         }
         this.isLoading = false;
       }
    );
  }

  setTab(tab: 'history' | 'analysis' | 'overview') {
    this.activeTab = tab;
  }

  getOverviewReport(): HealthReport | null {
    return this.aggregateReport ?? this.latestReport ?? (this.reports.length > 0 ? this.reports[0] : null);
  }

  getMapTotal(map?: Record<string, number>): number {
    if (!map) return 0;
    return Object.values(map).reduce((sum, value) => sum + value, 0);
  }

  getTopEntries(map?: Record<string, number>, limit: number = 3): Array<{ label: string; count: number }> {
    if (!map) return [];
    const entries = Object.entries(map) as Array<[string, number]>;
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, count]: [string, number]) => ({ label, count }));
  }

  getMacroData(report: HealthReport): Array<{ label: string; percent: number; color: string }> {
    const entries = this.getTopEntries(report.dietLabelsCount, 3);
    const total = this.getMapTotal(report.dietLabelsCount);
    const fallback = [
      { label: this.t('health_repo_carbohydrates'), percent: 0, color: 'bg-blue-500' },
      { label: this.t('health_repo_proteins'), percent: 0, color: 'bg-green-500' },
      { label: this.t('health_repo_fats'), percent: 0, color: 'bg-yellow-500' }
    ];

    const mapped = entries.map((entry, index) => ({
      label: entry.label,
      percent: total > 0 ? Math.round((entry.count / total) * 100) : 0,
      color: fallback[index]?.color ?? 'bg-blue-500'
    }));

    while (mapped.length < 3) {
      mapped.push(fallback[mapped.length]);
    }

    return mapped;
  }

  getHealthData(report: HealthReport): Array<{ label: string; percent: number; state: 'good' | 'mid' | 'low' }> {
    const entries = this.getTopEntries(report.healthLabelsCount, 4);
    const total = this.getMapTotal(report.healthLabelsCount);
    const fallback = [this.t('health_repo_vit_c'), this.t('health_repo_iron'), this.t('health_repo_calcium'), this.t('health_repo_vit_d')];

    const mapped = entries.map((entry, index) => {
      const percent = total > 0 ? Math.round((entry.count / total) * 100) : 0;
      const state: 'good' | 'mid' | 'low' = percent >= 60 ? 'good' : percent >= 30 ? 'mid' : 'low';
      return { label: entry.label || fallback[index], percent, state };
    });

    while (mapped.length < 4) {
      mapped.push({ label: fallback[mapped.length], percent: 0, state: 'low' });
    }

    return mapped;
  }

  getHealthScore(report: HealthReport): number {
    const recipesCount = report.recipesAnalyzed || 0;
    if (recipesCount === 0) {
      return 0;
    }

    const dietRatio = this.getMapTotal(report.dietLabelsCount) / (recipesCount * 2);
    const healthRatio = this.getMapTotal(report.healthLabelsCount) / (recipesCount * 3);
    const cautionRatio = this.getMapTotal(report.cautionsCount) / (recipesCount * 2);
    const raw = 50 + (dietRatio * 15) + (healthRatio * 25) - (cautionRatio * 35);
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  getTrend(report: HealthReport): number {
    const reportIndex = this.reports.findIndex(r => r.id === report.id);
    if (reportIndex === -1 || reportIndex === this.reports.length - 1) return 0;

    const previous = this.reports[reportIndex + 1];
    return this.getHealthScore(report) - this.getHealthScore(previous);
  }

  scoreToDegrees(score: number): number {
    return Math.round((Math.max(0, Math.min(100, score)) / 100) * 360);
  }

  getCaloriesGoal(report: HealthReport): number {
    const recipesCount = report.recipesAnalyzed || 0;

    if (recipesCount === 0) {
      return 2000;
    }

    const recipeBasedGoal = recipesCount * 650;
    return Math.max(recipeBasedGoal, Math.round(report.totalCalories || 0));
  }

  getRemainingCalories(report: HealthReport): number {
    return Math.max(this.getCaloriesGoal(report) - Math.round(report.totalCalories || 0), 0);
  }

  getCaloriesProgress(report: HealthReport): number {
    const goal = this.getCaloriesGoal(report);
    return Math.max(0, Math.min(100, Math.round(((report.totalCalories || 0) / goal) * 100)));
  }
}
