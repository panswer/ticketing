import { mongo } from "mongoose";
import { OrderCancelledEvent } from "@tjticketing/common";
import { Message } from 'node-nats-streaming';
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
    const listener = new OrderCancelledListener(natsWrapper.client);

    const orderId = new mongo.ObjectId().toString();
    const ticket = Ticket.build({
        title: 'concert',
        price: 20,
        userId: new mongo.ObjectId().toString(),
    });
    ticket.set('orderId', orderId);
    await ticket.save();

    const data: OrderCancelledEvent['data'] = {
        id: orderId,
        version: 0,
        ticket: {
            id: ticket._id.toString(),
        },
    };

    // @ts-ignore
    const msg: Message = {
        ack: jest.fn(),

    }

    return { listener, data, ticket, orderId, msg };
};

it('updated the ticket, publishes an event, and acks the message', async () => {
    const { listener, data, ticket, msg } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket._id);

    expect(updatedTicket!.orderId).not.toBeDefined();
    expect(msg.ack).toHaveBeenCalled();
    expect(natsWrapper.client.publish).toHaveBeenCalled();
});