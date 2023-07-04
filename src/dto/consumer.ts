import Address from '@app/dto/address'
import { ObjectId } from 'mongodb'

export default interface Consumer {
    _id: ObjectId
    firstName: string
    lastName: string
    email: string
    address: Address
    createdAt: string
}
