import winston from "winston";

export function parseDate(value: string): Date {
    const [year, month, day] = value.trim().split('.').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day) || day === 0) {
        throw new Error("invalid date format: expected YYYY.MM.DD")
    }

    return new Date(year, month - 1, day); // month is 0-indexed
}

export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // month is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}.${month}.${day}`;
}

export function parseNumber(value: string): number {
    const rawValue = value.replace(/\s/g, '').replace(',', '.');
    const parsedValue = parseFloat(rawValue);

    if (isNaN(parsedValue)) {
        throw new Error(`Invalid number: ${rawValue}`);
    }

    return parsedValue
}

/* Number(1,000,000.00) -> String(1 000 000,00) */
export function formatMoney(value: number): string {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).replace(',', ' ').replace('.', ',')
}

export function readPartialDate(input: string, lastDate?: Date): Date {
    const parts = input.split('.').map(Number);

    if (input === "") {
        if (!lastDate) {
            throw new Error("no default date available")
        }

        return lastDate
    }

    if (parts.length === 1) {
        const day = parts[0];

        if (!lastDate) {
            throw new Error("incomplete date format is not available: no default date available")
        }

        const curDate = formatDate(lastDate).split('.')
        curDate[2] = day.toString().padStart(2, '0')

        return parseDate(curDate.join('.'))
    }

    if (parts.length === 2) {
        const [month, day] = parts;

        if (!lastDate) {
            throw new Error("incomplete date format is not available: no default date available")
        }

        const curDate = formatDate(lastDate).split('.')
        curDate[1] = month.toString().padStart(2, '0')
        curDate[2] = day.toString().padStart(2, '0')

        return parseDate(curDate.join('.'))
    }

    if (parts.length === 3) {
        return parseDate(input)
    }

    throw new Error("wrong date format, expected YYYY.MM.DD")
}

export function createLogger(level: string = 'debug'): winston.Logger {
    return winston.createLogger({
        level: level,

        format: winston.format.combine(
            winston.format.printf(({ level, message }) => {
                const indent = ' '.repeat(level.length + 2);  // For ': ' after the level
                const indentedMessage = message.split('\n').map(
                    (line: string, index: number) => index === 0 ? line : indent + line
                ).join('\n');

                const colorize = (l: string) => winston.format.colorize().colorize(l, l)

                return `${colorize(level)}: ${indentedMessage}`;
            }),
        ),

        transports: [
            new winston.transports.Console({
                stderrLevels: ['error', 'warn', 'info', 'debug'],
                handleExceptions: true
            })
        ]
    });
}
