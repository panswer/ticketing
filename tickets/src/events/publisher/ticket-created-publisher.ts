import { Publisher, Subjects, TicketCreatedEvent } from '@tjticketing/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    readonly subject = Subjects.TicketCreated;
}
