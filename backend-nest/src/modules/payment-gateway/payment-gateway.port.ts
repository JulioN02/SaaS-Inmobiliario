export interface PaymentGatewayPort {
  createCustomer(data: { name: string; email: string }): Promise<{ customerId: string }>;
  createSubscription(customerId: string, planPriceId: string): Promise<{ subscriptionId: string }>;
  createInvoice(
    customerId: string,
    amount: number,
    currency: string,
  ): Promise<{ invoiceId: string; invoiceUrl?: string }>;
  getInvoice(
    invoiceId: string,
  ): Promise<{ status: string; paid: boolean; amount: number }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  chargeCustomer(data: {
    customerId: string;
    amount: number;
    currency: string;
  }): Promise<{ transactionId: string }>;
}
