import Stripe from 'stripe';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {

    const sig = req.headers['stripe-signature'];

    let event;

    // Verify Stripe webhook signature
    try {

        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (error) {

        console.log('Webhook signature verification failed:', error.message);

        return res.status(400).send(error.message);
    }

    // Handle Stripe events
    try {

        switch (event.type) {

            case 'payment_intent.succeeded': {

                const paymentIntent = event.data.object;

                // Get checkout session
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                });

                const session = sessionList.data[0];

                if (!session) {
                    return res.json({
                        received: true,
                        message: 'Session not found'
                    });
                }

                const { transactionId, appId } = session.metadata;

                // Verify app
                if (appId !== 'quickgpt') {

                    return res.json({
                        received: true,
                        message: 'Ignored event: Invalid app'
                    });
                }

                // Find transaction
                const transaction = await Transaction.findOne({
                    _id: transactionId,
                    isPaid: false
                });

                if (!transaction) {

                    return res.json({
                        received: true,
                        message: 'Transaction not found or already paid'
                    });
                }

                // Add credits to user
                await User.updateOne(
                    { _id: transaction.userId },
                    {
                        $inc: {
                            credits: transaction.credits
                        }
                    }
                );

                // Mark transaction as paid
                transaction.isPaid = true;

                await transaction.save();

                console.log('Payment successful and credits added');

                break;
            }

            default:

                console.log(`Unhandled event type: ${event.type}`);

                break;
        }

        res.json({ received: true });

    } catch (error) {

        console.log('Webhook processing error:', error);

        res.status(500).send('Internal Server Error');
    }
};

