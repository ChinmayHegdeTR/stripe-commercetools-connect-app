import Stripe from 'stripe';
import { healthCheckCommercetoolsPermissions, statusHandler } from '@commercetools/connect-payments-sdk';
import { Customer } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/customer';
import {
  CancelPaymentRequest,
  CapturePaymentRequest,
  ConfigResponse,
  PaymentProviderModificationResponse,
  RefundPaymentRequest,
  StatusResponse,
} from './types/operation.type';

import { SupportedPaymentComponentsSchemaDTO } from '../dtos/operations/payment-componets.dto';
import { PaymentModificationStatus, PaymentTransactions } from '../dtos/operations/payment-intents.dto';
import packageJSON from '../../package.json';

import { AbstractPaymentService } from './abstract-payment.service';
import { getConfig } from '../config/config';
import { appLogger, paymentSDK } from '../payment-sdk';
import { CaptureMethod, StripeEvent, StripePaymentServiceOptions } from './types/stripe-payment.type';
import { ConfigElementResponseSchemaDTO, PaymentOutcome, PaymentResponseSchemaDTO } from '../dtos/stripe-payment.dto';
import {
  getCartIdFromContext,
  getMerchantReturnUrlFromContext,
  getPaymentInterfaceFromContext,
} from '../libs/fastify/context/context';
import { stripeApi, wrapStripeError } from '../clients/stripe.client';
import { log } from '../libs/logger';
import crypto from 'crypto';
import { StripeEventConverter } from './converters/stripeEventConverter';
import { Cart } from '@commercetools/platform-sdk';

export class StripePaymentService extends AbstractPaymentService {
  private stripeEventConverter: StripeEventConverter;

  constructor(opts: StripePaymentServiceOptions) {
    super(opts.ctCartService, opts.ctPaymentService, opts.ctOrderService);
    this.stripeEventConverter = new StripeEventConverter();
  }

  /**
   * Get configurations
   *
   * @remarks
   * Implementation to provide mocking configuration information
   *
   * @returns Promise with mocking object containing configuration information
   */
  public async config(): Promise<ConfigResponse> {
    const config = getConfig();
    return {
      environment: config.mockEnvironment,
      publishableKey: config.stripePublishableKey,
    };
  }

  /**
   * Get status
   *
   * @remarks
   * Implementation to provide mocking status of external systems
   *
   * @returns Promise with mocking data containing a list of status from different external systems
   */
  public async status(): Promise<StatusResponse> {
    const handler = await statusHandler({
      timeout: getConfig().healthCheckTimeout,
      log: appLogger,
      checks: [
        healthCheckCommercetoolsPermissions({
          requiredPermissions: [
            'manage_payments',
            'view_sessions',
            'view_api_clients',
            'manage_orders',
            'introspect_oauth_tokens',
            'manage_checkout_payment_intents',
            'manage_types',
          ],
          ctAuthorizationService: paymentSDK.ctAuthorizationService,
          projectKey: getConfig().projectKey,
        }),
        async () => {
          try {
            const paymentMethods = await stripeApi().paymentMethods.list({
              limit: 3,
            });
            return {
              name: 'Stripe Status check',
              status: 'UP',
              message: 'Stripe api is working',
              details: {
                paymentMethods,
              },
            };
          } catch (e) {
            return {
              name: 'Stripe Status check',
              status: 'DOWN',
              message: 'The mock paymentAPI is down for some reason. Please check the logs for more details.',
              details: {
                error: e,
              },
            };
          }
        },
      ],
      metadataFn: async () => ({
        name: packageJSON.name,
        description: packageJSON.description,
        '@commercetools/connect-payments-sdk': packageJSON.dependencies['@commercetools/connect-payments-sdk'],
        stripe: packageJSON.dependencies['stripe'],
      }),
    })();

    return handler.body;
  }

