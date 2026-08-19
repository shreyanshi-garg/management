import { format } from 'date-fns'

/** Local (not UTC) day key — the single definition of "a day" in the app. */
export const dayKey = (d = new Date()) => format(d, 'yyyy-MM-dd')

/** 'yyyy-MM-dd' -> Date, without the UTC shift `new Date('2026-08-19')` would apply. */
export const parseDay = (key) => new Date(key.replace(/-/g, '/'))
