import { Command } from '@oclif/core';
import * as cmdOpts from '../../cmd-opts';
import { verifyDB } from '../../core';
import { createLogger } from '../../utils';

export class Verify extends Command {
    static description = 'Just read and parse DB file';

    static flags = {
        ...cmdOpts.DBFlag,
    }

    async run() {
        const { flags } = await this.parse(Verify)

        const logger = createLogger()
        verifyDB(logger, {dbFile: flags.db})
    }
}
