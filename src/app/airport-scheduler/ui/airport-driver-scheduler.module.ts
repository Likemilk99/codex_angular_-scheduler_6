import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AirportDriverSchedulerComponent } from './airport-driver-scheduler.component';

@NgModule({
  declarations: [AirportDriverSchedulerComponent],
  imports: [CommonModule],
  exports: [AirportDriverSchedulerComponent]
})
export class AirportDriverSchedulerModule {}