  /**
   * Get supported payment components
   *
   * @remarks
   * Implementation to provide the mocking payment components supported by the processor.
   *
   * @returns Promise with mocking data containing a list of supported payment components
   */
  public async getSupportedPaymentComponents(): Promise<SupportedPaymentComponentsSchemaDTO> {
    return {
      dropins: [
        {
          type: 'embedded',
        },
      ],
      components: [],
    };
  }

  /**
   * Capture payment in Stripe.
   *
   * @remarks
   * MVP: capture the total amount
   *
   * @param {CapturePaymentRequest} request - Information about the ct payment and the amount.
   * @returns Promise with mocking data containing operation status and PSP reference
   */
  public async capturePayment(request: CapturePaymentRequest): Promise<PaymentProviderModificationResponse> {
    return { outcome: PaymentModificationStatus.APPROVED, pspReference: request.payment.interfaceId as string };
  }

  /**
   * Cancel payment in Stripe.
   *
   * @param {CancelPaymentRequest} request - contains amount and {@link https://docs.commercetools.com/api/projects/payments | Payment } defined in composable commerce
   * @returns Promise with mocking data containing operation status and PSP reference
   */
  public async cancelPayment(request: CancelPaymentRequest): Promise<PaymentProviderModificationResponse> {
    return { outcome: PaymentModificationStatus.APPROVED, pspReference: request.payment.interfaceId as string };
  }

  /**
   * Refund payment in Stripe.
   *
   * @param {RefundPaymentRequest} request - contains amount and {@link https://docs.commercetools.com/api/projects/payments | Payment } defined in composable commerce
   * @returns Promise with mocking data containing operation status and PSP reference
   */
  public async refundPayment(request: RefundPaymentRequest): Promise<PaymentProviderModificationResponse> {
    return { outcome: PaymentModificationStatus.RECEIVED, pspReference: request.payment.interfaceId as string };
  }

  /**
   * Creates a payment intent using the Stripe API and create commercetools payment with Initial transaction.
   *
   * @return Promise<PaymentResponseSchemaDTO> A Promise that resolves to a PaymentResponseSchemaDTO object containing the client secret and payment reference.
   */
  public async createPaymentIntentStripe(): Promise<PaymentResponseSchemaDTO> {
    const ctCart = await this.ctCartService.getCart({
      id: getCartIdFromContext(),
    });

    const amountPlanned = await this.ctCartService.getPaymentAmount({ cart: ctCart });
    const customer = await this.getCtCustomer(ctCart.customerId || ctCart.anonymousId || '');
    const shippingAddress = this.getStripeAddress(ctCart, customer);
    const billingAddress = this.getStripeBillingAddress(ctCart, customer);
    const stripeCustomerId = await this.getStripeCustomerId(ctCart, customer);
    const captureMethodConfig = getConfig().stripeCaptureMethod;
    const merchantReturnUrl = getMerchantReturnUrlFromContext() || getConfig().merchantReturnUrl;
    let paymentIntent!: Stripe.PaymentIntent;

    try {
      const idempotencyKey = crypto.randomUUID();
      // MVP Add customer address to the payment Intent creation
      paymentIntent = await stripeApi().paymentIntents.create(
        {
          amount: amountPlanned.centAmount,
          customer: stripeCustomerId,
          currency: amountPlanned.currencyCode,
          automatic_payment_methods: {
            enabled: true,
          },
          capture_method: captureMethodConfig as CaptureMethod,
          metadata: {
            cart_id: ctCart.id,
            ct_project_key: getConfig().projectKey,
            billing: JSON.stringify(billingAddress),
          },
          shipping: shippingAddress,
        },
        {
          idempotencyKey,
        },
      );
    } catch (e) {
      throw wrapStripeError(e);
    }

    log.info(`Stripe PaymentIntent created.`, {
      ctCartId: ctCart.id,
      stripePaymentIntentId: paymentIntent.id,
    });

    log.info(`Stripe PaymentIntent Object.`, {
      paymentIntent: JSON.stringify(paymentIntent),
    });

    const ctPayment = await this.ctPaymentService.createPayment({
      amountPlanned,
      paymentMethodInfo: {
        paymentInterface: getPaymentInterfaceFromContext() || 'stripe',
        method: 'payment',
      },
      ...(ctCart.customerId && {
        customer: {
          typeId: 'customer',
          id: ctCart.customerId,
        },
      }),
      ...(!ctCart.customerId &&
        ctCart.anonymousId && {
          anonymousId: ctCart.anonymousId,
        }),
      transactions: [
        {
          type: PaymentTransactions.AUTHORIZATION,
          amount: amountPlanned,
          state: this.convertPaymentResultCode(PaymentOutcome.INITIAL as PaymentOutcome),
          interactionId: paymentIntent.id,
        },
      ],
    });

    await this.ctCartService.addPayment({
      resource: {
        id: ctCart.id,
        version: ctCart.version,
      },
      paymentId: ctPayment.id,
    });

    log.info(`commercetools Payment and initial transaction created.`, {
      ctCartId: ctCart.id,
      ctPayment: ctPayment.id,
      stripePaymentIntentId: paymentIntent.id,
      merchantReturnUrl: merchantReturnUrl,
    });

    try {
      const idempotencyKey = crypto.randomUUID();
      await stripeApi().paymentIntents.update(
        paymentIntent.id,
        {
          metadata: {
            ct_payment_id: ctPayment.id,
          },
        },
        { idempotencyKey },
      );
    } catch (e) {
      throw wrapStripeError(e);
    }

    log.info(`Stripe update Payment id metadata.`);

    return {
      sClientSecret: paymentIntent.client_secret ?? '',
      paymentReference: ctPayment.id,
      merchantReturnUrl: merchantReturnUrl,
      cartId: ctCart.id,
    };
  }

