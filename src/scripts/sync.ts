import {
    iterateConsumersFromDb,
    bulkUpsertConsumersAnonymisedToDb,
    changeConsumersStream,
    initMongoClient,
    getConsumersRecoveryToken,
} from '@app/modules/db'
import { ARGS } from '@app/consts'
import Consumer from '@app/dto/consumer'

const SYNC_CONSUMERS_INTERVAL_MS = 1000
const MAX_BUFFER_SIZE = 1000
const mongoClient = initMongoClient()
const isFullReindex = process.argv.at(2) === ARGS.FULL_REINDEX

if (isFullReindex) {
    mongoClient.connect().then((client) =>
        iterateConsumersFromDb(
            client,
            bulkUpsertConsumersAnonymisedToDb,
            MAX_BUFFER_SIZE
        )
            .catch(console.error)
            .finally(() => mongoClient.close())
    )
} else {
    mongoClient.connect().then(async (client) => {
        let buffer: Consumer[] = []

        const recoveryToken = await getConsumersRecoveryToken(client)
        const changeStreamOptions = recoveryToken
            ? { resumeAfter: recoveryToken.cursor }
            : {}

        const consumersAnonymisedFn = () => {
            console.debug(`Upsert consumers anonymised ${buffer.length}`)
            bulkUpsertConsumersAnonymisedToDb(client, buffer).catch(
                console.error
            )
            console.debug(`Clean buffer`)
            buffer = []
        }

        const syncByTimer = () =>
            new Promise(() =>
                setInterval(consumersAnonymisedFn, SYNC_CONSUMERS_INTERVAL_MS)
            )

        syncByTimer().catch(console.error)

        changeConsumersStream(
            client,
            (change) => {
                if (buffer.length === MAX_BUFFER_SIZE) consumersAnonymisedFn()
                buffer.push(change.fullDocument)
            },
            changeStreamOptions
        )
            .catch(console.error)
            .finally(() => mongoClient.close())
    })
}
