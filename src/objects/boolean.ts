import { ToBoolean } from '../abstractOperations'

export function BooleanConstructor(NewTarget, value: any) {
    const b = ToBoolean(value)

    if (!NewTarget) {
        return b
    }

    const O = OrdinaryCreateFromConstructor(NewTarget, '%Boolean.prototype%', BooleanData)
    O.__BooleanData__ = b
    return O
}

BooleanConstructor.$type = '%Boolean%'
