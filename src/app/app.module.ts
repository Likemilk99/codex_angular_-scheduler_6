import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AirportDriverSchedulerModule } from './airport-scheduler/ui/airport-driver-scheduler.module';
import { DriverManagerPageComponent } from './pages/driver-manager/driver-manager-page.component';

@NgModule({
  declarations: [AppComponent, DriverManagerPageComponent],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule, AirportDriverSchedulerModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
