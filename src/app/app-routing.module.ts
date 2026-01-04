import { NgModule } from '@angular/core';
import { NoPreloading, RouterModule } from '@angular/router';
import { routes } from './app.routes';

const allRoutes = routes;
@NgModule({
  imports: [
    RouterModule.forRoot(allRoutes, {
      preloadingStrategy: NoPreloading,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
