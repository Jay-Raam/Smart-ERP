import { describe, expect, it, afterEach } from 'vitest';
import { GstIntegrationService } from './gstIntegrationService';

const originalEnvironment = {
  provider: process.env.GST_EINVOICE_PROVIDER,
  nodeEnv: process.env.NODE_ENV,
  url: process.env.GST_EINVOICE_PROVIDER_URL,
  apiKey: process.env.GST_EINVOICE_PROVIDER_API_KEY,
};

afterEach(() => {
  process.env.GST_EINVOICE_PROVIDER = originalEnvironment.provider;
  process.env.NODE_ENV = originalEnvironment.nodeEnv;
  process.env.GST_EINVOICE_PROVIDER_URL = originalEnvironment.url;
  process.env.GST_EINVOICE_PROVIDER_API_KEY = originalEnvironment.apiKey;
});

describe('GST e-invoice provider configuration', () => {
  it('uses the simulator outside production by default', () => {
    delete process.env.GST_EINVOICE_PROVIDER;
    process.env.NODE_ENV = 'test';

    expect(GstIntegrationService.getProvider()).toBeDefined();
  });

  it('rejects simulated statutory output in production', () => {
    process.env.GST_EINVOICE_PROVIDER = 'simulation';
    process.env.NODE_ENV = 'production';

    expect(() => GstIntegrationService.getProvider()).toThrow(/disabled in production/);
  });

  it('requires endpoint and credentials for a live provider', () => {
    process.env.GST_EINVOICE_PROVIDER = 'http';
    process.env.GST_EINVOICE_PROVIDER_URL = '';
    process.env.GST_EINVOICE_PROVIDER_API_KEY = '';

    expect(() => GstIntegrationService.getProvider()).toThrow(/URL and API key/);
  });
});
