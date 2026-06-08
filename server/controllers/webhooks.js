import Stripe from 'stripe';
import { applyPaidTransactionCredits } from './creditController.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {

    console.info('[Stripe webhook] Endpoint hit');

    const sig = req.headers['stripe-signature'];

    let event;

    try {

        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.info(`[Stripe webhook] Event type: ${event.type}`);

    } catch (error) {

        console.error('Webhook signature verification failed:', error.message);

        return res.status(400).send(error.message);
    }

    try {

        switch (event.type) {

            case 'checkout.session.completed': {

                const session = event.data.object;

                console.info('[Stripe webhook] Session metadata:', session.metadata);

                const { transactionId, appId } = session.metadata || {};

                if (appId !== 'quickgpt') {

                    return res.json({
                        received: true,
                        message: 'Ignored event: Invalid app'
                    });
                }

                const result = await applyPaidTransactionCredits(transactionId);
                console.info('[Stripe webhook] Credit apply result:', result);

                console.info('Payment successful and credits added');

                break;
            }

            case 'payment_intent.succeeded': {

                const paymentIntent = event.data.object;

                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                });

                const session = sessionList.data[0];

                console.info('[Stripe webhook] Session metadata:', session?.metadata);

                if (!session) {
                    return res.json({
                        received: true,
                        message: 'Session not found'
                    });
                }

                const { transactionId, appId } = session.metadata || {};

                if (appId !== 'quickgpt') {

                    return res.json({
                        received: true,
                        message: 'Ignored event: Invalid app'
                    });
                }

                const result = await applyPaidTransactionCredits(transactionId);
                console.info('[Stripe webhook] Credit apply result:', result);

                console.info('Payment successful and credits added');

                break;
            }

            default:

                console.info(`Unhandled event type: ${event.type}`);

                break;
        }

        res.json({ received: true });

    } catch (error) {

        console.error('Webhook processing error:', error);

        res.status(500).send('Internal Server Error');
    }
};

