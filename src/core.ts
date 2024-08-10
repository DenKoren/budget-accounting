import winston from 'winston'
import { Currency, formatTransactionRecord, TransactionRecord } from './model';
import { DB } from './db';
import { askDate, askMoney, askCategory, askComment } from './interface';

function dbFileName(name?: string): string {
    const now = new Date();
    return name ?? `./Transactions-${now.getFullYear()}.scsv`
}

export function verifyDB(logger: winston.Logger,
    options?: {
        dbFile?: string
    },
) {
    const dbFile = dbFileName(options?.dbFile)
    const db = new DB(dbFile)
}

export function dumpDB(logger: winston.Logger,
    options?: {
        dbFile?: string
    },
): string[] {
    const dbFile = dbFileName(options?.dbFile)
    const db = new DB(dbFile)

    return db.records.map(formatTransactionRecord)
}

export async function addRecords(
    logger: winston.Logger,
    options?: {
        dbFile?: string
    },
) {
    const dbFile = dbFileName(options?.dbFile)
    const db = new DB(dbFile)

    var categories = db.categories
    var currencies = db.currencies
    var lastTransaction = db.lastTransaction

    var lastDate: Date | undefined
    var lastCurrency: Currency | undefined
    if (lastTransaction) {
        lastDate = lastTransaction.date
        lastCurrency = lastTransaction.commissions.currency
    }

    if (lastTransaction) {
        logger.info("Last DB record is:\n\t" + formatTransactionRecord(lastTransaction))
    }

    while (true) {
        const date = await askDate(lastDate);
        const opFrom = await askMoney("'src'", true, currencies, lastCurrency);
        const opTo = await askMoney("'dst'", opFrom !== undefined, currencies, opFrom?.currency ?? lastCurrency);
        const commissions = await askMoney('comission', true, currencies, opFrom?.currency ?? opTo!.currency);
        const category = await askCategory(categories);
        const comment = await askComment();

        const record: TransactionRecord = {
            date: date,
            operation: { from: opFrom, to: opTo },
            commissions: commissions ?? {
                currency: opFrom?.currency ?? opTo?.currency!,
                value: 0
            },
            category, comment
        };

        db.addRecord(record)
        logger.info(`Transaction was added: ${formatTransactionRecord(record)}`);
    }
}
