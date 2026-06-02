import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routing.module';
import { provideHttpClient } from '@angular/common/http';

const _origError = console.error.bind(console);
console.error = (...args: any[]) => {
  const msg = args.map(a => (typeof a === 'string' ? a : (a?.message ?? JSON.stringify(a)))).join(' ');
  if (args[0]?.status === 0 || args[0]?.type === undefined && args[0]?.ok === false) return;
  if (msg.includes('Lost connection') || msg.includes('Whoops!')) return;
  if (msg.includes('Error loading icon') || msg.includes('Error loading favicon')) return;
  _origError(...args);
};

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
}).catch(err => _origError(err));
