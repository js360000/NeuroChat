import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware/auth.js';
import { db, findUserById } from '../db/index.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Map user IDs to Stripe customer IDs
const userToStripeCustomer: Map<string, string> = new Map();

// POST /checkout - Create Stripe Checkout session for subscription
router.post('/checkout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { plan, billing } = req.body;

    if (!['premium', 'pro'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!['monthly', 'yearly'].includes(billing)) {
      return res.status(400).json({ error: 'Invalid billing period' });
    }

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    let customerId = userToStripeCustomer.get(userId);
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId }
        });
        customerId = customer.id;
      }
      userToStripeCustomer.set(userId, customerId);
    }

    // Pricing in cents
    const prices: Record<string, Record<string, number>> = {
      premium: { monthly: 1200, yearly: 9600 },
      pro: { monthly: 2400, yearly: 21600 }
    };

    const amount = prices[plan][billing];
    const interval = billing === 'yearly' ? 'year' : 'month';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `NeuroNest ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
            description: `${billing.charAt(0).toUpperCase() + billing.slice(1)} subscription`
          },
          unit_amount: amount,
          recurring: { interval }
        },
        quantity: 1
      }],
      metadata: { userId, plan, billing },
      subscription_data: {
        metadata: { userId, plan }
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /checkout/:sessionId - Verify completed checkout session
router.get('/checkout/:sessionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    });

    if (session.metadata?.userId !== userId) {
      return res.status(403).json({ error: 'Session does not belong to this user' });
    }

    if (session.payment_status === 'paid') {
      const user = findUserById(userId);
      if (user && session.metadata?.plan) {
        const subscription = session.subscription as Stripe.Subscription;
        user.subscription = {
          plan: session.metadata.plan as 'premium' | 'pro',
          status: 'active',
          expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
        };
      }
    }

    res.json({
      status: session.payment_status,
      plan: session.metadata?.plan
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /subscription - Get current subscription status
router.get('/subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = findUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customerId = userToStripeCustomer.get(userId);
    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        user.subscription = {
          plan: (sub.metadata.plan as 'premium' | 'pro') || user.subscription.plan,
          status: 'active',
          expiresAt: new Date(sub.current_period_end * 1000).toISOString()
        };
      }
    }

    res.json({ subscription: user.subscription });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /portal - Create Stripe Customer Portal session
router.post('/portal', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const customerId = userToStripeCustomer.get(userId);

    if (!customerId) {
      return res.status(400).json({ error: 'No billing account found. Subscribe first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/settings`
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /cancel - Cancel subscription
router.post('/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const customerId = userToStripeCustomer.get(userId);

    if (!customerId) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true
    });

    const user = findUserById(userId);
    if (user) {
      user.subscription.status = 'cancelled';
    }

    res.json({ success: true, message: 'Subscription will cancel at period end' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /history - Get payment history from Stripe
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const customerId = userToStripeCustomer.get(userId);

    if (!customerId) {
      return res.json({ payments: [] });
    }

    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 20
    });

    const payments = charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      description: charge.description || 'Subscription payment',
      created: new Date(charge.created * 1000).toISOString()
    }));

    res.json({ payments });
  } catch (error: any) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
