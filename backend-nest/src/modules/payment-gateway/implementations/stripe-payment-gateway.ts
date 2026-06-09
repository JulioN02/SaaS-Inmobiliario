import type { PaymentGatewayPort } from '../payment-gateway.port';
import { PaymentGatewayException } from '../payment-gateway.exception';

export class StripePaymentGateway implements PaymentGatewayPort {
  constructor(private readonly apiKey: string) {}

  async createCustomer(
    data: { name: string; email: string },
  ): Promise<{ customerId: string }> {
    throw new PaymentGatewayException(
      'Stripe no configurado. Configure STRIPE_SECRET_KEY en el entorno.',
      'STRIPE_NOT_CONFIGURED',
    );
  }

  async createSubscription(
    customerId: string,
    planPriceId: string,
  ): Promise<{ subscriptionId: string }> {
    throw new PaymentGatewayException(
      'Stripe no configurado. Configure STRIPE_SECRET_KEY en el entorno.',
      'STRIPE_NOT_CONFIGURED',
    );
  }

  async createInvoice(
    customerId: string,
    amount: number,
    currency: string,
  ): Promise<{ invoiceId: string; invoiceUrl?: string }> {
    throw new PaymentGatewayException(
      'Stripe no configurado. Configure STRIPE_SECRET_KEY en el entorno.',
      'STRIPE_NOT_CONFIGURED',
    );
  }

  async getInvoice(
    invoiceId: string,
  ): Promise<{ status: string; paid: boolean; amount: number }> {
    throw new PaymentGatewayException(
      'Stripe no configurado. Configure STRIPE_SECRET_KEY en el entorno.',
      'STRIPE_NOT_CONFIGURED',
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    throw new PaymentGatewayException(
      'Stripe no configurado. Configure STRIPE_SECRET_KEY en el entorno.',
      'STRIPE_NOT_CONFIGURED',
    );
  }

  async chargeCustomer(data: {
    customerId: string;
    amount: number;
    currency: string;
  }): Promise<{ transactionId: string }> {
    throw new PaymentGatewayException(
      'Stripe no configurado. Configure STRIPE_SECRET_KEY en el entorno.',
      'STRIPE_NOT_CONFIGURED',
    );
  }
}
