import { StreamRecoveryCursor } from './stream-recovery-cursor'

export interface StreamRecovery {
    name: string
    cursor: StreamRecoveryCursor
}
