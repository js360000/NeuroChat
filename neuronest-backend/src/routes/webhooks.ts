import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { db, findUserById } from '../db/index.js';

const router = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Map Stripe customer IDs to user IDs for webhook processing
const stripeCustomerToUser: Map<string, string> = new Map();

export function linkStripeCustomer(userId: string, customerId: string) {
  stripeCustomerToUser.set(customerId, userId);
}

// POST / - Stripe webhook handler (mounted at /api/webhooks/stripe)
// Note: This endpoint must receive raw body, not parsed JSON
router.post('/', async (req: Request, res: Response) => {
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: 'Stripe webhooks are not configured.' });
  }
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session');
    return;
  }

  if (session.customer) {
    stripeCustomerToUser.set(session.customer as string, userId);
  }

  const user = findUserById(userId);
  if (user) {
    user.subscription = {
      plan: plan as 'premium' | 'pro',
      status: 'active'
    };
    console.log(`User ${userId} subscribed to ${plan}`);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId || 
    stripeCustomerToUser.get(subscription.customer as string);

  if (!userId) {
    console.error('Cannot find user for subscription:', subscription.id);
    return;
  }

  const user = findUserById(userId);
  if (!user) return;

  const plan = subscription.metadata?.plan || user.subscription.plan;

  if (subscription.status === 'active') {
    user.subscription = {
      plan: plan as 'premium' | 'pro',
      status: 'active',
      expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
    };
  } else if (subscription.status === 'past_due') {
    user.subscription.status = 'past_due';
  } else if (subscription.cancel_at_period_end) {
    user.subscription.status = 'cancelled';
    user.subscription.expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
  }

  console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId || 
    stripeCustomerToUser.get(subscription.customer as string);

  if (!userId) return;

  const user = findUserById(userId);
  if (user) {
    user.subscription = {
      plan: 'free',
      status: 'active'
    };
    console.log(`User ${userId} subscription ended, reverted to free`);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const userId = stripeCustomerToUser.get(customerId);

  if (userId) {
    console.log(`Invoice paid for user ${userId}: ${invoice.amount_paid / 100} ${invoice.currency}`);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const userId = stripeCustomerToUser.get(customerId);

  if (!userId) return;

  const user = findUserById(userId);
  if (user) {
    user.subscription.status = 'past_due';
    console.log(`Payment failed for user ${userId}`);
  }
}

export default router;
