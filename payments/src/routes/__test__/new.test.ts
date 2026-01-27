import request from "supertest";
import { app } from "../../app";
import { mongo } from "mongoose";
import { Order } from "../../models/order";
import { OrderStatus } from "@tjticketing/common";
import { stripe } from "../../stripe";
import { Payment } from "../../models/payment";

jest.mock('../../stripe');

it('returns a 404 when purchasing an order that does not exist', async () => {
    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin())
        .send({
            token: 'asldkfj',
            orderId: new mongo.ObjectId().toHexString(),
        })
        .expect(404);
});

it("returns 401 when purchasing an order that doesn't belong to the user", async () => {
    const order = Order.build({
        id: new mongo.ObjectId().toHexString(),
        userId: new mongo.ObjectId().toHexString(),
        version: 0,
        price: 20,
        status: OrderStatus.Created
    });

    await order.save();

    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin())
        .send({
            token: 'asldkfj',
            orderId: order._id,
        })
        .expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
    const userId = new mongo.ObjectId().toHexString();

    const order = Order.build({
        id: new mongo.ObjectId().toHexString(),
        userId,
        version: 0,
        price: 20,
        status: OrderStatus.Cancelled
    });

    await order.save();

    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin(userId))
        .send({
            orderId: order._id,
            token: 'asdlkfj',
        })
        .expect(400);
});

it("returns a 201 with valid inputs", async () => {
    const userId = new mongo.ObjectId().toHexString();
    const price = Math.floor(Math.random() * 100000);

    const order = Order.build({
        id: new mongo.ObjectId().toHexString(),
        userId,
        version: 0,
        price,
        status: OrderStatus.Created,
    });

    await order.save();

    await request(app)
        .post('/api/payments')
        .set('Cookie', global.signin(userId))
        .send({
            token: 'tok_visa',
            orderId: order._id,
        })
        .expect(201);

    // const stripeCharges = await stripe.charges.list({ limit: 50 });
    // const stripeCharge = stripeCharges.data.find(charge => {
    //     return charge.amount === price * 100;
    // });

    // expect(stripeCharge).toBeDefined();
    const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
    expect(chargeOptions.source).toEqual('tok_visa');
    expect(chargeOptions.amount).toEqual(order.price * 100);
    expect(chargeOptions.currency).toEqual('usd');

    const payment = await Payment.findOne({
        orderId: order._id,
        stripeId: 'ch_123...',
    });

    expect(payment).not.toBeNull();
});