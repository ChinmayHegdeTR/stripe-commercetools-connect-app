import { BaseOptions } from '../components/base';
import { Card } from '../components/payment-methods/card/card';
import { FakeSdk } from '../fake-sdk';
import { ComponentOptions, EnablerOptions, PaymentEnabler } from './payment-enabler';
import {Invoice} from "../components/payment-methods/invoice/invoice.ts";

declare global {
  interface ImportMeta {
    env: any;
  }
}

export class MockPaymentEnabler implements PaymentEnabler {
  setupData: Promise<{ baseOptions: BaseOptions }>;

  constructor(options: EnablerOptions) {
    this.setupData = MockPaymentEnabler._Setup(options);
  }

  private static _Setup = async (options: EnablerOptions): Promise<{ baseOptions: BaseOptions }> => {
    // Fetch SDK config from processor if needed, for example:

    // const configResponse = await fetch(instance.processorUrl + '/config', {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json', 'X-Session-Id': options.sessionId },
    // });

    // const configJson = await configResponse.json();

    const sdkOptions = {
      // environment: configJson.environment,
      environment: 'test'
    }

    return Promise.resolve({ baseOptions: {
      sdk: new FakeSdk(sdkOptions),
      processorUrl: options.processorUrl,
      sessionId: options.sessionId,
      environment: sdkOptions.environment,
      config: options.config || {},
      onComplete: options.onComplete || (() => {}),
      onError: options.onError || (() => {}),
     }
    });
  }

  async createComponent(type: string, componentOptions: ComponentOptions) {
    const { baseOptions } = await this.setupData;
    const supportedMethods = {
      card: Card,
      invoice: Invoice,
    }
    if (!Object.keys(supportedMethods).includes(type)) {
      throw new Error(`Component type not supported: ${type}. Supported types: ${Object.keys(supportedMethods).join(', ')}`);
    }
    return new supportedMethods[type](baseOptions, componentOptions);
  }

}
