import * as fs from 'fs';
import { TransactionRecord, Currency, Category, parseTransactionRecord, formatTransactionRecord } from './model';

export class DB {
    private _records: TransactionRecord[];

    constructor(
        private filePath: string
    ) {
        this._records = this.readRecords();
    }

    private readRecords(): TransactionRecord[] {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const lines = data.trim().split('\n');

        return lines.slice(1).map((line, lineNo) => {
            try {
                return parseTransactionRecord(line)
            } catch (e) {
                throw new Error(`line ${lineNo+2}: ` + e)
            }
        });
    }

    private writeRecords(): void {
        const header = 'Date; Operation; Commissions; Category; Comment';
        const lines = this._records.map(formatTransactionRecord)
        fs.writeFileSync(this.filePath, `${header}\n${lines.join('\n')}\n`);
    }

    public get records(): readonly TransactionRecord[] {
        return this._records
    }

    public addRecord(record: TransactionRecord): void {
        this._records.push(record);
        this.writeRecords();
    }

    public get categories(): Set<Category> {
        const categories = new Set<Category>();
        this._records.forEach(record => categories.add(record.category));
        return categories
    }

    public get lastTransaction(): TransactionRecord | undefined {
        return this._records.length ? this._records[this._records.length - 1] : undefined;
    }

    public get currencies(): Set<Currency> {
        const currencies = new Set<Currency>();
        this._records.forEach(record => {
            if (record.operation.from) {
                currencies.add(record.operation.from.currency);
            }
            if (record.operation.to) {
                currencies.add(record.operation.to.currency);
            }
        });
        return currencies;
    }
}
