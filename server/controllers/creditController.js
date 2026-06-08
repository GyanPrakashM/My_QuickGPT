import Transaction  from "../models/Transaction.js";
import User from "../models/User.js";
import Stripe from 'stripe'

const plans = [
    {
        _id: "basic",
        name: "Basic",
        price: 10,
        credits: 100,
        features: ['100 text generations', '50 image generations', 'Standard support', 'Access to basic models']
    },
    {
        _id: "pro",
        name: "Pro",
        price: 20,
        credits: 500,
        features: ['500 text generations', '200 image generations', 'Priority support', 'Access to pro models', 'Faster response time']
    },
    {
        _id: "premium",
        name: "Premium",
        price: 30,
        credits: 1000,
        features: ['1000 text generations', '500 image generations', '24/7 VIP support', 'Access to premium models', 'Dedicated account manager']
    }
];

export const getPlans = async(req , res) =>{
    try{
        res.json({success: true, plans})
    }catch(error){
        res.json({success: false, message:error.message})
    }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const applyPaidTransactionCredits = async (transactionId) => {
    if (!transactionId) {
        return { success: false, message: "Missing transaction" };
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
        return { success: false, message: "Transaction not found" };
    }

    if (transaction.isPaid) {
        return { success: true, message: "Transaction already paid" };
    }

    const paidTransaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, isPaid: false },
        { $set: { isPaid: true } },
        { new: true }
    );

    if (!paidTransaction) {
        return { success: true, message: "Transaction already paid" };
    }

    const user = await User.findByIdAndUpdate(
        paidTransaction.userId,
        { $inc: { credits: paidTransaction.credits } },
        { new: true }
    );

    if (!user) {
        paidTransaction.isPaid = false;
        await paidTransaction.save();
        return { success: false, message: "User not found" };
    }

    return { success: true, credits: user.credits };
};

export const purchasePlan = async(req, res) =>{
    try{
        const {planId} = req.body
        const userId = req.user._id
        const plan = plans.find(plan => plan._id === planId)

        if(!plan){
            return res.json({
                success:false,
                message:"invalid plan"
            })
        }
        const transaction = await  Transaction.create({
            userId:userId,
            planId:plan._id,
            amount:plan.price,
            credits:plan.credits,
            isPaid:false
        })

      console.info('[Stripe checkout] Transaction created:', {
        transactionId: transaction._id,
        userId: transaction.userId,
        credits: transaction.credits,
        isPaid: transaction.isPaid
      })

      const origin = req.headers.origin
      const session = await stripe.checkout.sessions.create({       
        line_items:[
            {
                price_data: {
                    currency:"usd",
                    unit_amount: plan.price * 100,
                    product_data:{
                        name:plan.name
                    }
                },
                quantity: 1,
            },
        ],
        mode:'payment',
        success_url : `${origin}/loading?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}`,
        metadata: {transactionId:transaction._id.toString(),appId:'quickgpt'},
       expires_at: Math.floor(Date.now()/1000) + 30*60,
      });      

      console.info('[Stripe checkout] Session created:', {
        sessionId: session.id,
        metadata: session.metadata
      })

      res.json({success: true , url:session.url})
    }catch(error){
        res.json({success:false, message:error.message})
    }
}

export const verifyPurchase = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.json({ success: false, message: "Missing checkout session" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.metadata?.appId !== "quickgpt") {
            return res.json({ success: false, message: "Invalid checkout session" });
        }

        if (session.payment_status !== "paid") {
            return res.json({ success: false, message: "Payment is not completed yet" });
        }

        const result = await applyPaidTransactionCredits(session.metadata.transactionId);

        res.json(result);
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
