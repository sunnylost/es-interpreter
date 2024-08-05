export function $is<T = any>(obj: any, type: string): obj is T {
    return obj.$type === type
}
