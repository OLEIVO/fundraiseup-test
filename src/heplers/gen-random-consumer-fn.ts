import { faker } from '@faker-js/faker'
import Consumer from '@app/dto/consumer'
import { genRandomAddressFn } from './gen-random-address-fn'
import { ObjectId } from 'mongodb'

export const genRandomConsumerFn = (): Consumer => {
    return Object.freeze({
        _id: new ObjectId(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        address: genRandomAddressFn(),
        createdAt: new Date().toISOString(),
    })
}
