import winston from 'winston'
import { Currency, formatTransactionRecord, TransactionRecord, parseAmount, Amount } from './model';
import { DB } from './db';
import { askDate, askCurrency, askAmount, askAccounts, askCategory, askComment, CancelPromptError, ExitPromptError } from './interface';
import { formatMoney } from './utils';

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

type CurrencyTotals = Map<Currency, number>;

interface CategoryStats {
    in: CurrencyTotals;
    out: CurrencyTotals;
}

interface AccountStats {
    in: CurrencyTotals;
    out: CurrencyTotals;
    byCategory: Map<string, CategoryStats>;
}

function addToTotals(totals: CurrencyTotals, amount: Amount): void {
    totals.set(amount.currency, (totals.get(amount.currency) ?? 0) + amount.value);
}

function formatTotals(totals: CurrencyTotals): string {
    return Array.from(totals.entries())
        .map(([currency, value]) => `${currency} ${formatMoney(value)}`)
        .join('  ');
}

function balanceTotals(statsIn: CurrencyTotals, statsOut: CurrencyTotals): CurrencyTotals {
    const balance: CurrencyTotals = new Map();
    const currencies = new Set([...statsIn.keys(), ...statsOut.keys()]);
    for (const c of currencies) {
        balance.set(c, (statsIn.get(c) ?? 0) - (statsOut.get(c) ?? 0));
    }
    return balance;
}

export function reportDB(logger: winston.Logger,
    options?: {
        dbFile?: string
    },
): string[] {
    const dbFile = dbFileName(options?.dbFile)
    const db = new DB(dbFile)

    const accounts = new Map<string, AccountStats>();

    function getAccount(name: string): AccountStats {
        let stats = accounts.get(name);
        if (!stats) {
            stats = { in: new Map(), out: new Map(), byCategory: new Map() };
            accounts.set(name, stats);
        }
        return stats;
    }

    function getCategoryStats(account: AccountStats, category: string): CategoryStats {
        let stats = account.byCategory.get(category);
        if (!stats) {
            stats = { in: new Map(), out: new Map() };
            account.byCategory.set(category, stats);
        }
        return stats;
    }

    for (const record of db.records) {
        const isIn = !record.operation.from && !!record.operation.to;
        const isOut = !!record.operation.from && !record.operation.to;

        for (const accountName of record.accounts) {
            const account = getAccount(accountName);
            const catStats = getCategoryStats(account, record.category);

            if (isIn) {
                addToTotals(account.in, record.operation.to!);
                addToTotals(catStats.in, record.operation.to!);
            } else if (isOut) {
                addToTotals(account.out, record.operation.from!);
                addToTotals(catStats.out, record.operation.from!);
            }
        }
    }

    const lines: string[] = [];

    for (const [name, stats] of accounts) {
        lines.push(`=== ${name} ===`);
        lines.push(`  In:      ${formatTotals(stats.in) || '-'}`);
        lines.push(`  Out:     ${formatTotals(stats.out) || '-'}`);
        lines.push(`  Balance: ${formatTotals(balanceTotals(stats.in, stats.out)) || '-'}`);

        if (stats.byCategory.size > 0) {
            lines.push(`  By category:`);
            for (const [category, catStats] of stats.byCategory) {
                const parts: string[] = [];
                const inStr = formatTotals(catStats.in);
                const outStr = formatTotals(catStats.out);
                if (inStr) parts.push(`in: ${inStr}`);
                if (outStr) parts.push(`out: ${outStr}`);
                lines.push(`    ${category}: ${parts.join('  ')}`);
            }
        }

        lines.push('');
    }

    return lines;
}
