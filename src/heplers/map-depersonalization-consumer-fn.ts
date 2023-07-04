import Consumer from '@app/dto/consumer'
import { depersonalizationEmailFn, depersonalizationFn } from '@app/utils'

export const mapDepersonalizationConsumerFn = (
    consumer: Consumer
): Consumer => {
    return Object.freeze({
        ...consumer,
        firstName: depersonalizationFn(),
        lastName: depersonalizationFn(),
        email: depersonalizationEmailFn(consumer.email),
        address: {
            ...consumer.address,
            line1: depersonalizationFn(),
            line2: depersonalizationFn(),
            postcode: depersonalizationFn(),
        },
    })
}
