import { GithubWebhooksController } from './github-webhooks.controller';

describe('GithubWebhooksController', () => {
  let controller: GithubWebhooksController;
  let webhooksService: {
    verifySignature: jest.Mock;
    handleEvent: jest.Mock;
  };

  beforeEach(() => {
    webhooksService = {
      verifySignature: jest.fn(),
      handleEvent: jest.fn().mockResolvedValue({
        id: 'event-1',
        status: 'processed',
      }),
    };
    controller = new GithubWebhooksController(webhooksService as never);
  });

  it('does not verify a reconstructed body when rawBody is unavailable', async () => {
    await controller.handle(
      { body: { action: 'ping' } } as never,
      'ping',
      'delivery-1',
      'sha256=signature',
    );

    expect(webhooksService.verifySignature).not.toHaveBeenCalled();
    expect(webhooksService.handleEvent).toHaveBeenCalledWith(
      'ping',
      'delivery-1',
      { action: 'ping' },
      false,
    );
  });

  it('verifies the exact raw body when it is available', async () => {
    const rawBody = Buffer.from('{"action":"ping"}');
    webhooksService.verifySignature.mockReturnValue(true);

    await controller.handle(
      { rawBody, body: { action: 'ping' } } as never,
      'ping',
      'delivery-2',
      'sha256=signature',
    );

    expect(webhooksService.verifySignature).toHaveBeenCalledWith(
      rawBody,
      'sha256=signature',
    );
    expect(webhooksService.handleEvent).toHaveBeenCalledWith(
      'ping',
      'delivery-2',
      { action: 'ping' },
      true,
    );
  });
});