  /**
   * Update the PaymentIntent in Stripe to mark the Authorization in commercetools as successful.
   *
   * @param {string} paymentIntentId - The Intent id created in Stripe.
   * @param {string} paymentReference - The identifier of the payment associated with the PaymentIntent in Stripe.
   * @return {Promise<void>} - A Promise that resolves when the PaymentIntent is successfully updated.
   */
  public async updatePaymentIntentStripeSuccessful(paymentIntentId: string, paymentReference: string): Promise<void> {
    const ctCart = await this.ctCartService.getCart({
      id: getCartIdFromContext(),
    });

    const ctPayment = await this.ctPaymentService.getPayment({
      id: paymentReference,
    });
    const amountPlanned = await this.ctCartService.getPaymentAmount({ cart: ctCart });

    log.info(`PaymentIntent confirmed.`, {
      ctCartId: ctCart.id,
      stripePaymentIntentId: ctPayment.interfaceId,
      amountPlanned: JSON.stringify(amountPlanned),
    });

    await this.ctPaymentService.updatePayment({
      id: ctPayment.id,
      transaction: {
        interactionId: paymentIntentId,
        type: PaymentTransactions.AUTHORIZATION,
        amount: amountPlanned,
        state: this.convertPaymentResultCode(PaymentOutcome.AUTHORIZED as PaymentOutcome),
      },
    });
  }

  /**
   * Return the Stripe payment configuration and the cart amount planed information.
   *
   * @return {Promise<ConfigElementResponseSchemaDTO>} Returns a promise that resolves with the cart information, appearance, and capture method.
   */
  public async initializeCartPayment(paymentType: string): Promise<ConfigElementResponseSchemaDTO> {
    const ctCart = await this.ctCartService.getCart({
      id: getCartIdFromContext(),
    });

    const amountPlanned = await this.ctCartService.getPaymentAmount({ cart: ctCart });

    const webElement = paymentType; //getConfig().stripeWebElements;
    const appearance =
      webElement === 'paymentElement'
        ? getConfig().stripePaymentElementAppearance
        : getConfig().stripeExpressCheckoutAppearance;

    log.info(`Cart and ${webElement} config retrieved.`, {
      cartId: ctCart.id,
      cartInfo: {
        amount: amountPlanned.centAmount,
        currency: amountPlanned.currencyCode,
      },
      stripeElementAppearance: appearance,
      stripeCaptureMethod: getConfig().stripeCaptureMethod,
      webElements: webElement,
    });

    return {
      cartInfo: {
        amount: amountPlanned.centAmount,
        currency: amountPlanned.currencyCode,
      },
      appearance: appearance,
      captureMethod: getConfig().stripeCaptureMethod,
      webElements: webElement,
    };
  }

