import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BillingConfigService } from './billing-config.service';
import { BillingConfigController } from './billing-config.controller';
import { BillingService } from './billing.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [
    SubscriptionController,
    InvoiceController,
    PaymentController,
    BillingConfigController,
  ],
  providers: [
    SubscriptionService,
    InvoiceService,
    PaymentService,
    BillingConfigService,
    BillingService,
  ],
  exports: [
    SubscriptionService,
    InvoiceService,
    PaymentService,
    BillingConfigService,
    BillingService,
  ],
})
export class BillingModule {}
