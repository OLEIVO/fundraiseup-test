import { genRandomIntFn } from '@app/utils'
import { genRandomConsumerFn } from '@app/heplers'
import { bulkInsertConsumersToDb, initMongoClient } from '@app/modules/db'

const GEN_CONSUMERS_INTERVAL_MS = 200

function app(): void {
    setInterval(() => {
        const consumers = Array.from(
            { length: genRandomIntFn(1, 10) },
            genRandomConsumerFn
        )
        const mongoClient = initMongoClient()

        mongoClient.connect().then((client) =>
            bulkInsertConsumersToDb(client, consumers)
                .catch(console.error)
                .finally(() => mongoClient.close())
        )
    }, GEN_CONSUMERS_INTERVAL_MS)
}

void app()
