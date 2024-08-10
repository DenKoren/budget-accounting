import { Command } from '@oclif/core';
import * as cmdOpts from '../../cmd-opts';
import { dumpDB } from '../../core';
import { createLogger } from '../../utils';

export class Dump extends Command {
    static description = 'Add a new transaction to the SCSV file';

    static flags = {
        ...cmdOpts.DBFlag,
    }

    async run() {
        const { flags } = await this.parse(Dump)

        const logger = createLogger()
        console.log(dumpDB(logger, {dbFile: flags.db}).join("\n"))
    }
}
