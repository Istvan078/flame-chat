import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule } from '@angular/router';
import { routes } from './app.routes';

const allRoutes = routes;
@NgModule({
  imports: [
    RouterModule.forRoot(allRoutes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
