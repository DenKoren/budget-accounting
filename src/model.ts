import { formatDate, formatMoney, parseDate, parseNumber } from "./utils";

export type Currency = '$' | '€' | '₽';

export interface Amount {
    currency: Currency;
    value: number;
}

export interface Operation {
    from?: Amount;
    to?: Amount;
}

export interface TransactionRecord {
    date: Date;
    operation: Operation;
    commissions: Amount;
    category: Category;
    comment: string;
}

export type Category = string;

export function parseAmount(value: string): Amount {
    const match = value.match(/^([^\d]+)([\d\s,.+]+)$/);
    if (!match) {
        throw new Error(`Invalid amount format: ${value}`);
    }
    const currency = match[1].trim() as Currency;
    const rawValue = match[2].trim();
    const parsedValue = parseAmountValue(rawValue);

    return { currency, value: parsedValue };
}

export function parseAmountValue(value: string): number {
    const parts = value.split("+").map((v:string) => parseNumber(v.trim()))

    var result: number = 0
    for (const p of parts) {
        result += p
    }

    return result
}

export function formatAmount(amount: Amount): string {
    return `${amount.currency} ${formatMoney(amount.value)}`;
}

export function parseOperation(value: string): Operation {
    const [fromPart, toPart] = value.split('->').map(part => part.trim());

    const from = fromPart ? parseAmount(fromPart) : undefined;
    const to = toPart ? parseAmount(toPart) : undefined;

    return { from, to };
}

export function formatOperation(operation: Operation): string {
    const from = operation.from ? formatAmount(operation.from) : '';
    const to = operation.to ? formatAmount(operation.to) : '';
    return `${from} -> ${to}`;
}

export function parseTransactionRecord(line: string): TransactionRecord {
    const fields = line.split(';');

    if (fields.length !== 5 && (fields.length !== 6 || fields[5] !== "")) {
        throw new Error(`incorrect number of fields: ${fields.length} instead of 5`)
    }

    const [date, operationStr, commissionsStr, category, comment] = fields
    const operation = parseOperation(operationStr);
    const commissions = parseAmount(commissionsStr);
    return {
        date: parseDate(date),
        operation: operation,
        commissions: commissions,
        category: category.trim(),
        comment: comment.trim(),
    };
}

export function formatTransactionRecord(record: TransactionRecord): string {
    const date = formatDate(record.date);
    const operation = formatOperation(record.operation);
    const commissions = formatAmount(record.commissions);
    return [date, operation, commissions, record.category, record.comment].join('; ').trim();
}
