import { DynamicModule, Module, Provider } from '@nestjs/common';
import { NullPaymentGateway } from './implementations/null-payment-gateway';
import { StripePaymentGateway } from './implementations/stripe-payment-gateway';

export const PAYMENT_GATEWAY_TOKEN = 'PAYMENT_GATEWAY';

@Module({})
export class PaymentGatewayModule {
  static forRoot(): DynamicModule {
    const gatewayProvider: Provider = {
      provide: PAYMENT_GATEWAY_TOKEN,
      useFactory: () => {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey) {
          return new StripePaymentGateway(stripeKey);
        }
        return new NullPaymentGateway();
      },
    };

    return {
      module: PaymentGatewayModule,
      providers: [gatewayProvider],
      exports: [gatewayProvider],
      global: true,
    };
  }
}
