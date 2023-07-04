import Address from '@app/dto/address'
import { faker } from '@faker-js/faker'

export const genRandomAddressFn = (): Address => {
    return Object.freeze({
        line1: faker.location.streetAddress(),
        line2: faker.location.street(),
        postcode: faker.location.zipCode(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
    })
}
