import Stripe from 'stripe';
import { PaymentOutcome, PaymentResponseSchemaDTO } from '../../src/dtos/mock-payment.dto';

export const mockEvent__paymentIntent_amountCapturableUpdated: Stripe.Event = {
  id: 'evt_11111',
  object: 'event',
  api_version: '2024-04-10',
  created: 1717093717,
  data: {
    object: {
      id: 'pi_11111',
      object: 'payment_intent',
      amount: 12300,
      amount_capturable: 12300,
      amount_details: {
        tip: {},
      },
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'manual',
      client_secret: 'pi_22222',
      confirmation_method: 'automatic',
      created: 1717093717,
      currency: 'mxn',
      customer: null,
      description: 'Sport shoes',
      invoice: null,
      last_payment_error: null,
      latest_charge: 'ch_11111',
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_11111',
      payment_method_configuration_details: null,
      payment_method_options: {
        card: {
          installments: null,
          mandate_options: null,
          network: null,
          request_three_d_secure: 'automatic',
        },
      },
      payment_method_types: ['card'],
      processing: null,
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: 'Payment',
      statement_descriptor_suffix: null,
      status: 'requires_capture',
      transfer_data: null,
      transfer_group: null,
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_11111',
    idempotency_key: '11111',
  },
  type: 'payment_intent.amount_capturable_updated',
};

export const mockEvent__paymentIntent_processing: Stripe.Event = {
  id: 'evt_00000000000',
  object: 'event',
  api_version: '2024-04-10',
  created: 1717093717,
  data: {
    object: {
      id: 'pi_11111',
      object: 'payment_intent',
      amount: 12300,
      amount_capturable: 12300,
      amount_details: {
        tip: {},
      },
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'manual',
      client_secret: 'pi_22222',
      confirmation_method: 'automatic',
      created: 1717093717,
      currency: 'mxn',
      customer: null,
      description: 'Sport shoes',
      invoice: null,
      last_payment_error: null,
      latest_charge: 'ch_11111',
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_11111',
      payment_method_configuration_details: null,
      payment_method_options: {
        card: {
          installments: null,
          mandate_options: null,
          network: null,
          request_three_d_secure: 'automatic',
        },
      },
      payment_method_types: ['card'],
      processing: null,
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: 'Payment',
      statement_descriptor_suffix: null,
      status: 'requires_capture',
      transfer_data: null,
      transfer_group: null,
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_11111',
    idempotency_key: '11111',
  },
  type: 'payment_intent.processing',
};

export const mockEvent__paymentIntent_paymentFailed: Stripe.Event = {
  id: 'evt_11111',
  object: 'event',
  api_version: '2024-04-10',
  created: 1717093717,
  data: {
    object: {
      id: 'pi_11111',
      object: 'payment_intent',
      amount: 12300,
      amount_capturable: 12300,
      amount_details: {
        tip: {},
      },
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'manual',
      client_secret: 'pi_22222',
      confirmation_method: 'automatic',
      created: 1717093717,
      currency: 'mxn',
      customer: null,
      description: 'Sport shoes',
      invoice: null,
      last_payment_error: null,
      latest_charge: 'ch_11111',
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_11111',
      payment_method_configuration_details: null,
      payment_method_options: {
        card: {
          installments: null,
          mandate_options: null,
          network: null,
          request_three_d_secure: 'automatic',
        },
      },
      payment_method_types: ['card'],
      processing: null,
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: 'Payment',
      statement_descriptor_suffix: null,
      status: 'requires_capture',
      transfer_data: null,
      transfer_group: null,
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_11111',
    idempotency_key: '11111',
  },
  type: 'payment_intent.payment_failed',
};

export const mockEvent__paymentIntent_succeeded: Stripe.Event = {
  id: 'evt_11111',
  object: 'event',
  api_version: '2024-04-10',
  created: 1717093717,
  data: {
    object: {
      id: 'pi_11111',
      object: 'payment_intent',
      amount: 12300,
      amount_capturable: 12300,
      amount_details: {
        tip: {},
      },
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: null,
      cancellation_reason: null,
      capture_method: 'manual',
      client_secret: 'pi_22222',
      confirmation_method: 'automatic',
      created: 1717093717,
      currency: 'mxn',
      customer: null,
      description: 'Sport shoes',
      invoice: null,
      last_payment_error: null,
      latest_charge: 'ch_11111',
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_11111',
      payment_method_configuration_details: null,
      payment_method_options: {
        card: {
          installments: null,
          mandate_options: null,
          network: null,
          request_three_d_secure: 'automatic',
        },
      },
      payment_method_types: ['card'],
      processing: null,
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: 'Payment',
      statement_descriptor_suffix: null,
      status: 'requires_capture',
      transfer_data: null,
      transfer_group: null,
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_11111',
    idempotency_key: '11111',
  },
  type: 'payment_intent.succeeded',
};

export const mockEvent__charge_refund_captured: Stripe.Event = {
  id: 'evt_11111',
  object: 'event',
  api_version: '2024-04-10',
  created: 1717531265,
  data: {
    object: {
      id: 'ch_11111',
      object: 'charge',
      amount: 34500,
      amount_captured: 34500,
      amount_refunded: 34500,
      application: null,
      application_fee: null,
      application_fee_amount: null,
      balance_transaction: 'txn_11111',
      billing_details: {
        address: {
          city: null,
          country: null,
          line1: null,
          line2: null,
          postal_code: '12312',
          state: null
        },
        email: null,
        name: null,
        phone: null
      },
      calculated_statement_descriptor: 'ABCDE',
      captured: true,
      created: 1717529587,
      currency: 'mxn',
      customer: null,
      description: 'Sport shoes',
      disputed: false,
      failure_balance_transaction: null,
      failure_code: null,
      failure_message: null,
      fraud_details: {},
      invoice: null,
      livemode: false,
      metadata: {},
      on_behalf_of: null,
      outcome: {
        network_status: 'approved_by_network',
        reason: null,
        risk_level: 'normal',
        risk_score: 8,
        seller_message: 'Payment complete.',
        type: 'authorized'
      },
      paid: true,
      payment_intent: 'pi_11111',
      payment_method: 'pm_11111',
      payment_method_details: {
        card: {
          amount_authorized: 34500,
          brand: 'visa',
          checks: {
            address_line1_check: null,
            address_postal_code_check: 'pass',
            cvc_check: 'pass'
          },
          country: 'US',
          exp_month: 12,
          exp_year: 2026,
          extended_authorization: {
            status: 'disabled'
          },
          fingerprint: '12345',
          funding: 'credit',
          incremental_authorization: {
            status: 'unavailable'
          },
          installments: null,
          last4: '1111',
          mandate: null,
          multicapture: {
            status: 'unavailable'
          },
          network: 'visa',
          network_token: {
            used: false
          },
          overcapture: {
            maximum_amount_capturable: 34500,
            status: 'unavailable'
          },
          three_d_secure: null,
          wallet: null
        },
        type: 'card'
      },
      radar_options: {},
      receipt_email: null,
      receipt_number: null,
      receipt_url: 'https://pay.stripe.com/receipts/payment/ABCDE',
      refunded: true,
      review: null,
      shipping: null,
      source: null,
      source_transfer: null,
      statement_descriptor: 'ABCDE',
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null
    },
    previous_attributes: {
      amount_refunded: 0,
      receipt_url: 'https://pay.stripe.com/receipts/payment/ABCDE',
      refunded: false
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_11111',
    idempotency_key: '12345'
  },
  type: 'charge.refunded'
};

export const mockEvent__charge_refund_notCaptured: Stripe.Event = {
  id: 'evt_11111',
  object: 'event',
  api_version: '2024-04-10',
  created: 1717531265,
  data: {
    object: {
      id: 'ch_11111',
      object: 'charge',
      amount: 34500,
      amount_captured: 34500,
      amount_refunded: 34500,
      application: null,
      application_fee: null,
      application_fee_amount: null,
      balance_transaction: 'txn_11111',
      billing_details: {
        address: {
          city: null,
          country: null,
          line1: null,
          line2: null,
          postal_code: '12312',
          state: null
        },
        email: null,
        name: null,
        phone: null
      },
      calculated_statement_descriptor: 'ABCDE',
      captured: false,
      created: 1717529587,
      currency: 'mxn',
      customer: null,
      description: 'Sport shoes',
      disputed: false,
      failure_balance_transaction: null,
      failure_code: null,
      failure_message: null,
      fraud_details: {},
      invoice: null,
      livemode: false,
      metadata: {},
      on_behalf_of: null,
      outcome: {
        network_status: 'approved_by_network',
        reason: null,
        risk_level: 'normal',
        risk_score: 8,
        seller_message: 'Payment complete.',
        type: 'authorized'
      },
      paid: true,
      payment_intent: 'pi_11111',
      payment_method: 'pm_11111',
      payment_method_details: {
        card: {
          amount_authorized: 34500,
          brand: 'visa',
          checks: {
            address_line1_check: null,
            address_postal_code_check: 'pass',
            cvc_check: 'pass'
          },
          country: 'US',
          exp_month: 12,
          exp_year: 2026,
          extended_authorization: {
            status: 'disabled'
          },
          fingerprint: '12345',
          funding: 'credit',
          incremental_authorization: {
            status: 'unavailable'
          },
          installments: null,
          last4: '1111',
          mandate: null,
          multicapture: {
            status: 'unavailable'
          },
          network: 'visa',
          network_token: {
            used: false
          },
          overcapture: {
            maximum_amount_capturable: 34500,
            status: 'unavailable'
          },
          three_d_secure: null,
          wallet: null
        },
        type: 'card'
      },
      radar_options: {},
      receipt_email: null,
      receipt_number: null,
      receipt_url: 'https://pay.stripe.com/receipts/payment/ABCDE',
      refunded: true,
      review: null,
      shipping: null,
      source: null,
      source_transfer: null,
      statement_descriptor: 'ABCDE',
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null
    },
    previous_attributes: {
      amount_refunded: 0,
      receipt_url: 'https://pay.stripe.com/receipts/payment/ABCDE',
      refunded: false
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_11111',
    idempotency_key: '12345'
  },
  type: 'charge.refunded'
};

export const mockEvent__paymentIntent_canceled: Stripe.Event = {
  id: 'evt_11111',
  object: 'event',
  api_version: '2024-04-10',
  created: 1717607367,
  data: {
    object: {
      id: 'pi_11111',
      object: 'payment_intent',
      amount: 45600,
      amount_capturable: 0,
      amount_details: {
        tip: {}
      },
      amount_received: 0,
      application: null,
      application_fee_amount: null,
      automatic_payment_methods: null,
      canceled_at: 1717607367,
      cancellation_reason: 'requested_by_customer',
      capture_method: 'manual',
      client_secret: 'pi_11111AAAAA',
      confirmation_method: 'automatic',
      created: 1717452983,
      currency: 'mxn',
      customer: null,
      description: 'Sport shoes',
      invoice: null,
      last_payment_error: null,
      latest_charge: 'ch_11111',
      livemode: false,
      metadata: {},
      next_action: null,
      on_behalf_of: null,
      payment_method: 'pm_11111',
      payment_method_configuration_details: null,
      payment_method_options: {
        card: {
          installments: null,
          mandate_options: null,
          network: null,
          request_three_d_secure: 'automatic'
        }
      },
      payment_method_types: [
        'card'
      ],
      processing: null,
      receipt_email: null,
      review: null,
      setup_future_usage: null,
      shipping: null,
      source: null,
      statement_descriptor: 'asdad',
      statement_descriptor_suffix: null,
      status: 'canceled',
      transfer_data: null,
      transfer_group: null
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_11111',
    idempotency_key: 'ASDFG-12345'
  },
  type: 'payment_intent.canceled'
};

export const mockRoute__getPaymentIntent_succeed: PaymentIntentResponseSchemaDTO = {
  id: 'mock_id',
  client_secret: 'mock_client_secret',
};

export const mockRoute__payments_succeed: PaymentResponseSchemaDTO = {
  outcome: PaymentOutcome.INITIAL,
  ctPaymentReference: 'mock_paymentReference',
  sClientSecret: 'mock_client_secret',
};
