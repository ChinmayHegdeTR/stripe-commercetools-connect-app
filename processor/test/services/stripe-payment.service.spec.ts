import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ConfigResponse, ModifyPayment, StatusResponse } from '../../src/services/types/operation.type';
import { paymentSDK } from '../../src/payment-sdk';
import { DefaultPaymentService } from '@commercetools/connect-payments-sdk/dist/commercetools/services/ct-payment.service';
import { DefaultCartService } from '@commercetools/connect-payments-sdk/dist/commercetools/services/ct-cart.service';
import {
  mockGetPaymentAmount,
  mockGetPaymentResult,
  mockStripeCancelPaymentResult,
  mockStripeCreatePaymentResult,
  mockStripeCreateRefundResult,
  mockStripePaymentMethodsList,
  mockStripeRetrievePaymentResult,
  mockStripeUpdatePaymentResult,
  mockUpdatePaymentResult,
  mockStripeCapturePaymentResult,
} from '../utils/mock-payment-results';
import {
  mockEvent__charge_refund_captured,
  mockEvent__charge_succeeded_notCaptured,
  mockEvent__paymentIntent_canceled,
  mockEvent__paymentIntent_succeeded_captureMethodManual,
} from '../utils/mock-routes-data';
import { mockGetCartResult } from '../utils/mock-cart-data';
import * as Config from '../../src/config/config';
import { StripePaymentServiceOptions } from '../../src/services/types/stripe-payment.type';
import { AbstractPaymentService } from '../../src/services/abstract-payment.service';
import { StripePaymentService } from '../../src/services/stripe-payment.service';
import * as StatusHandler from '@commercetools/connect-payments-sdk/dist/api/handlers/status.handler';
import { HealthCheckResult } from '@commercetools/connect-payments-sdk';
import * as Logger from '../../src/libs/logger/index';

import Stripe from 'stripe';
import * as StripeClient from '../../src/clients/stripe.client';
import { SupportedPaymentComponentsSchemaDTO } from '../../src/dtos/operations/payment-componets.dto';

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      cancel: jest
        .fn<() => Promise<Stripe.Response<Stripe.PaymentIntent>>>()
        .mockResolvedValue(mockStripeCancelPaymentResult),
      retrieve: jest
        .fn<() => Promise<Stripe.Response<Stripe.PaymentIntent>>>()
        .mockResolvedValue(mockStripeRetrievePaymentResult),
      create: jest
        .fn<() => Promise<Stripe.Response<Stripe.PaymentIntent>>>()
        .mockResolvedValue(mockStripeCreatePaymentResult),
      update: jest
        .fn<() => Promise<Stripe.Response<Stripe.PaymentIntent>>>()
        .mockResolvedValue(mockStripeUpdatePaymentResult),
      capture: jest
        .fn<() => Promise<Stripe.Response<Stripe.PaymentIntent>>>()
        .mockResolvedValue(mockStripeCapturePaymentResult),
    },
    refunds: {
      create: jest.fn<() => Promise<Stripe.Response<Stripe.Refund>>>().mockResolvedValue(mockStripeCreateRefundResult),
    },
    paymentMethods: {
      list: jest
        .fn<() => Promise<Stripe.ApiList<Stripe.PaymentMethod>>>()
        .mockResolvedValue(mockStripePaymentMethodsList),
    },
  })),
}));
jest.mock('../../src/libs/logger');

interface FlexibleConfig {
  [key: string]: string; // Adjust the type according to your config values
}

function setupMockConfig(keysAndValues: Record<string, string>) {
  const mockConfig: FlexibleConfig = {};
  Object.keys(keysAndValues).forEach((key) => {
    mockConfig[key] = keysAndValues[key];
  });

  jest.spyOn(Config, 'getConfig').mockReturnValue(mockConfig as any);
}

