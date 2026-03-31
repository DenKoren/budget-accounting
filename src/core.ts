import winston from 'winston'
import { Currency, formatTransactionRecord, TransactionRecord, parseAmount } from './model';
import { DB } from './db';
import { askDate, askCurrency, askAmount, askAccounts, askCategory, askComment, CancelPromptError, ExitPromptError } from './interface';

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

interface Slot {
    key: string;
    ask: (results: Record<string, any>) => Promise<any>;
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

        const slots: Slot[] = [
            { key: 'date',         ask: ()  => askDate(lastTransaction?.date) },
            { key: 'srcCurrency',  ask: ()  => askCurrency("'src'", knownCurrencies, lastCurrency) },
            { key: 'srcAmount',    ask: ()  => askAmount("'src'", true) },
            { key: 'dstCurrency',  ask: (r) => askCurrency("'dst'", knownCurrencies, r.srcAmount ? r.srcCurrency : lastCurrency) },
            { key: 'dstAmount',    ask: (r) => askAmount("'dst'", r.srcAmount !== '') },
            { key: 'commCurrency', ask: (r) => askCurrency("commission", knownCurrencies, r.srcAmount ? r.srcCurrency : r.dstCurrency) },
            { key: 'commAmount',   ask: ()  => askAmount("commission", true) },
            { key: 'accounts',     ask: ()  => askAccounts(knownAccounts) },
            { key: 'category',     ask: ()  => askCategory(knownCategories) },
            { key: 'comment',      ask: ()  => askComment(knownComments) },
        ];

        const results: Record<string, any> = {};
        let i = 0;

        while (i < slots.length) {
            try {
                results[slots[i].key] = await slots[i].ask(results);
                i++;
            } catch (e) {
                if (e instanceof CancelPromptError) {
                    if (i > 0) i--;
                    continue;
                }
                if (e instanceof ExitPromptError) {
                    return;
                }
                throw e;
            }
        }

        const opFrom = results.srcAmount ? parseAmount(`${results.srcCurrency}${results.srcAmount}`) : undefined;
        const opTo = results.dstAmount ? parseAmount(`${results.dstCurrency}${results.dstAmount}`) : undefined;
        const commissions = results.commAmount ? parseAmount(`${results.commCurrency}${results.commAmount}`) : undefined;

        results.accounts.forEach((account: string) => knownAccounts.add(account))
        knownComments.add(results.comment)
        knownCategories.add(results.category)

        const record: TransactionRecord = {
            date: results.date,
            operation: { from: opFrom, to: opTo },
            commissions: commissions ?? {
                currency: (opFrom?.currency ?? opTo?.currency) as Currency,
                value: 0
            },
            accounts: results.accounts,
            category: results.category,
            comment: results.comment,
        };

        db.addRecord(record)
        logger.info(`Transaction was added: ${formatTransactionRecord(record)}`);

        lastTransaction = record
    }
}
