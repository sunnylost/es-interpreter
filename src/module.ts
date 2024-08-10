import type { RealmRecord } from './realm'
import type { ModuleEnvironmentRecord } from './env'
import type { ECMAScriptObject } from './objects/object'
import type { empty } from './types'

export class ModuleRecord {
    __Realm__: RealmRecord = undefined
    __Environment__: ModuleEnvironmentRecord
    __Namespace__: ECMAScriptObject | typeof empty
    __HostDefined__ = undefined
}
