import Stripe from 'stripe';
import { SessionHeaderAuthenticationHook } from '@commercetools/connect-payments-sdk';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  ConfigElementResponseSchema,
  ConfigElementResponseSchemaDTO,
  PaymentResponseSchema,
  PaymentResponseSchemaDTO,
} from '../dtos/stripe-payment.dto';
import { log } from '../libs/logger';
import { stripeApi } from '../clients/stripe.client';
import { StripePaymentService } from '../services/stripe-payment.service';
import { StripeHeaderAuthHook } from '../libs/fastify/hooks/stripe-header-auth.hook';
import { Type } from '@sinclair/typebox';
import { getConfig } from '../config/config';
import { ModifyPayment } from '../services/types/operation.type';

type PaymentRoutesOptions = {
  paymentService: StripePaymentService;
  sessionHeaderAuthHook: SessionHeaderAuthenticationHook;
};

type StripeRoutesOptions = {
  paymentService: StripePaymentService;
  stripeHeaderAuthHook: StripeHeaderAuthHook;
};

/**
 * MVP if additional information needs to be included in the payment intent, this method should be supplied with the necessary data.
 *
 */
export const paymentRoutes = async (fastify: FastifyInstance, opts: FastifyPluginOptions & PaymentRoutesOptions) => {
  fastify.get<{ Reply: PaymentResponseSchemaDTO }>(
    '/payments',
    {
      preHandler: [opts.sessionHeaderAuthHook.authenticate()],
      schema: {
        response: {
          200: PaymentResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const resp = await opts.paymentService.createPaymentIntentStripe();

      return reply.status(200).send(resp);
    },
  );
};

export const stripeWebhooksRoutes = async (fastify: FastifyInstance, opts: StripeRoutesOptions) => {
  fastify.post<{ Body: string; Reply: any }>(
    '/stripe/webhooks',
    {
      preHandler: [opts.stripeHeaderAuthHook.authenticate()],
      config: { rawBody: true },
    },
    async (request, reply) => {
      const signature = request.headers['stripe-signature'] as string;

      let event: Stripe.Event;

      try {
        event = await stripeApi().webhooks.constructEvent(
          request.rawBody as string,
          signature,
          getConfig().stripeWebhookSigningSecret,
        );
      } catch (err: any) {
        log.error(JSON.stringify(err));
        return reply.status(400).send(`Webhook Error: ${err.message}`);
      }

      switch (event.type) {
        case 'charge.succeeded':
          log.info(`Handle2 ${event.type} event of ${event.data.object.id}`);
          log.info(JSON.stringify(event.data.object, null, 2));
          //opts.paymentService.authorizePaymentInCt(event);
          if (!event.data.object.captured) {
            console.log(`authorizedPayment ${event.data.object.captured}`);
            opts.paymentService.authorizedPayment(event);
          }
          break;
        case 'charge.refunded':
          const modifyData2: ModifyPayment = opts.paymentService.getModifyData(event);
          log.info(`Handle3 ${event.type} event of ${event.data.object.id}`);
          log.info(JSON.stringify(event.data.object, null, 2));
          log.info(`Handle3 ${event.type} event of ${event.data.object.id}`);
          log.info(JSON.stringify(modifyData2, null, 2));
          //opts.paymentService.refundPaymentInCt(event);
          opts.paymentService.modifyPayment(modifyData2);
          break;
        case 'payment_intent.succeeded':
        // log.info(`Handle1 ${event.type} event of ${event.data.object.id}`);
        // log.info(JSON.stringify(event.data.object, null, 2));
        // opts.paymentService.modifyPayment(modifyData);
        // break;
        case 'payment_intent.canceled':
          const modifyData: ModifyPayment = opts.paymentService.getModifyData(event);
          log.info(`Handle1 ${event.type} event of ${event.data.object.id}`);
          log.info(JSON.stringify(event.data.object, null, 2));
          log.info(`Handle1 ${event.type} event of ${event.data.object.id}`);
          log.info(JSON.stringify(modifyData, null, 2));

          opts.paymentService.modifyPayment(modifyData);
          break;
        case 'payment_intent.payment_failed':
          log.info(`Received: ${event.type} event of ${event.data.object.id}`);
          break;
        case 'payment_intent.requires_action':
          log.info(`Received: ${event.type} event of ${event.data.object.id}`);
          break;
        default:
          log.info(`--->>> This Stripe event is not supported: ${event.type}`);
          break;
      }

      return reply.status(200).send();
    },
  );
};

export const configElementRoutes = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions & PaymentRoutesOptions,
) => {
  fastify.get<{ Reply: ConfigElementResponseSchemaDTO; Params: { paymentComponent: string } }>(
    '/config-element/:paymentComponent',
    {
      preHandler: [opts.sessionHeaderAuthHook.authenticate()],
      schema: {
        params: {
          $id: 'paramsSchema',
          type: 'object',
          properties: {
            paymentComponent: Type.String(),
          },
          required: ['paymentComponent'],
        },
        response: {
          200: ConfigElementResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { paymentComponent } = request.params;
      const resp = await opts.paymentService.initializeCartPayment(paymentComponent);

      return reply.status(200).send(resp);
    },
  );
};
