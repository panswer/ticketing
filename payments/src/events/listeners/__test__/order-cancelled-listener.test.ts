import { OrderStatus, OrderCancelledEvent } from "@tjticketing/common";
import { mongo } from "mongoose";
import { Message } from 'node-nats-streaming';
import { OrderCancelledListener } from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Order } from "../../../models/order";

const setup = async () => {
    const listener = new OrderCancelledListener(natsWrapper.client);

    const order = Order.build({
        id: new mongo.ObjectId().toString(),
        version: 0,
        userId: new mongo.ObjectId().toString(),
        price: 20,
        status: OrderStatus.Created,
    });

    await order.save();

    const data: OrderCancelledEvent['data'] = {
        id: order.id,
        version: 1,
        ticket: {
            id: new mongo.ObjectId().toString(),
        },
    };

    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, order, data, msg };
}

it("updated the status of the order", async () => {
    const { listener, order, data, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedOrder = await Order.findById(order.id);

    expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it("acks the message", async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});