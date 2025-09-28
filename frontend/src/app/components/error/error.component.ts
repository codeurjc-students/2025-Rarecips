import { Component } from "@angular/core";

@Component({
  selector: "app-error",
  templateUrl: "./error.component.html",
  styleUrls: ["./error.component.css"]
})
export class ErrorComponent {

    constructor() {}

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
