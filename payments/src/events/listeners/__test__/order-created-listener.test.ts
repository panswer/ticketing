import { mongo } from 'mongoose';
import { OrderCreatedEvent, OrderStatus } from "@tjticketing/common";
import { Message } from "node-nats-streaming";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCreatedListener } from "../order-created-listener";
import { Order } from '../../../models/order';

const setup = async () => {
    const listener = new OrderCreatedListener(natsWrapper.client);

    const data: OrderCreatedEvent['data'] = {
        id: new mongo.ObjectId().toString(),
        version: 0,
        status: OrderStatus.Created,
        userId: new mongo.ObjectId().toString(),
        expiresAt: '123',
        ticket: {
            id: new mongo.ObjectId().toString(),
            price: 20,
        },
    };

    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg };
};

it('replicated the order info', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const order = await Order.findById(data.id);

    expect(order!.price).toEqual(data.ticket.price);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});