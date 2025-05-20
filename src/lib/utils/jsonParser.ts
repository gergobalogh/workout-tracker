export function tryParseJSON(str: string) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error('JSON parse error', e);
        return { error: 'Could not parse JSON output.' };
    }
}
