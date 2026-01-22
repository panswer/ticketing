import { Subjects, Publisher, OrderCancelledEvent } from "@tjticketing/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    readonly subject = Subjects.OrderCancelled;
}
