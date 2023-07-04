export enum ARGS {
    FULL_REINDEX = '--full-reindex',
}

export enum Collection {
    CONSUMERS = 'consumers',
    CONSUMERS_ANONYMISED = 'consumers_anonymised',
    STREAMS_RECOVERY = 'streams_recovery',
}

export enum Database {
    MARKETPLACE = 'marketplace',
}

export const signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'] as const
