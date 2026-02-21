import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {routes} from '../../app.routing.module';
import { TranslatorService } from '../../services/translator.service';

@Component({
  selector: "app-error",
  templateUrl: "./error.component.html",
  imports: [
    RouterLink
  ],
  styleUrls: ["./error.component.css"]
})
export class ErrorComponent implements OnInit {
  status: number | null = null;
  reason: string | null = null;

  constructor(private activatedRoute: ActivatedRoute, private translator: TranslatorService) {}

  t(key: string): string {
    return this.translator.translate(key);
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.status = history.state.status || null;
      this.reason = history.state.reason || null;
    });
  }

  toggleEgg() {
    let egg = document.querySelector(".egg") as HTMLElement;
    let eggCr = document.querySelector(".egg-cr") as HTMLElement;
    egg.animate([
      { transform: 'translateY(-60px)', opacity: 1 },
      { transform: 'translateY(0px)', opacity: 0 },
      { opacity: 0 }
    ], {
      duration: 600,
      easing: 'ease',
      fill: 'forwards'
    });
    eggCr.animate([
      { opacity: 0, transform: 'scaleY(0%)' },
      { opacity: 0, transform: 'scaleY(100%)' },
      { opacity: 1 },
      { transform: 'rotate(-90deg) translateY(-40px)' },
      { opacity: 1, transform: 'rotate(-90deg) translateY(-40px)' }
    ], {
      duration: 600,
      easing: 'ease',
      fill: 'forwards'
    });
  }
}
