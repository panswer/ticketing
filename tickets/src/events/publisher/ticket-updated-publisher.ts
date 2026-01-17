import { Publisher, Subjects, TicketUpdatedEvent } from "@tjticketing/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
    readonly subject = Subjects.TicketUpdated;
}
