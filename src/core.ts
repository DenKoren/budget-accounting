import winston from 'winston'
import { Currency, formatTransactionRecord, TransactionRecord } from './model';
import { DB } from './db';
import { askDate, askMoney, askAccounts, askCategory, askComment } from './interface';

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
    logger.info(`Opening DB file ${dbFileName(options?.dbFile)}`)
    const dbFile = dbFileName(options?.dbFile)
    const db = new DB(dbFile)

    const knownCategories = db.categories
    const knownCurrencies = db.currencies
    const knownAccounts = db.accounts
    const knownComments = db.comments
    let lastTransaction = db.lastTransaction

    if (lastTransaction) {
        logger.info("Last DB record is:\n\t" + formatTransactionRecord(lastTransaction))
    }

    while (true) {
        const lastCurrency = lastTransaction?.commissions.currency

        const date = await askDate(lastTransaction?.date);
        const opFrom = await askMoney("'src'", true, knownCurrencies, lastCurrency);
        const opTo = await askMoney("'dst'", opFrom !== undefined, knownCurrencies, opFrom?.currency ?? lastCurrency);
        const commissions = await askMoney('comission', true, knownCurrencies, opFrom?.currency ?? opTo!.currency);
        const accounts = await askAccounts(knownAccounts);
        const category = await askCategory(knownCategories);
        const comment = await askComment(knownComments);

        accounts.forEach(account => knownAccounts.add(account))
        knownComments.add(comment)
        knownCategories.add(category)

        const record: TransactionRecord = {
            date: date,
            operation: { from: opFrom, to: opTo },
            commissions: commissions ?? {
                currency: opFrom?.currency ?? opTo?.currency!,
                value: 0
            },
            accounts: accounts,
            category: category,
            comment: comment
        };

        db.addRecord(record)
        logger.info(`Transaction was added: ${formatTransactionRecord(record)}`);

        lastTransaction = record
    }
}
