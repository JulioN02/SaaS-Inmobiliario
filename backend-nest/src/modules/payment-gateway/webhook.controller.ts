import { Controller, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('api/v1/billing/webhooks')
export class WebhookController {
  @Post('stripe')
  @ApiOperation({ summary: 'Webhook de Stripe (stub)' })
  async handleStripeWebhook(@Req() req: any) {
    // Stripe webhook handler — stub for now
    // In production: verify signature, process event
    return { received: true };
  }
}
