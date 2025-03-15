import { input, select, search } from '@inquirer/prompts';
import { Currency, Category, Amount, parseAmountValue, parseAmount, } from './model';
import { formatDate, readPartialDate } from './utils';

export async function askDate(lastTxDate?: Date): Promise<Date> {
    const dateSuggest: string = lastTxDate ? formatDate(lastTxDate) : "YYYY.MM.DD"

    const date = await input({
        message: `Enter the date [${dateSuggest}]:`,
        validate: (input: string) => {
            try {
                readPartialDate(input, lastTxDate);
                return true

            } catch (e) {
                if (e instanceof Error) {
                    return e.message
                }
                return JSON.stringify(e)
            }
        }
    });

    return readPartialDate(date, lastTxDate)!;
}

export async function askMoney(fldName: string, allowEmpty: boolean, currencies: Set<Currency>, defaultCurrency?: Currency): Promise<Amount | undefined> {
    const currency = await search({
        message: `${fldName} currency:`,
        source: (term: string | undefined) => {
            const vals = Array.from(currencies).sort()

            if (defaultCurrency && vals.includes(defaultCurrency)) {
                vals.splice(vals.indexOf(defaultCurrency), 1)
                vals.unshift(defaultCurrency)
            }

            if (!term) {
                return vals.map((v) => ({ name: v, value: v }))
            }

            const filtered = vals.filter(
                (v: string) => v.toLowerCase().startsWith(term!.toLowerCase())
            )

            return allowCustomValue(term, filtered).map(
                (v) => ({ name: v, value: v })
            )
        }
    }) as Currency;

    const amount = await input({
        message: `Enter the amount for ${fldName}:`,
        validate: (input: string) => {
            if (input === "") {
                return allowEmpty ? true : 'Empty amount is not allowed'
            }

            parseAmountValue(input);
            return true
        }
    });

    if (amount === "") {
        return undefined
    }

    return parseAmount(`${currency}${amount}`);
}

export async function askAccounts(accounts: Set<string>): Promise<string[]> {
    const accountsStr = await input({
        message: 'Enter the accounts involved to transaction:',
        validate: (input: string) => {
            return input.length > 0 || 'At least one account is required'
        }
    });

    return accountsStr.split(',');
}

export async function askCategory(categories: Set<Category>): Promise<Category> {
    const category = await search({
        message: 'Choose a category:',
        source: (term: string | undefined) => {
            const cats = Array.from(categories).sort()
            if (!term) {
                return cats.map((cat) => ({ name: cat, value: cat }))
            }

            const filtered = cats.filter(
                (v: string) => v.toLowerCase().startsWith(term!.toLowerCase())
            )

            return allowCustomValue(term, filtered).map(
                (cat) => ({ name: cat, value: cat })
            )
        }
    });

    return category;
}

export async function askComment(comments: Set<string>): Promise<string> {
    const comment = await search({
        message: 'Comment:',
        source: (term: string | undefined) => {
            const comms = Array.from(comments).sort()
            if (!term) {
                return comms.map((c) => ({ name: c, value: c }))
            }

            const filtered = comms.filter(
                (v: string) => v.toLowerCase().startsWith(term!.toLowerCase())
            )

            return allowCustomValue(term, filtered).map(
                (val) => ({ name: val, value: val })
            )
        }
    });

    return comment;
}

function allowCustomValue(term: string, values: string[]) : string[] {
    if (values.includes(term)) {
        return values
    }

    return [term, ...values]
}
