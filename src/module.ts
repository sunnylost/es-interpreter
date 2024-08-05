import { RealmRecord } from './realm'
import { ModuleEnvironmentRecord } from './env'
import { ECMAScriptObject } from './objects/object'
import { empty } from './types'

export class ModuleRecord {
    __Realm__: RealmRecord = undefined
    __Environment__: ModuleEnvironmentRecord
    __Namespace__: ECMAScriptObject | typeof empty
    __HostDefined__ = undefined
}
