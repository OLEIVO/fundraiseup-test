import { depersonalizationFn } from './depersonalization-fn'

export const depersonalizationEmailFn = (text: string) => {
    const email_prefix_end = text.search('@')

    if (email_prefix_end === -1) {
        return text
    }

    const email_postfix = text.slice(email_prefix_end, text.length)
    const depersonalization_email_prefix = depersonalizationFn()

    return depersonalization_email_prefix + email_postfix
}
