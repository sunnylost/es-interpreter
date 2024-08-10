import type { ReferenceRecord } from './types'

export function $is<T = any>(obj: any, type: string): obj is T {
    return obj?.$type === type
}

export function isReferenceRecord(V: any): V is ReferenceRecord {
    return V?.$type === 'ReferenceRecord'
}