describe('stripe-payment.service', () => {
  const opts: StripePaymentServiceOptions = {
    ctCartService: paymentSDK.ctCartService,
    ctPaymentService: paymentSDK.ctPaymentService,
    ctOrderService: paymentSDK.ctOrderService,
  };
  const paymentService: AbstractPaymentService = new StripePaymentService(opts);

  beforeEach(() => {
    jest.setTimeout(10000);
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('method getConfig', () => {
    test('should return the Stripe configuration successfully', async () => {
      // Setup mock config for a system using `clientKey`
      setupMockConfig({ stripePublishableKey: '', mockEnvironment: 'TEST' });

      const result: ConfigResponse = await paymentService.config();

      // Assertions can remain the same or be adapted based on the abstracted access
      expect(result?.publishableKey).toStrictEqual('');
      expect(result?.environment).toStrictEqual('TEST');
    });
  });

  describe('method getSupportedPaymentComponents', () => {
    test('should return supported payment components successfully', async () => {
      const result: SupportedPaymentComponentsSchemaDTO = await paymentService.getSupportedPaymentComponents();
      expect(result?.dropins).toHaveLength(1);
      expect(result?.dropins[0]?.type).toStrictEqual('embedded');
    });
  });

  describe('method status', () => {
    test('should return Stripe status successfully', async () => {
      const mockHealthCheckFunction: () => Promise<HealthCheckResult> = async () => {
        const result: HealthCheckResult = {
          name: 'CoCo Permissions',
          status: 'DOWN',
          message: 'CoCo Permissions are not available',
          details: {},
        };
        return result;
      };
      Stripe.prototype.paymentMethods = {
        list: jest
          .fn<() => Promise<Stripe.ApiList<Stripe.PaymentMethod>>>()
          .mockResolvedValue(mockStripePaymentMethodsList),
      } as unknown as Stripe.PaymentMethodsResource;

      jest.spyOn(StatusHandler, 'healthCheckCommercetoolsPermissions').mockReturnValue(mockHealthCheckFunction);
      const paymentService: AbstractPaymentService = new StripePaymentService(opts);
      const result: StatusResponse = await paymentService.status();

      expect(result?.status).toBeDefined();
      expect(result?.checks).toHaveLength(2);
      expect(result?.status).toStrictEqual('Partially Available');
      expect(result?.checks[0]?.name).toStrictEqual('CoCo Permissions');
      expect(result?.checks[0]?.status).toStrictEqual('DOWN');
      expect(result?.checks[0]?.details).toStrictEqual({});
      expect(result?.checks[0]?.message).toBeDefined();
      expect(result?.checks[1]?.name).toStrictEqual('Stripe Status check');
      expect(result?.checks[1]?.status).toStrictEqual('UP');
      expect(result?.checks[1]?.details).toBeDefined();
      expect(result?.checks[1]?.message).toBeDefined();
    });
  });

  describe('method modifyPayment', () => {
    test('should cancel a payment successfully', async () => {
      const modifyPaymentOpts: ModifyPayment = {
        paymentId: 'dummy-paymentId',
        data: {
          actions: [
            {
              action: 'cancelPayment',
            },
          ],
        },
      };

      const getPaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'getPayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));
      const updatePaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'updatePayment')
        .mockReturnValue(Promise.resolve(mockUpdatePaymentResult));

      const result = await paymentService.modifyPayment(modifyPaymentOpts);
      expect(result?.outcome).toStrictEqual('approved');
      expect(getPaymentMock).toHaveBeenCalled();
      expect(updatePaymentMock).toHaveBeenCalledTimes(2);
    });

    test('should capture a payment successfully', async () => {
      //Given
      const modifyPaymentOpts: ModifyPayment = {
        paymentId: 'dummy-paymentId',
        data: {
          actions: [
            {
              action: 'capturePayment',
              amount: {
                centAmount: 150000,
                currencyCode: 'USD',
              },
            },
          ],
        },
      };

      const getPaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'getPayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));
      const updatePaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'updatePayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));

      const result = await paymentService.modifyPayment(modifyPaymentOpts);
      expect(result?.outcome).toStrictEqual('approved');
      expect(getPaymentMock).toHaveBeenCalled();
      expect(updatePaymentMock).toHaveBeenCalledTimes(2);
    });

    test('should refund a payment successfully', async () => {
      const modifyPaymentOpts: ModifyPayment = {
        paymentId: 'dummy-paymentId',
        data: {
          actions: [
            {
              action: 'refundPayment',
              amount: {
                centAmount: 150000,
                currencyCode: 'USD',
              },
            },
          ],
        },
      };

      const getPaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'getPayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));
      const updatePaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'updatePayment')
        .mockReturnValue(Promise.resolve(mockUpdatePaymentResult));

      const result = await paymentService.modifyPayment(modifyPaymentOpts);
      expect(result?.outcome).toStrictEqual('received');
      expect(getPaymentMock).toHaveBeenCalled();
      expect(updatePaymentMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('method updatePaymentIntentStripeSuccessful', () => {
    test('should update the commercetools payment "Authorization" from "Initial" to "Success"', async () => {
      const getCartMock = jest
        .spyOn(DefaultCartService.prototype, 'getCart')
        .mockReturnValue(Promise.resolve(mockGetCartResult()));
      const getPaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'getPayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));
      const getPaymentAmountMock = jest
        .spyOn(DefaultCartService.prototype, 'getPaymentAmount')
        .mockResolvedValue(mockGetPaymentAmount);

      const updatePaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'updatePayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));

      const stripePaymentService: StripePaymentService = new StripePaymentService(opts);
      await stripePaymentService.updatePaymentIntentStripeSuccessful('paymentId');

      expect(getCartMock).toHaveBeenCalled();
      expect(getPaymentMock).toHaveBeenCalled();
      expect(getPaymentAmountMock).toHaveBeenCalled();
      expect(updatePaymentMock).toHaveBeenCalled();
    });
  });

  describe('method createPaymentIntentStripe', () => {
    test('should createPaymentIntent successful', async () => {
      // mocking all the function calls
      Stripe.prototype.paymentIntents = {
        create: jest.fn(),
        update: jest.fn(),
      } as unknown as Stripe.PaymentIntentsResource;
      const getCartMock = jest
        .spyOn(DefaultCartService.prototype, 'getCart')
        .mockReturnValue(Promise.resolve(mockGetCartResult()));
      const getPaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'getPayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));
      const getPaymentAmountMock = jest
        .spyOn(DefaultCartService.prototype, 'getPaymentAmount')
        .mockResolvedValue(mockGetPaymentAmount);
      const stripeApiMock = jest
        .spyOn(Stripe.prototype.paymentIntents, 'create')
        .mockReturnValue(Promise.resolve(mockStripeCreatePaymentResult));
      const updatePaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'updatePayment')
        .mockReturnValue(Promise.resolve(mockUpdatePaymentResult));

      const stripePaymentService: StripePaymentService = new StripePaymentService(opts);
      const result = await stripePaymentService.createPaymentIntentStripe();

      expect(result.sClientSecret).toStrictEqual(mockStripeCreatePaymentResult.client_secret);
      expect(result).toBeDefined();

      // Or check that the relevant mocks have been called
      expect(getCartMock).toHaveBeenCalled();
      expect(getPaymentMock).toHaveBeenCalled();
      expect(getPaymentAmountMock).toHaveBeenCalled();
      expect(stripeApiMock).toHaveBeenCalled();
      expect(updatePaymentMock).toHaveBeenCalled();
    });

    test('should fail to create the payment intent', async () => {
      // mocking all the function calls
      Stripe.prototype.paymentIntents = {
        create: jest.fn(),
        update: jest.fn(),
      } as unknown as Stripe.PaymentIntentsResource;
      const getCartMock = jest
        .spyOn(DefaultCartService.prototype, 'getCart')
        .mockReturnValue(Promise.resolve(mockGetCartResult()));
      const getPaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'getPayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));
      const getPaymentAmountMock = jest
        .spyOn(DefaultCartService.prototype, 'getPaymentAmount')
        .mockResolvedValue(mockGetPaymentAmount);
      const stripeApiMock = jest.spyOn(Stripe.prototype.paymentIntents, 'create').mockImplementation(() => {
        throw new Error('error');
      });
      const updatePaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'updatePayment')
        .mockReturnValue(Promise.resolve(mockGetPaymentResult));
      const wrapStripErrorMock = jest
        .spyOn(StripeClient, 'wrapStripeError')
        .mockReturnValue(new Error('Unexpected error calling Stripe API'));
      const wrapStripeError = jest
        .spyOn(StripeClient, 'wrapStripeError')
        .mockReturnValue(new Error('Unexpected error calling Stripe API'));

      const stripePaymentService: StripePaymentService = new StripePaymentService(opts);
      try {
        await stripePaymentService.createPaymentIntentStripe();
      } catch (e) {
        console.log(e);
        expect(wrapStripeError).toHaveBeenCalledWith(new Error('error'));
      }

      // Or check that the relevant mocks have been called
      expect(getCartMock).toHaveBeenCalled();
      expect(updatePaymentMock).toHaveBeenCalledTimes(0);
      expect(getPaymentAmountMock).toHaveBeenCalled();
      expect(stripeApiMock).toHaveBeenCalled();
      expect(wrapStripErrorMock).toHaveBeenCalled();
      expect(updatePaymentMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('method initializeCartPayment', () => {
    test('should return the configuration element and create in the cart a payment "Authorization" as "Initial"', async () => {
      const getCartMock = jest
        .spyOn(DefaultCartService.prototype, 'getCart')
        .mockReturnValue(Promise.resolve(mockGetCartResult()));
      const getPaymentAmountMock = jest
        .spyOn(DefaultCartService.prototype, 'getPaymentAmount')
        .mockResolvedValue(mockGetPaymentAmount);
      const createPaymentMock = jest
        .spyOn(DefaultPaymentService.prototype, 'createPayment')
        .mockResolvedValue(mockGetPaymentResult);
      const addPaymentMock = jest
        .spyOn(DefaultCartService.prototype, 'addPayment')
        .mockResolvedValue(mockGetCartResult());

      const stripePaymentService: StripePaymentService = new StripePaymentService(opts);
      const result = await stripePaymentService.initializeCartPayment('payment');

      expect(result.cartInfo.currency).toStrictEqual(mockGetPaymentAmount.currencyCode);
      expect(result.cartInfo.amount).toStrictEqual(mockGetPaymentAmount.centAmount);
      expect(result).toBeDefined();

      // Or check that the relevant mocks have been called
      expect(getCartMock).toHaveBeenCalled();
      expect(getPaymentAmountMock).toHaveBeenCalled();
      expect(createPaymentMock).toHaveBeenCalled();
      expect(addPaymentMock).toHaveBeenCalled();
      expect(Logger.log.info).toBeCalled();
    });
  });

  describe('method getModifyData', () => {
    test('should return correct ModifyPayment for a payment_intent succeeded manual event', () => {
      const mockEvent: Stripe.Event = mockEvent__paymentIntent_succeeded_captureMethodManual;

      const stripePaymentService: StripePaymentService = new StripePaymentService(opts);
      const result = stripePaymentService.getModifyData(mockEvent);

      expect(result).toEqual({
        paymentId: undefined,
        stripePaymentIntent: 'pi_11111',
        data: {
          actions: [
            {
              action: 'capturePayment',
              amount: {
                centAmount: 13200,
                currencyCode: 'MXN',
              },
            },
          ],
        },
      });
    });

    test('should return correct ModifyPayment for a charge refunded', () => {
      const mockEvent: Stripe.Event = mockEvent__charge_refund_captured;

      const stripePaymentService: StripePaymentService = new StripePaymentService(opts);
      const result = stripePaymentService.getModifyData(mockEvent);

      expect(result).toEqual({
        paymentId: 'pi_11111',
        stripePaymentIntent: undefined,
        data: {
          actions: [
            {
              action: 'refundPayment',
              amount: {
                centAmount: 34500,
                currencyCode: 'MXN',
              },
            },
          ],
        },
      });
    });

    test('should return correct ModifyPayment for a charge event', () => {
      const mockEvent: Stripe.Event = mockEvent__paymentIntent_canceled;

      const stripePaymentService: StripePaymentService = new StripePaymentService(opts);
      const result = stripePaymentService.getModifyData(mockEvent);

      expect(result).toEqual({
        paymentId: undefined,
        stripePaymentIntent: 'pi_11111',
        data: {
          actions: [
            {
              action: 'cancelPayment',
              amount: {
                centAmount: 0,
                currencyCode: 'MXN',
              },
            },
          ],
        },
      });
    });
  });
});
