import { Pool } from 'pg'

export const langfuseDb = new Pool({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
})