  /**
   * Return the Stripe payment configuration and the cart amount planed information.
   *
   * @return {Promise<ConfigElementResponseSchemaDTO>} Returns a promise that resolves with the cart information, appearance, and capture method.
   */
  public applePayConfig(): string {
    return getConfig().stripeApplePayWellKnown;
  }

  private convertPaymentResultCode(resultCode: PaymentOutcome): string {
    switch (resultCode) {
      case PaymentOutcome.AUTHORIZED:
        return 'Success';
      case PaymentOutcome.REJECTED:
        return 'Failure';
      default:
        return 'Initial';
    }
  }

  /**
   * Retrieves modified payment data based on the given Stripe event.
   *
   * @param {Stripe.Event} event - The Stripe event object to extract data from.
   * @return {ModifyPayment} - An object containing modified payment data.
   */
  public async processStripeEvent(event: Stripe.Event): Promise<void> {
    log.info('Processing notification', { event: JSON.stringify(event.id) });
    try {
      const updateData = this.stripeEventConverter.convert(event);

      for (const tx of updateData.transactions) {
        const updatedPayment = await this.ctPaymentService.updatePayment({
          id: updateData.id,
          pspReference: updateData.pspReference,
          transaction: tx,
        });

        log.info('Payment updated after processing the notification', {
          paymentId: updatedPayment.id,
          version: updatedPayment.version,
          pspReference: updateData.pspReference,
          paymentMethod: updateData.paymentMethod,
          transaction: JSON.stringify(tx),
        });
      }

      if (event.type === StripeEvent.PAYMENT_INTENT__SUCCEEDED) {
        const ctCart = await this.ctCartService.getCartByPaymentId({ paymentId: updateData.id });
        const updatedCart = await this.updateCartAddress(event, ctCart);
        await this.createOrder(updatedCart, updateData.pspReference);
      }
    } catch (e) {
      log.error('Error processing notification', { error: e });
      return;
    }
  }

  public async createOrder(cart: Cart, paymentIntent: string | undefined) {
    const apiClient = paymentSDK.ctAPI.client;
    const order = await apiClient
      .orders()
      .post({
        body: {
          cart: {
            id: cart.id,
            typeId: 'cart',
          },
          shipmentState: 'Pending',
          orderState: 'Open',
          version: cart.version,
          paymentState: 'Paid',
        },
      })
      .execute();

    const idempotencyKey = crypto.randomUUID();

    if (paymentIntent)
      await stripeApi().paymentIntents.update(
        paymentIntent,
        {
          metadata: {
            ct_order_id: order.body.id,
          },
        },
        { idempotencyKey },
      );
  }

  public async updateCartAddress(event: Stripe.Event, ctCart: Cart): Promise<Cart> {
    const apiClient = paymentSDK.ctAPI.client;
    const { latest_charge } = event.data.object as Stripe.PaymentIntent;
    const charge = await stripeApi().charges.retrieve(latest_charge as string);
    const { billing_details, shipping } = charge;
    let billingAlias: Stripe.Charge.BillingDetails | Stripe.Charge.Shipping;
    if (!shipping) {
      billingAlias = billing_details;
    } else {
      billingAlias = shipping;
    }

    const cart = await apiClient
      .carts()
      .withId({ ID: ctCart.id })
      .post({
        body: {
          version: ctCart.version,
          actions: [
            {
              action: 'setShippingAddress',
              address: {
                key: billingAlias.name || 'mockName',
                country: billingAlias.address?.country || 'US',
                city: billingAlias.address?.city || 'mockCity',
                postalCode: billingAlias.address?.postal_code || 'mockPostalCode',
                state: billingAlias.address?.state || 'mockState',
                streetName: billingAlias.address?.line1 || 'mockStreenName',
              },
            },
          ],
        },
      })
      .execute();
    return cart.body;
  }

