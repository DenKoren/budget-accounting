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
    const currency = await select({
        message: `${fldName} currency:`,
        choices: Array.from(currencies).sort().map(currency => ({ name: currency, value: currency })),
        default: defaultCurrency,
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

export async function askCategory(categories: Set<Category>): Promise<Category> {
    const category = await search({
        message: 'Choose a category:',
        source: (term: string | undefined) => {
            const cats = Array.from(categories).sort()
            if (!term) {
                return cats.map((cat) => ({ name: cat, value: cat }))
            }

            return cats.
                filter(
                    (v: string) => v.toLowerCase().startsWith(term!.toLowerCase())
                ).
                map(
                    (cat) => ({ name: cat, value: cat })
                )
        }
    });

    return category;
}

export async function askComment(): Promise<string> {
    const comment = await input({
        message: 'Enter a comment:',
        validate: (input: string) => !input.includes(';') || 'Comment cannot contain a semicolon'
    });

    return comment;
}
