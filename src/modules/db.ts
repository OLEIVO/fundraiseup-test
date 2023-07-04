import { Collection, Database, signals } from '@app/consts'
import { ChangeStreamOptions, MongoClient, WithId } from 'mongodb'
import { config } from 'dotenv'
import { mapDepersonalizationConsumerFn } from '@app/heplers'
import Consumer from '@app/dto/consumer'
import { StreamRecovery, StreamRecoveryCursor } from '@app/dto'

config()

export const initMongoClient = () => new MongoClient(process.env.DB_URI)

export const bulkInsertConsumersToDb = async (
    client: MongoClient,
    consumers: Consumer[]
): Promise<void> => {
    const response = await client
        .db(Database.MARKETPLACE)
        .collection<Consumer>(Collection.CONSUMERS)
        .insertMany(consumers)
    console.log(`${response.insertedCount} consumers were inserted`)
}

export const iterateConsumersFromDb = async (
    client: MongoClient,
    callback: (client: MongoClient, rows: Consumer[]) => Promise<void>,
    limit = 100
) => {
    if (typeof callback !== 'function') {
        throw new TypeError('Callback should be a "Function"')
    }

    let rows = []
    do {
        const last_id = rows.at(rows.length - 1)?._id
        const condition = last_id ? { _id: { $gt: last_id } } : {}

        rows = await client
            .db(Database.MARKETPLACE)
            .collection<Consumer>(Collection.CONSUMERS)
            .find(condition)
            .limit(limit)
            .toArray()

        await callback(client, rows)
    } while (rows.length >= limit)
}

export const bulkUpsertConsumersAnonymisedToDb = async (
    client: MongoClient,
    consumers: Consumer[]
): Promise<void> => {
    const rows = [...consumers]
    console.debug(`Upsert consumers ${rows.length}`)
    await Promise.all(
        rows.map((row) => {
            return client
                .db(Database.MARKETPLACE)
                .collection<Consumer>(Collection.CONSUMERS_ANONYMISED)
                .updateOne(
                    { _id: row._id },
                    { $set: mapDepersonalizationConsumerFn(row) },
                    { upsert: true }
                )
        })
    )
}

export const getConsumersRecoveryToken = (
    client: MongoClient
): Promise<WithId<StreamRecovery>> => {
    return client
        .db(Database.MARKETPLACE)
        .collection<StreamRecovery>(Collection.STREAMS_RECOVERY)
        .findOne({
            name: 'recoveryConsumersCommands',
        })
}

export const saveConsumersRecoveryToken = async (
    client: MongoClient,
    resumeToken: unknown
): Promise<void> => {
    await client
        .db(Database.MARKETPLACE)
        .collection<StreamRecovery>(Collection.STREAMS_RECOVERY)
        .updateOne(
            {
                name: 'recoveryConsumersCommands',
            },
            {
                $set: {
                    cursor: resumeToken as StreamRecoveryCursor,
                },
            },
            {
                upsert: true,
            }
        )
}

export const changeConsumersStream = async (
    client: MongoClient,
    callback: CallableFunction,
    options?: ChangeStreamOptions
): Promise<void> => {
    if (typeof callback !== 'function') {
        throw new TypeError('Callback should be a "Function"')
    }

    const changeStream = await client
        .db(Database.MARKETPLACE)
        .collection(Collection.CONSUMERS)
        .watch(
            [
                {
                    $match: {
                        $or: [
                            { operationType: 'insert' },
                            { operationType: 'update' },
                        ],
                    },
                },
            ],
            options
        )

    const onSignalHandler = (): void => {
        saveConsumersRecoveryToken(client, changeStream.resumeToken)
            .then(() => {
                console.debug('Saved resume token consumers to database')
                process.exit(0)
            })
            .catch((err) => {
                console.error(err)
                process.exit(1)
            })
    }

    signals.forEach((signal) => process.on(signal, onSignalHandler))

    try {
        for await (const change of changeStream) {
            console.log(`Changed => ${JSON.stringify(change)}`)
            await callback(change)
        }
    } finally {
        await changeStream.close()
    }
}