  public async getCtCustomer(ctCustomerId: string): Promise<Customer> {
    const response = await paymentSDK.ctAPI.client.customers().withId({ ID: ctCustomerId }).get().execute();
    if (!response.body) {
      log.error('Customer not found', { ctCustomerId });
      throw `Customer with ID ${ctCustomerId} not found`;
    }
    return response.body;
  }

  public getStripeAddress(cart: Cart, customer: Customer) {
    const shipping = cart.shippingAddress || customer.addresses[0];

    if (!shipping) {
      return undefined;
    }

    return {
      name: `${shipping?.firstName} ${shipping?.lastName}`.trim(),
      phone: shipping?.phone || shipping?.mobile,
      address: {
        line1: `${shipping?.streetNumber} ${shipping?.streetName}`.trim(),
        line2: shipping?.additionalStreetInfo,
        city: shipping?.city,
        postal_code: shipping?.postalCode,
        state: shipping?.state,
        country: shipping?.country,
      },
    };
  }
  public getStripeBillingAddress(cart: Cart, customer: Customer) {
    const billing = cart.billingAddress || customer.addresses[0];

    if (!billing) {
      return undefined;
    }

    return {
      name: `${billing?.firstName} ${billing?.lastName}`.trim(),
      phone: billing?.phone || billing?.mobile,
      address: {
        line1: `${billing?.streetNumber} ${billing?.streetName}`.trim(),
        line2: billing?.additionalStreetInfo,
        city: billing?.city,
        postal_code: billing?.postalCode,
        state: billing?.state,
        country: billing?.country,
      },
    };
  }
  public async getStripeCustomerId(cart: Cart, customer: Customer): Promise<string | undefined> {
    const savedCustomerId = customer?.custom?.fields?.paymentConnectorStripeCustomerId;
    if (savedCustomerId) {
      const isValid = await this.validateStripeCustomerId(savedCustomerId, customer.id);
      if (isValid) {
        return savedCustomerId;
      }
    }

    const email = cart.customerEmail || cart.shippingAddress?.email || customer.email;

    const existingCustomer = await this.findStripeCustomer(email, customer.id);
    if (existingCustomer?.id) {
      return existingCustomer.id;
    }

    const newCustomer = await this.createStripeCustomer(cart, email, customer);
    if (newCustomer?.id) {
      return newCustomer.id;
    } else {
      throw 'Failed to create stripe customer.';
    }
  }

  public async validateStripeCustomerId(stripeCustomerId: string, ctCustomerId: string): Promise<boolean> {
    try {
      const customer = await stripeApi().customers.retrieve(stripeCustomerId);
      return Boolean(customer && !customer.deleted && customer.metadata?.ct_customer_id === ctCustomerId);
    } catch (e) {
      log.warn('Error validating Stripe customer ID', { error: e });
      return false;
    }
  }

  public async findStripeCustomer(email: string, ctCustomerId: string): Promise<Stripe.Customer | undefined> {
    const query = `email:'${email}' AND metadata['ct_customer_id']:'${ctCustomerId}'`;
    const customer = await stripeApi().customers.search({ query });
    return customer.data[0];
  }

  public async createStripeCustomer(
    cart: Cart,
    email: string,
    customer: Customer,
  ): Promise<Stripe.Customer | undefined> {
    const shippingAddress = this.getStripeAddress(cart, customer);
    const newCustomer = await stripeApi().customers.create({
      email,
      name: shippingAddress?.name,
      phone: shippingAddress?.phone,
      metadata: {
        ...(cart.customerId ? { ct_customer_id: cart.customerId } : null),
      },
      ...(shippingAddress?.address ? { address: shippingAddress.address } : null),
    });

    return newCustomer;
  }
}
