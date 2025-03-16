import { input, select, search } from '@inquirer/prompts';
import { Currency, Category, Amount, parseAmountValue, parseAmount, } from './model';
import * as utils from './utils';

export async function askDate(lastTxDate?: Date): Promise<Date> {
    const dateSuggest: string = lastTxDate ? utils.formatDate(lastTxDate) : "YYYY.MM.DD"

    const date = await input({
        message: `Enter the date [${dateSuggest}]:`,
        validate: (input: string) => {
            try {
                utils.readPartialDate(input, lastTxDate);
                return true

            } catch (e) {
                if (e instanceof Error) {
                    return e.message
                }
                return JSON.stringify(e)
            }
        }
    });

    return utils.readPartialDate(date, lastTxDate)!;
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

            const filtered = utils.smartSearch(term, vals)
            return utils.allowCustomValue(term, filtered).map(
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
    const accountsStr = await search({
        message: 'Enter the accounts involved into transaction:',
        source: (term: string | undefined) => {
            const vals = Array.from(accounts).sort()

            const termAccs = term?.split(',').map((v) => v.trim()) ?? []

            const current = termAccs.pop() ?? ''
            const prefix = termAccs.length > 0 ? termAccs.join(',') + ',' : ''

            const found = utils.smartSearch(current, vals)

            return utils.allowCustomValue(current, found).map(
                (v) => ({ name: `${prefix}${v}`, value: `${prefix}${v}` })
            )
        }
    });

    return accountsStr.split(',');
}

export async function askCategory(categories: Set<Category>): Promise<Category> {
    const category = await search({
        message: 'Choose a category:',
        source: (term: string | undefined) => {
            const vals = Array.from(categories).sort()
            if (!term) {
                return vals.map((v) => ({ name: v, value: v }))
            }

            const filtered = utils.smartSearch(term, vals)
            return utils.allowCustomValue(term, filtered).map(
                (v) => ({ name: v, value: v })
            )
        }
    });

    return category;
}

export async function askComment(comments: Set<string>): Promise<string> {
    const comment = await search({
        message: 'Comment:',
        source: (term: string | undefined) => {
            const vals = Array.from(comments).sort()
            if (!term) {
                return vals.map((c) => ({ name: c, value: c }))
            }

            const filtered = utils.smartSearch(term ?? '', vals)
            return utils.allowCustomValue(term, filtered).map(
                (val) => ({ name: val, value: val })
            )
        }
    });

    return comment;
}
