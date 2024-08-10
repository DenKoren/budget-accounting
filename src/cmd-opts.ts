import { Flags } from '@oclif/core'

export const DBFlag = {
    db: Flags.file({
        description: "path to DB with transactions (.scsv)"
    })
}
