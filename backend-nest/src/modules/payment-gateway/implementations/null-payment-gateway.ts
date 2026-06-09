import type { PaymentGatewayPort } from '../payment-gateway.port';

const generateId = () => Math.random().toString(36).substring(2, 10);

export class NullPaymentGateway implements PaymentGatewayPort {
  private prefix = 'null_';

  async createCustomer(data: { name: string; email: string }) {
    return { customerId: `${this.prefix}cus_${generateId()}` };
  }

  async createSubscription(customerId: string, planPriceId: string) {
    return { subscriptionId: `${this.prefix}sub_${generateId()}` };
  }

  async createInvoice(customerId: string, amount: number, currency: string) {
    return {
      invoiceId: `${this.prefix}inv_${generateId()}`,
      invoiceUrl: undefined,
    };
  }

  async getInvoice(invoiceId: string) {
    return { status: 'paid', paid: true, amount: 0 };
  }

  async cancelSubscription(subscriptionId: string) {
    // no-op
  }

  async chargeCustomer(data: {
    customerId: string;
    amount: number;
    currency: string;
  }) {
    return { transactionId: `${this.prefix}txn_${generateId()}` };
  }
}
