import { OrderCreatedEvent, OrderStatus } from "@tjticketing/common";
import { Message } from 'node-nats-streaming';
import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from "../../../models/ticket";
import { mongo } from "mongoose";

const setup = async () => {
    // create an instance of the listener
    const listener = new OrderCreatedListener(natsWrapper.client);

    // Create and save a ticket
    const ticket = Ticket.build({
        title: 'concert',
        price: 99,
        userId: new mongo.ObjectId().toString(),
    });

    await ticket.save();

    // Create the fake data event
    // @ts-ignore
    const data: OrderCreatedEvent['data'] = {
        id: new mongo.ObjectId().toString(),
        version: 0,
        status: OrderStatus.Created,
        userId: new mongo.ObjectId().toString(),
        expiresAt: 'asdf',
        ticket: {
            id: ticket._id.toString(),
            price: ticket.price,
        },
    };

    // @ts-ignore
    const msg: Message = {
        ack: jest.fn(),
    };

    return { listener, data, msg, ticket };
};

it('sets the userId of the ticket', async () => {
    const { listener, data, msg, ticket } = await setup();

    await listener.onMessage(data, msg);

    const updatedTicket = await Ticket.findById(ticket._id);

    expect(updatedTicket!.orderId).toEqual(data.id);
});

it('acks the message', async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalled();
});

it("publishes a ticket updated event", async () => {
    const { listener, data, msg } = await setup();

    await listener.onMessage(data, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);
    expect(data.id).toEqual(ticketUpdatedData.orderId);
});