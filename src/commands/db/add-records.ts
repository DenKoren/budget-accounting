import { Command } from '@oclif/core';
import * as cmdOpts from '../../cmd-opts';
import { addRecords } from '../../core';
import { createLogger } from '../../utils';

export class AddRecords extends Command {
    static description = 'Add a new transaction to the SCSV file';

    static flags = {
        ...cmdOpts.DBFlag,
    }

    async run() {
        const { flags } = await this.parse(AddRecords)

        const logger = createLogger()
        addRecords(logger, {dbFile: flags.db})
    }
}
