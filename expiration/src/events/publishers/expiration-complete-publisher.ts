import { Subjects, Publisher, ExpirationCompleteEvent } from "@tjticketing/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
    readonly subject = Subjects.ExpirationComplete;
}