import { Command } from '@oclif/core';
import * as cmdOpts from '../../cmd-opts';
import { reportDB } from '../../core';
import { createLogger } from '../../utils';

export class Report extends Command {
    static description = 'Read all transactions from DB and print per-account statistics';

    static flags = {
        ...cmdOpts.DBFlag,
    }

    async run() {
        const { flags } = await this.parse(Report)

        const logger = createLogger()
        console.log(reportDB(logger, {dbFile: flags.db}).join("\n"))
    }
}
