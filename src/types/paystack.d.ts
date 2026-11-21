declare module '@paystack/inline-js' {
  export interface PaystackTransaction {
    reference: string;
    [key: string]: any;
  }

  export default class PaystackPop {
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      metadata?: any;
      onSuccess?: (transaction: PaystackTransaction) => void;
      onCancel?: () => void;
    }): void;
  }
}